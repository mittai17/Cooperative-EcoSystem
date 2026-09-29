import { NativeModules, Platform } from 'react-native';
import {
  Course,
  JobMatch,
  SkillPassportData,
  CertificateItem,
  AttendanceRecordItem,
  CareerRecommendation,
  CareerPlanStep,
  OfflinePackage,
  TraineeProfile,
} from '../types';

const API_PORT = 8000;

/**
 * Host of the Metro dev server that served this bundle. Physical devices and
 * emulators reach the dev machine on that address, so the backend (same
 * machine, port 8000) is reachable there too. Read from the RN SourceCode
 * module because expo-constants is not resolvable from this package (it is
 * nested under expo/node_modules). Returns null in release builds, where the
 * script URL is a file/asset path.
 */
function devServerHost(): string | null {
  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  const match = scriptURL ? /^https?:\/\/([^/:]+)/.exec(scriptURL) : null;
  return match ? match[1] : null;
}

/**
 * Backend origin resolution (native):
 *   1. EXPO_PUBLIC_API_BASE_URL (e.g. https://api.example.com or http://192.168.1.5:8000)
 *   2. the Metro dev server host on port 8000 (Expo Go / dev builds)
 *   3. Android emulator alias for the host machine (10.0.2.2), else localhost
 */
function resolveNativeApiBase(): string {
  const override = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (override) {
    return `${override.replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1`;
  }
  const host = devServerHost() ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return `http://${host}:${API_PORT}/api/v1`;
}

// On web, go through the Metro dev server's same-origin /api-proxy (see
// metro.config.js) to avoid the real backend's CORS allowlist, which only
// permits http://localhost:3000 and http://localhost:8000.
export const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy/api/v1' : resolveNativeApiBase();

// The hosted database answers in 1-2 s; anything slower than this is treated as offline.
const REQUEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Auth wiring. Identity is the Clerk session JWT: the backend derives the
// trainee from the verified token, so the client never sends a trainee id.
// ---------------------------------------------------------------------------

export type TokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** Called by AuthProvider once Clerk is ready; pass nulls on teardown. */
export function configureAuthClient(config: { getToken: TokenGetter | null; onUnauthorized: (() => void) | null }) {
  tokenGetter = config.getToken;
  unauthorizedHandler = config.onUnauthorized;
}

/** Non-2xx answer from the backend (network failures are plain TypeErrors / AbortErrors). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractErrorMessage(err: any, fallback: string): string {
  if (!err) return fallback;
  if (typeof err.detail === 'string') return err.detail;
  if (Array.isArray(err.detail)) {
    const first = err.detail[0];
    if (first && typeof first.msg === 'string') {
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : '';
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }
  return fallback;
}

/** fetch() that aborts after `timeoutMs` so requests never hang the UI. */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildInit(init: RequestInit | undefined, token: string | null): RequestInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init?.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return { ...init, headers: { ...headers, ...((init?.headers as Record<string, string>) || {}) } };
}

/**
 * Backend call with the Clerk session token. The token is requested per call
 * (Clerk caches it and refreshes it before expiry). On 401 the token is force
 * refreshed and the call retried once; a second 401 signs the user out.
 */
async function authedFetch(path: string, init?: RequestInit, timeoutMs?: number): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const send = async (skipCache: boolean) => {
    const token = tokenGetter ? await tokenGetter({ skipCache }) : null;
    return fetchWithTimeout(url, buildInit(init, token), timeoutMs);
  };
  let res = await send(false);
  if (res.status === 401 && tokenGetter) {
    res = await send(true);
    if (res.status === 401) unauthorizedHandler?.();
  }
  return res;
}

async function readJson(res: Response): Promise<any> {
  return res.json().catch(() => ({}));
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  throw new ApiError(res.status, extractErrorMessage(await readJson(res), fallback));
}

/**
 * GET-style read. On any failure (offline, timeout, non-2xx) it returns the
 * caller's empty value with isLive=false; screens show the Offline badge.
 * There is no sample-data fallback.
 */
async function readLive<T>(path: string, empty: T): Promise<{ data: T; isLive: boolean }> {
  try {
    const res = await authedFetch(path);
    if (!res.ok) return { data: empty, isLive: false };
    return { data: (await res.json()) as T, isLive: true };
  } catch {
    return { data: empty, isLive: false };
  }
}

const QR_PREFIX = 'coopsetu:attend:';

/** The generate endpoint returns 'coopsetu:attend:<token>'; the scan endpoint accepts both forms. */
export function normalizeAttendanceToken(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.toLowerCase().startsWith(QR_PREFIX) ? trimmed.slice(QR_PREFIX.length).trim() : trimmed;
}

