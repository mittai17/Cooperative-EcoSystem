
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const DEMO_ROLE_COOKIE = 'coopsetu_demo_role';
// Demo persona role -> backend dev-demo key (see backend/app/dev_demo_auth.py).
const DEMO_ROLE_TO_KEY = new Map<string, string>([
  ['employer', 'demo-employer'],
  ['admin', 'demo-admin'],
  ['trainee', 'demo-trainee'],
  ['trainer', 'demo-trainer'],
  ['institution', 'demo-institution'],
]);

/** Client-side only: the active demo persona role, or null (SSR, no cookie, unreadable). */
function readDemoRoleCookie(): string | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  try {
    const entry = document.cookie
      .split(';')
      .map((pair) => pair.trim())
      .find((pair) => pair.startsWith(`${DEMO_ROLE_COOKIE}=`));
    if (!entry) return null;
    return decodeURIComponent(entry.slice(DEMO_ROLE_COOKIE.length + 1));
  } catch {
    return null;
  }
}

/** Bearer token for a request: `demo:<key>` for an active demo persona, else the legacy placeholder. */
function resolveAuthToken(): string {
  const role = readDemoRoleCookie();
  const key = role ? DEMO_ROLE_TO_KEY.get(role) : undefined;
  return key ? `demo:${key}` : 'mock_token';
}

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = resolveAuthToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export function getApiBase() {
  return API_BASE;
}
