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
export function resolveAuthToken(): string {
  const role = readDemoRoleCookie();
  const key = role ? DEMO_ROLE_TO_KEY.get(role) : undefined;
  return key ? `demo:${key}` : 'mock_token';
}


// ── Mock data helpers ─────────────────────────────────────────────────────────
function paged<T>(items: T[], page = 1, page_size = 10) {
  const start = (page - 1) * page_size;
  return { items: items.slice(start, start + page_size), total: items.length, page, page_size };
}

const MOCK_INSTITUTIONS = [
  { id: "i1", name: "VAMNICOM", type: "National", state: "Maharashtra", district: "Pune", address: null, pincode: null, phone: null, email: null, website: null, accreditation_number: null, status: "active", trainees: 1240, trainers: 68, programmes: 6 },
  { id: "i2", name: "Amul Dairy Training Centre", type: "State", state: "Gujarat", district: "Anand", address: null, pincode: null, phone: null, email: null, website: null, accreditation_number: null, status: "active", trainees: 980, trainers: 54, programmes: 4 },
  { id: "i3", name: "NCDC Training Institute", type: "National", state: "Delhi", district: null, address: null, pincode: null, phone: null, email: null, website: null, accreditation_number: null, status: "active", trainees: 860, trainers: 42, programmes: 9 },
  { id: "i4", name: "Sahakar Bharati College", type: "State", state: "Karnataka", district: "Bengaluru", address: null, pincode: null, phone: null, email: null, website: null, accreditation_number: null, status: "active", trainees: 720, trainers: 38, programmes: 5 },
  { id: "i5", name: "Gujarat Cooperative College", type: "State", state: "Gujarat", district: "Ahmedabad", address: null, pincode: null, phone: null, email: null, website: null, accreditation_number: null, status: "inactive", trainees: 650, trainers: 36, programmes: 4 },
];

const MOCK_TRAINEES = [
  { id: "t1", full_name: "Arjun Kumar", email: "arjun@example.org", role: "trainee", organisation_id: null, organisation_name: "Anand Dairy Training Centre", state: "Gujarat", status: "active", created_at: "2026-01-20T10:00:00Z" },
  { id: "t2", full_name: "Priya Sharma", email: "priya@example.org", role: "trainee", organisation_id: null, organisation_name: "NCCU Training Institute", state: "Delhi", status: "active", created_at: "2026-02-11T10:00:00Z" },
  { id: "t3", full_name: "Ravi Teja", email: "ravi@example.org", role: "trainee", organisation_id: null, organisation_name: "VAMNICOM", state: "Maharashtra", status: "active", created_at: "2026-03-02T10:00:00Z" },
  { id: "t4", full_name: "Sneha Reddy", email: "sneha@example.org", role: "trainee", organisation_id: null, organisation_name: "Gujarat Cooperative College", state: "Gujarat", status: "inactive", created_at: "2026-04-18T10:00:00Z" },
  { id: "t5", full_name: "Mohammed Ali", email: "mali@example.org", role: "trainee", organisation_id: null, organisation_name: "Sahakar Bharati College", state: "Karnataka", status: "active", created_at: "2026-05-06T10:00:00Z" },
];

const MOCK_TRAINERS = [
  { id: "tr1", full_name: "Dr. S. Kumar", email: "skumar@example.org", role: "trainer", organisation_id: "i1", organisation_name: "VAMNICOM", state: "Maharashtra", status: "active", created_at: "2025-06-01T10:00:00Z" },
  { id: "tr2", full_name: "Prof. Meera Desai", email: "mdesai@example.org", role: "trainer", organisation_id: "i2", organisation_name: "Amul Dairy Training Centre", state: "Gujarat", status: "active", created_at: "2025-07-15T10:00:00Z" },
  { id: "tr3", full_name: "Suresh Patel", email: "spatel@example.org", role: "trainer", organisation_id: "i3", organisation_name: "NCDC Training Institute", state: "Delhi", status: "inactive", created_at: "2025-08-22T10:00:00Z" },
];

const MOCK_PROGRAMMES = [
  { id: "p1", title: "Cooperative Management Fundamentals", sector: "Management", level: "Basic", mode: "Online", duration_weeks: 4, seats_total: 50, seats_filled: 47, organisation_name: "VAMNICOM", start_date: "2026-10-01", status: "active" },
  { id: "p2", title: "Cooperative Bookkeeping & Statutory Audit", sector: "Finance", level: "Intermediate", mode: "Hybrid", duration_weeks: 6, seats_total: 60, seats_filled: 52, organisation_name: "NCDC Training Institute", start_date: "2026-10-15", status: "active" },
  { id: "p3", title: "Dairy Cooperative Operations", sector: "Agriculture", level: "Advanced", mode: "On-Campus", duration_weeks: 8, seats_total: 40, seats_filled: 40, organisation_name: "Amul Dairy Training Centre", start_date: "2026-09-01", status: "inactive" },
];