const EMPTY_PASSPORT: SkillPassportData = {
  skills: [],
  summary: { total_skills: 0, verified_count: 0, avg_confidence: 0 },
};

// ---------------------------------------------------------------------------
// Identity endpoints
// ---------------------------------------------------------------------------

export interface MeResponse {
  id?: string;
  clerk_user_id: string;
  email?: string;
  full_name?: string;
  role: string;
  synced: boolean;
  message?: string;
  organisation?: { id: string; name: string; type: string } | null;
  trainee?: TraineeProfile | null;
}

export interface DemoAccount {
  role: string;
  email: string;
  name: string;
}

export const authApi = {
  /** GET /auth/me. Throws ApiError (non-2xx) or a network error. */
  async me(): Promise<MeResponse> {
    const res = await authedFetch('/auth/me');
    if (!res.ok) return throwApiError(res, 'Could not load your account');
    return (await res.json()) as MeResponse;
  },

  /** POST /auth/provision: creates the local row from the Clerk profile (idempotent). */
  async provision(): Promise<void> {
    const res = await authedFetch('/auth/provision', { method: 'POST' });
    if (!res.ok) await throwApiError(res, 'Could not set up your account');
  },

  /** POST /auth/sync: sync user details including role and name to local DB */
  async syncUser(payload: {
    clerk_user_id: string;
    email: string;
    full_name?: string;
    role?: string;
  }): Promise<void> {
    try {
      await authedFetch('/auth/sync', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  },

  /** GET /auth/demo-accounts (public). Any failure means the demo section stays hidden. */
  async demoAccounts(): Promise<{ enabled: boolean; accounts: DemoAccount[] }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/auth/demo-accounts`, buildInit(undefined, null));
      if (!res.ok) return { enabled: false, accounts: [] };
      const data = await res.json();
      return {
        enabled: data?.enabled === true,
        accounts: Array.isArray(data?.accounts) ? (data.accounts as DemoAccount[]) : [],
      };
    } catch {
      return { enabled: false, accounts: [] };
    }
  },

  /** POST /auth/demo-login (public): returns a single-use Clerk sign-in ticket. */
  async demoLogin(role: string): Promise<string> {
    let res: Response;
    try {
      res = await fetchWithTimeout(
        `${API_BASE_URL}/auth/demo-login`,
        buildInit({ method: 'POST', body: JSON.stringify({ role }) }, null)
      );
    } catch {
      throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
    }
    if (!res.ok) {
      const fallback =
        res.status === 429
          ? 'Too many demo sign-ins. Wait a minute and try again.'
          : 'Demo sign-in is not available right now.';
      return throwApiError(res, fallback);
    }
    const data = await res.json();
    if (typeof data?.ticket !== 'string' || !data.ticket) {
      throw new ApiError(res.status, 'Demo sign-in returned no ticket.');
    }
    return data.ticket;
  },
};

// ---------------------------------------------------------------------------
// Trainee endpoints
// ---------------------------------------------------------------------------

export const apiService = {
  async getCourses(): Promise<{ courses: Course[]; isLive: boolean }> {
    const res = await readLive<{ courses?: Course[] }>('/mobile/courses', {});
    const courses = (res.data.courses ?? []).map((c) => ({
      ...c,
      category: c.category ?? '',
      instructor: c.instructor ?? '',
      skills: c.skills ?? [],
      progress: c.progress ?? 0,
      modules: c.modules ?? [],
    }));
    return { courses, isLive: res.isLive };
  },

  /**
   * Persists a lesson toggle. Returns the recomputed course progress (0-100)
   * on success; throws ApiError / network error so the caller can roll back.
   */
  async setModuleProgress(courseId: string, moduleId: string, completed: boolean): Promise<number | null> {
    const res = await authedFetch(
      `/mobile/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/progress`,
      { method: 'POST', body: JSON.stringify({ completed }) }
    );
    if (!res.ok) return throwApiError(res, 'Could not save your progress');
    const data = await readJson(res);
    return typeof data.course_progress === 'number' ? data.course_progress : null;
  },

  async getJobs(): Promise<{ jobs: JobMatch[]; isLive: boolean }> {
    const res = await readLive<{ jobs?: JobMatch[] }>('/mobile/jobs', {});
    const jobs = (res.data.jobs ?? []).map((j) => ({
      ...j,
      title: j.title ?? '',
      employer: j.employer ?? '',
      location: j.location ?? '',
      sector: j.sector ?? '',
      type: j.type ?? '',
      salary: j.salary ?? '',
      skills_required: Array.isArray(j.skills_required) ? j.skills_required : [],
    }));
    return { jobs, isLive: res.isLive };
  },

  async applyToJob(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await authedFetch(`/jobs/${encodeURIComponent(jobId)}/apply`, { method: 'POST' });
      if (res.ok) {
        const data = await readJson(res);
        return { success: true, message: typeof data.message === 'string' ? data.message : 'Application submitted' };
      }
      return { success: false, message: extractErrorMessage(await readJson(res), 'Could not submit the application') };
    } catch {
      return { success: false, message: 'No connection. Try again when you are online.' };
    }
  },

  async getOfflinePackages(): Promise<{ packages: OfflinePackage[]; isLive: boolean }> {
    const res = await readLive<{ packages?: OfflinePackage[] }>('/mobile/offline/packages', {});
    return { packages: res.data.packages ?? [], isLive: res.isLive };
  },

  /** Marks the package downloaded server-side and returns it (with the full course to store locally). */
  async downloadOfflinePackage(courseId: string): Promise<OfflinePackage> {
    const res = await authedFetch(`/mobile/offline/packages/${encodeURIComponent(courseId)}/download`, {
      method: 'POST',
    });
    if (!res.ok) return throwApiError(res, 'Could not download this course');
    return (await res.json()) as OfflinePackage;
  },

  async removeOfflinePackage(courseId: string): Promise<void> {
    const res = await authedFetch(`/mobile/offline/packages/${encodeURIComponent(courseId)}`, { method: 'DELETE' });
    if (!res.ok) await throwApiError(res, 'Could not remove this download');
  },

  async getSkillPassport(): Promise<{ passport: SkillPassportData; isLive: boolean }> {
    const res = await readLive<SkillPassportData>('/skills/my-passport', EMPTY_PASSPORT);
    return { passport: res.data, isLive: res.isLive };
  },

  async getCertificates(): Promise<{ certificates: CertificateItem[]; isLive: boolean }> {
    const res = await readLive<{ certificates?: CertificateItem[] }>('/certificates/my', {});
    const certificates = (res.data.certificates ?? []).map((c) => ({
      ...c,
      holder_name: c.holder_name ?? '',
      programme_title: c.programme_title ?? '',
      issuer: c.issuer ?? '',
      skills_certified: c.skills_certified ?? [],
    }));
    return { certificates, isLive: res.isLive };
  },

  async getAttendanceRecords(): Promise<{
    records: AttendanceRecordItem[];
    /** overall attendance % as computed by the server; null when unavailable */
    percentage: number | null;
    isLive: boolean;
  }> {
    const res = await readLive<{ records?: AttendanceRecordItem[]; overall_percentage?: number }>(
      '/attendance/my',
      {}
    );
    return {
      records: res.data.records ?? [],
      percentage:
        res.isLive && typeof res.data.overall_percentage === 'number' ? res.data.overall_percentage : null,
      isLive: res.isLive,
    };
  },

  async recordAttendanceScan(qrToken: string): Promise<{ success: boolean; message: string; isLive: boolean }> {
    try {
      const res = await authedFetch('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({ qr_token: normalizeAttendanceToken(qrToken) }),
      });
      if (res.ok) {
        const data = await readJson(res);
        return { success: true, message: `Recorded for ${data.session || 'Session'}`, isLive: true };
      }
      return { success: false, message: extractErrorMessage(await readJson(res), 'Scan failed'), isLive: true };
    } catch {
      // Unreachable server: the caller queues the token for a later sync.
      return {
        success: true,
        message: 'Attendance recorded locally in offline queue. Will sync when reconnected.',
        isLive: false,
      };
    }
  },

  async sendCareerChat(message: string): Promise<{ reply: string; ok: boolean }> {
    try {
      // Generation can take a while; the backend answers within its own limits.
      const res = await authedFetch('/career/chat', { method: 'POST', body: JSON.stringify({ message }) }, 30000);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.response === 'string' && data.response) return { reply: data.response, ok: true };
      }
      return { reply: 'The advisor could not answer right now. Please try again.', ok: false };
    } catch {
      return { reply: 'No connection. The career advisor needs you to be online.', ok: false };
    }
  },

  async getCareerGuidance(): Promise<{
    recommendations: CareerRecommendation[];
    career_path: CareerPlanStep[];
    target_role: string | null;
    /** readiness % for the target role; only provided by the server */
    current_match: number | null;
    isLive: boolean;
  }> {
    const res = await readLive<{
      recommendations?: CareerRecommendation[];
      career_path?: CareerPlanStep[];
      target_role?: string;
      current_match?: number;
    }>('/career/recommendations', {});
    return {
      recommendations: res.data.recommendations ?? [],
      career_path: res.data.career_path ?? [],
      target_role: res.isLive ? (res.data.target_role ?? null) : null,
      current_match: res.isLive && typeof res.data.current_match === 'number' ? res.data.current_match : null,
      isLive: res.isLive,
    };
  },
};
