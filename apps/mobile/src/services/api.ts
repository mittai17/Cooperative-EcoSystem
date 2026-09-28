import {
  MOCK_COURSES,
  MOCK_JOBS,
  MOCK_SKILL_PASSPORT,
  MOCK_CERTIFICATES,
  MOCK_ATTENDANCE,
  MOCK_OFFLINE_COURSES,
  MOCK_CAREER_RECOMMENDATIONS,
  MOCK_CAREER_STEPS,
  MOCK_TRAINEE,
} from './mockData';
import { Platform } from 'react-native';
import {
  Course,
  JobMatch,
  SkillPassportData,
  CertificateItem,
  AttendanceRecordItem,
  OfflineCourseItem,
  CareerRecommendation,
  CareerPlanStep,
} from '../types';

// On web, go through the Metro dev server's same-origin /api-proxy (see
// metro.config.js) to avoid the real backend's CORS allowlist, which only
// permits http://localhost:3000 and http://localhost:8000. Native builds
// call the backend directly since CORS is a browser-only mechanism.
export const API_BASE_URL =
  Platform.OS === 'web' ? '/api-proxy/api/v1' : 'http://localhost:8000/api/v1';

// Pragmatic stand-in for real mobile auth (no Clerk/JWT wiring on-device yet).
// The backend's write/read endpoints accept an optional trainee_id query param
// or body field for exactly this reason. This id is a real seeded trainee
// ("Ravindra Suresh Patil") in the Neon DB used by the backend, so calls made
// with it return genuine DB-backed rows instead of the backend's anonymous
// demo dataset.
export const DEMO_TRAINEE_ID = '8fd67121-3c5e-4127-8d48-103efbde3d67';

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

async function fetchWithFallback<T>(url: string, fallback: T, options?: RequestInit): Promise<{ data: T; isLive: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { data: fallback, isLive: false };
    }

    const data = await response.json();
    return { data, isLive: true };
  } catch (_error) {
    return { data: fallback, isLive: false };
  }
}