const MOCK_JOBS = [
  { id: "j1", title: "Dairy Procurement Supervisor", employer_name: "Amul Dairy Cooperative Union", location: "Gujarat", job_type: "Full-time", openings: 3, status: "open", source: "Direct", applicants: 38, posted_at: "2026-09-15T10:00:00Z" },
  { id: "j2", title: "MIS & Data Analyst", employer_name: "NCDC", location: "Delhi", job_type: "Full-time", openings: 2, status: "open", source: "Direct", applicants: 21, posted_at: "2026-09-20T10:00:00Z" },
  { id: "j3", title: "Cooperative Society Secretary", employer_name: "Sahakar Bharati", location: "Bengaluru", job_type: "Full-time", openings: 5, status: "closed", source: "Platform", applicants: 54, posted_at: "2026-08-01T10:00:00Z" },
];

const MOCK_ASSESSMENTS = [
  { id: "a1", title: "Governance & Bylaws Proficiency Test", skill_name: "Cooperative Law", programme_id: "p1", programme_title: "Cooperative Management Fundamentals", total_questions: 25, duration_minutes: 45, passing_score: 60, due_date: "2026-10-20T23:59:00Z", attempts: 44 },
  { id: "a2", title: "Meeting Facilitation Simulation", skill_name: "Leadership", programme_id: "p1", programme_title: "Cooperative Management Fundamentals", total_questions: 10, duration_minutes: 30, passing_score: 70, due_date: "2026-10-25T23:59:00Z", attempts: 31 },
];

const MOCK_CERTIFICATIONS = [
  { id: "c1", verification_code: "CS-2026-001234", holder_name: "Arjun Kumar", programme_title: "Cooperative Management Fundamentals", grade: "A", issue_date: "2026-09-15", expiry_date: "2029-09-15", status: "valid" },
  { id: "c2", verification_code: "CS-2026-001235", holder_name: "Priya Sharma", programme_title: "Dairy Cooperative Operations", grade: "B+", issue_date: "2026-08-20", expiry_date: "2029-08-20", status: "valid" },
];

const MOCK_AUDIT_LOGS = [
  { id: "al1", actor_name: "Admin User", action: "create", entity: "institution", entity_id: "i1", created_at: "2026-10-01T10:00:00Z", meta: null },
  { id: "al2", actor_name: "Admin User", action: "update", entity: "trainee", entity_id: "t1", created_at: "2026-10-02T11:30:00Z", meta: null },
];

const MOCK_DASHBOARD = {
  kpis: { institutions: 128, trainers: 842, trainees: 12460, certified: 2180, employers: 215, deltas: { institutions: 12, trainers: 48, trainees: 1240, certified: 320, employers: 28 } },
  enrollment_trend: [
    { month: "Apr", new_enrollments: 480, certifications: 120 },
    { month: "May", new_enrollments: 560, certifications: 140 },
    { month: "Jun", new_enrollments: 610, certifications: 190 },
    { month: "Jul", new_enrollments: 705, certifications: 210 },
    { month: "Aug", new_enrollments: 742, certifications: 280 },
    { month: "Sep", new_enrollments: 812, certifications: 305 },
  ],
  institutions_by_state: [
    { state: "Gujarat", count: 38 }, { state: "Maharashtra", count: 32 }, { state: "Delhi", count: 20 }, { state: "Karnataka", count: 18 }, { state: "Tamil Nadu", count: 20 },
  ],
  program_distribution: [
    { label: "Dairy & Agriculture", percent: 32 }, { label: "Finance & Audit", percent: 28 }, { label: "Management", percent: 24 }, { label: "Digital Skills", percent: 16 },
  ],
  placement_overview: [
    { month: "Apr", placements: 480, rate: 72 }, { month: "May", placements: 560, rate: 74 }, { month: "Jun", placements: 610, rate: 78 }, { month: "Jul", placements: 705, rate: 80 }, { month: "Aug", placements: 742, rate: 83 }, { month: "Sep", placements: 812, rate: 86 },
  ],
  top_institutions: MOCK_INSTITUTIONS.slice(0, 5),
  recent_activity: [
    { kind: "institution", title: "New Institution registered", subtitle: "Sahakar Cooperative College, Pune", at: new Date().toISOString() },
    { kind: "trainee", title: "100 new trainees enrolled", subtitle: "Cooperative Management Fundamentals batch", at: new Date(Date.now() - 3600000).toISOString() },
    { kind: "certification", title: "200 certificates issued", subtitle: "Q3 batch completions", at: new Date(Date.now() - 86400000).toISOString() },
  ],
  recent_placements: [
    { candidate_name: "Arjun Kumar", role: "Dairy Procurement Supervisor", employer: "Amul Union", date: "2026-09-28" },
    { candidate_name: "Priya Sharma", role: "Cooperative Accountant", employer: "MSCB", date: "2026-09-25" },
    { candidate_name: "Ravi Teja", role: "Data Analyst", employer: "NCDC", date: "2026-09-20" },
  ],
  ai_insights: [
    { title: "Attendance Risk", text: "3 trainees in Batch A have attendance below 70% — consider sending reminders." },
    { title: "Placement Trend", text: "Placement rate improved by 4% MoM driven by Dairy Operations graduates." },
    { title: "Skill Gap", text: "Digital skills demand is outpacing supply — consider increasing digital programme seats by 20%." },
  ],
};

