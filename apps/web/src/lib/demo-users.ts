import type { UserRole } from "@/lib/types";

export interface DemoUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  user: string;
  org: string;
  roleTitle: string;
  target: string;
  initials: string;
  badgeTone: string;
  accentColor: string;
  description: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "demo-trainee",
    role: "trainee",
    name: "Ravindra Suresh Patil",
    email: "ravindra.patil@coopsetu.ai",
    user: "trainee-ravindra",
    org: "Dairy Cooperative Management Cohort",
    roleTitle: "Cooperative Trainee / Learner",
    target: "/trainee/dashboard",
    initials: "RP",
    badgeTone: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    accentColor: "from-blue-600 to-indigo-600",
    description: "Explore enrolled courses, offline downloads, verified Skill Passport, job matches, and attendance.",
  },
  {
    id: "demo-institution",
    role: "institution",
    name: "VAMNICOM, Pune",
    email: "admin@vamnicom.gov.in",
    user: "inst-vamnicom",
    org: "Institution Admin",
    roleTitle: "Institution Admin",
    target: "/institution/dashboard",
    initials: "V",
    badgeTone: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    accentColor: "from-red-600 to-rose-600",
    description: "Manage training programmes, trainees, nominations and institutional operations to strengthen the cooperative movement.",
  },
  {
    id: "demo-trainer",
    role: "trainer",
    name: "Dr. Meera Kulkarni",
    email: "meera.kulkarni@coopsetu.ai",
    user: "trainer-kulkarni",
    org: "Senior Faculty — PACS Digital Accounting (PDA-02)",
    roleTitle: "Trainer / Faculty Member",
    target: "/trainer/dashboard",
    initials: "MK",
    badgeTone: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    accentColor: "from-amber-600 to-orange-600",
    description: "Broadcast live attendance QR codes, track daily classes, monitor batch hostel accommodation, and view submission scores.",
  },
  {
    id: "demo-employer",
    role: "employer",
    name: "Rajesh Mehta — Amul Dairy HR",
    email: "hr@amul.coopsetu.ai",
    user: "employer-mehta",
    org: "Gujarat Co-operative Milk Marketing Federation (Amul)",
    roleTitle: "Employer / Talent Acquisition",
    target: "/employer/dashboard",
    initials: "RM",
    badgeTone: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    accentColor: "from-purple-600 to-pink-600",
    description: "Post cooperative job vacancies, discover Skill Passport-verified candidates, and track candidate pipeline.",
  },
  {
    id: "demo-admin",
    role: "admin",
    name: "S. K. Verma — Directorate Delhi",
    email: "skverma@ncct.gov.in",
    user: "admin-verma",
    org: "National Council for Cooperative Training (NCCT)",
    roleTitle: "NCCT Apex Administrator",
    target: "/admin/dashboard",
    initials: "SV",
    badgeTone: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    accentColor: "from-red-600 to-rose-700",
    description: "National oversight of certified trainees, employment funnels, institutional outcomes, and state skill demand.",
  },
  {
    id: "demo-kiosk",
    role: "kiosk",
    name: "Terminal Station 01 — Anand Center",
    email: "kiosk.station01@coopsetu.ai",
    user: "kiosk-station-01",
    org: "Village Cooperative Digital Kiosk Unit",
    roleTitle: "Kiosk Station Operator",
    target: "/kiosk",
    initials: "TS",
    badgeTone: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    accentColor: "from-cyan-600 to-teal-600",
    description: "Offline-first touch terminal for QR attendance recording, certificate verification, and local batch sync.",
  },
];

/**
 * Get demo user by role with safe fallback
 */
export function getDemoUserForRole(role?: UserRole | string | null): DemoUser {
  if (!role) return DEMO_USERS[0];
  return DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0];
}

/**
 * Set demo session cookies in browser without redirecting
 */
export function setDemoSessionCookies(demoUser: DemoUser): void {
  if (typeof document === "undefined") return;

  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const cookieOptions = `; path=/; max-age=${maxAge}; SameSite=Lax`;

  document.cookie = `coopsetu_demo_role=${encodeURIComponent(demoUser.role)}${cookieOptions}`;
  document.cookie = `coopsetu_demo_user=${encodeURIComponent(demoUser.user)}${cookieOptions}`;
  document.cookie = `coopsetu_demo_email=${encodeURIComponent(demoUser.email)}${cookieOptions}`;
  document.cookie = `coopsetu_demo_name=${encodeURIComponent(demoUser.name)}${cookieOptions}`;
}

/**
 * Set demo session cookies in browser and navigate to target
 */
export function loginAsDemoUser(demoUser: DemoUser): void {
  setDemoSessionCookies(demoUser);
  if (typeof window !== "undefined") {
    // Force page reload navigation so Next.js server components and middleware see the cookies
    window.location.href = demoUser.target;
  }
}

/**
 * Clear all demo cookies and return to sign-in page
 */
export function signOutDemo(redirectTo: string = "/sign-in"): void {
  if (typeof document === "undefined") return;

  const expired = "; path=/; max-age=0; SameSite=Lax";
  document.cookie = `coopsetu_demo_role=${expired}`;
  document.cookie = `coopsetu_demo_user=${expired}`;
  document.cookie = `coopsetu_demo_email=${expired}`;
  document.cookie = `coopsetu_demo_name=${expired}`;

  window.location.href = redirectTo;
}

/**
 * Helper to parse cookies client-side
 */
export function getActiveDemoSession(): {
  role: UserRole | null;
  user: string | null;
  email: string | null;
  name: string | null;
  demoUser: DemoUser | null;
} {
  if (typeof document === "undefined") {
    return { role: null, user: null, email: null, name: null, demoUser: null };
  }

  const cookies = document.cookie.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [rawKey, ...rest] = pair.trim().split("=");
    if (rawKey) {
      acc[rawKey] = decodeURIComponent(rest.join("="));
    }
    return acc;
  }, {});

  const role = (cookies["coopsetu_demo_role"] as UserRole) || null;
  const user = cookies["coopsetu_demo_user"] || null;
  const email = cookies["coopsetu_demo_email"] || null;
  const name = cookies["coopsetu_demo_name"] || null;

  const demoUser = role ? DEMO_USERS.find((u) => u.role === role) ?? null : null;

  return { role, user, email, name, demoUser };
}