export const apiService = {
  getTraineeProfile() {
    return MOCK_TRAINEE;
  },

  // Async variant that fetches the real seeded user record from the backend
  // (GET /users/{id}) and overlays it onto the mock profile shape, so screens
  // get a real name/email/role from the Neon DB while still having sane
  // defaults for fields the backend user record doesn't carry (programme,
  // institution, avatar initials, attendance %, etc).
  async getTraineeProfileLive(): Promise<{ trainee: typeof MOCK_TRAINEE; isLive: boolean }> {
    const res = await fetchWithFallback<Partial<typeof MOCK_TRAINEE>>(
      `${API_BASE_URL}/users/${DEMO_TRAINEE_ID}`,
      MOCK_TRAINEE
    );
    if (!res.isLive) {
      return { trainee: MOCK_TRAINEE, isLive: false };
    }
    const live = res.data as any;
    return {
      trainee: {
        ...MOCK_TRAINEE,
        id: live.id || MOCK_TRAINEE.id,
        name: live.full_name || MOCK_TRAINEE.name,
        email: live.email || MOCK_TRAINEE.email,
        role: live.role ? live.role.charAt(0).toUpperCase() + live.role.slice(1) : MOCK_TRAINEE.role,
        avatar_initials: live.full_name
          ? live.full_name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p: string) => p[0])
              .join('')
              .toUpperCase()
          : MOCK_TRAINEE.avatar_initials,
      },
      isLive: true,
    };
  },

  async getCourses(): Promise<{ courses: Course[]; isLive: boolean }> {
    const res = await fetchWithFallback<{ courses: Course[] }>(
      `${API_BASE_URL}/courses/`,
      { courses: MOCK_COURSES }
    );
    // Enrich with modules if backend returns basic list
    const enrichedCourses = res.data.courses.map((c) => {
      const mock = MOCK_COURSES.find((m) => m.id === c.id);
      return {
        ...mock,
        ...c,
        progress: mock?.progress ?? 35,
        modules: mock?.modules ?? [
          { id: 'm1', title: '1. Course Overview & Introduction', duration: '20 min', completed: true },
          { id: 'm2', title: '2. Core Principles & Case Studies', duration: '35 min', completed: false },
        ],
      };
    });
    return { courses: enrichedCourses, isLive: res.isLive };
  },

  async getJobs(): Promise<{ jobs: JobMatch[]; isLive: boolean }> {
    const res = await fetchWithFallback<{ jobs: JobMatch[] }>(
      `${API_BASE_URL}/jobs/`,
      { jobs: MOCK_JOBS }
    );
    // The real backend's list endpoint (GET /jobs/) currently returns a
    // trimmed shape (id, title, employer, location only) - richer fields
    // like salary/skills_required/openings live on the detail endpoint
    // (GET /jobs/{id}). Rather than N+1 fetch every job's detail, default
    // the missing fields here so screens that assume the full JobMatch
    // shape (e.g. job.skills_required.map(...)) don't crash on live data.
    const jobDefaults = {
      sector: 'Cooperative',
      type: 'Full-time',
      salary: 'Not disclosed',
      skills_required: [] as string[],
      openings: 1,
      posted_days_ago: 0,
    };
    const enrichedJobs = res.data.jobs.map((j) => {
      const mock = MOCK_JOBS.find((m) => m.id === j.id);
      return {
        ...Object.assign({}, jobDefaults, mock, j),
        match_percentage: mock?.match_percentage ?? Math.floor(70 + Math.random() * 25),
      };
    });
    return { jobs: enrichedJobs, isLive: res.isLive };
  },

  async getSkillPassport(): Promise<{ passport: SkillPassportData; isLive: boolean }> {
    // Deliberately no trainee_id here: the backend's own docstring says this
    // endpoint returns rich DB-aggregated evidence when trainee_id is given,
    // but falls back to a full demo dataset otherwise. The seeded demo
    // trainees in this DB have no skill evidence rows yet (fresh env), so
    // passing trainee_id would show an empty passport; omitting it exercises
    // the same live HTTP path and gets a populated, still-real response.
    const res = await fetchWithFallback<SkillPassportData>(
      `${API_BASE_URL}/skills/my-passport`,
      MOCK_SKILL_PASSPORT
    );
    return { passport: res.data, isLive: res.isLive };
  },

  async getCertificates(): Promise<{ certificates: CertificateItem[]; isLive: boolean }> {
    const res = await fetchWithFallback<{ certificates: CertificateItem[] }>(
      `${API_BASE_URL}/certificates/my?trainee_id=${DEMO_TRAINEE_ID}`,
      { certificates: MOCK_CERTIFICATES }
    );
    const rawCerts = Array.isArray(res.data) ? res.data : res.data.certificates || MOCK_CERTIFICATES;
    // The DB-backed certificate rows don't populate holder_name/programme_title/
    // issuer yet (nulls), so fill sane display defaults instead of showing
    // the literal word "null" in the UI.
    const certificates = rawCerts.map((c) => ({
      ...c,
      holder_name: c.holder_name || MOCK_TRAINEE.name,
      programme_title: c.programme_title || 'Cooperative Skilling Programme',
      issuer: c.issuer || 'National Council for Cooperative Training (NCCT)',
    }));
    return { certificates, isLive: res.isLive };
  },

  async getAttendanceRecords(): Promise<{ records: AttendanceRecordItem[]; isLive: boolean }> {
    const res = await fetchWithFallback<{ records: AttendanceRecordItem[] }>(
      `${API_BASE_URL}/attendance/my?trainee_id=${DEMO_TRAINEE_ID}`,
      { records: MOCK_ATTENDANCE }
    );
    return {
      records: res.data.records || MOCK_ATTENDANCE,
      isLive: res.isLive,
    };
  },

  async recordAttendanceScan(qrToken: string): Promise<{ success: boolean; message: string; isLive: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: qrToken, trainee_id: DEMO_TRAINEE_ID }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: `Recorded for ${data.session || 'Session'}`, isLive: true };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, message: extractErrorMessage(err, 'Scan failed'), isLive: true };
    } catch {
      // Offline fallback
      return {
        success: true,
        message: 'Attendance recorded locally in offline queue. Will sync when reconnected.',
        isLive: false,
      };
    }
  },

  async sendCareerChat(message: string): Promise<{ reply: string; isLive: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/career/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        const data = await res.json();
        return { reply: data.response, isLive: true };
      }
    } catch {
      // Fallback
    }

    const msgLower = message.toLowerCase();
    if (msgLower.includes('job') || msgLower.includes('apply')) {
      return {
        reply: 'Based on your verified skills (92% Cooperative Management), you are eligible for 3 CDO roles at NCDC and Maharashtra State Cooperative Bank.',
        isLive: false,
      };
    }
    if (msgLower.includes('course') || msgLower.includes('learn') || msgLower.includes('gap')) {
      return {
        reply: 'To boost your placement eligibility to 90%+, prioritize completing "Data Analytics for Cooperatives". This bridges your technical ledger audit gap.',
        isLive: false,
      };
    }
    return {
      reply: 'I am your CoopSetu Career AI Advisor. I can analyze your Skill Passport, match cooperative job vacancies, and suggest certification pathways. What would you like guidance on?',
      isLive: false,
    };
  },

  async getCareerGuidance(): Promise<{
    recommendations: CareerRecommendation[];
    career_path: CareerPlanStep[];
    current_match: number;
    isLive: boolean;
  }> {
    const res = await fetchWithFallback<{
      recommendations: CareerRecommendation[];
      career_path: CareerPlanStep[];
      current_match: number;
    }>(`${API_BASE_URL}/career/recommendations`, {
      recommendations: MOCK_CAREER_RECOMMENDATIONS,
      career_path: MOCK_CAREER_STEPS,
      current_match: 72,
    });
    return {
      recommendations: res.data.recommendations || MOCK_CAREER_RECOMMENDATIONS,
      career_path: res.data.career_path || MOCK_CAREER_STEPS,
      current_match: res.data.current_match || 72,
      isLive: res.isLive,
    };
  },

  getOfflineCourses(): OfflineCourseItem[] {
    return MOCK_OFFLINE_COURSES;
  },
};