async function mockFetch(path: string): Promise<unknown> {
  const p = path.split("?")[0];
  const qs = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
  const page = parseInt(qs.get("page") || "1");
  const page_size = parseInt(qs.get("page_size") || "10");

  await new Promise(r => setTimeout(r, 300)); // simulate network latency

  if (p === "/api/v1/admin/dashboard") return MOCK_DASHBOARD;
  if (p === "/api/v1/admin/institutions") return paged(MOCK_INSTITUTIONS, page, page_size);
  if (p.match(/^\/api\/v1\/admin\/institutions\/[^/]+$/)) {
    const id = p.split("/").pop()!;
    return MOCK_INSTITUTIONS.find(i => i.id === id) ?? MOCK_INSTITUTIONS[0];
  }
  if (p === "/api/v1/admin/trainers") return paged(MOCK_TRAINERS, page, page_size);
  if (p === "/api/v1/admin/trainees") return paged(MOCK_TRAINEES, page, page_size);
  if (p === "/api/v1/admin/employers") return paged([], page, page_size);
  if (p === "/api/v1/admin/users") return paged([...MOCK_TRAINEES, ...MOCK_TRAINERS], page, page_size);
  if (p === "/api/v1/admin/programmes") return paged(MOCK_PROGRAMMES, page, page_size);
  if (p === "/api/v1/admin/jobs") return paged(MOCK_JOBS, page, page_size);
  if (p === "/api/v1/admin/placements") return paged([], page, page_size);
  if (p === "/api/v1/admin/assessments") return paged(MOCK_ASSESSMENTS, page, page_size);
  if (p === "/api/v1/admin/certifications") return paged(MOCK_CERTIFICATIONS, page, page_size);
  if (p.endsWith("/verify")) return { id: p.split("/")[5], verification_code: "CS-2026-001234", status: "valid", integrity: "ok" };
  if (p === "/api/v1/admin/skill-passport") return paged([], page, page_size);
  if (p.startsWith("/api/v1/admin/reports/")) return { key: "enrollment", columns: ["Month", "Enrollments"], rows: [], chart: { type: "bar", labels: [], series: [] } };
  if (p === "/api/v1/admin/settings") return { general: { org_name: "NCCT", admin_email: "admin@ncct.gov.in", contact_phone: null, contact_address: null }, appearance: { accent_color: "#E30B1C", density: "comfortable" }, notifications: { email_enabled: true, weekly_digest: true, placement_alerts: true, digest_frequency: "weekly" }, security: { session_timeout_minutes: 60, mfa_required: false, password_min_length: 8, allowed_email_domains: [] } };
  if (p === "/api/v1/admin/audit-logs") return paged(MOCK_AUDIT_LOGS, page, page_size);
  
  // Users API (people-roster)
  if (p === "/api/v1/users/") return [];
  if (p === "/api/v1/users/batches") return [];
  
  return {};
}

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  if (process.env.NEXT_PUBLIC_MOCK_API !== 'false') {
    if (!options.method || options.method === 'GET') {
      return mockFetch(path);
    }
    await new Promise((r) => setTimeout(r, 400));
    const body = options.body ? JSON.parse(options.body as string) : {};
    return { id: `new-${Date.now()}`, status: 'active', ...body };
  }

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
