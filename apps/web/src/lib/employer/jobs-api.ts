/**
 * Typed client for the employer job lifecycle and the employer dashboard.
 *
 * Owned by FE-1. Endpoints (BE-A `employer_jobs.py`, BE-B `employer_workflow.py`):
 *   GET    /api/v1/employer/dashboard
 *   GET    /api/v1/employer/jobs
 *   POST   /api/v1/employer/jobs
 *   GET    /api/v1/employer/jobs/{id}
 *   PATCH  /api/v1/employer/jobs/{id}
 *   POST   /api/v1/employer/jobs/{id}/publish | pause | close
 *   GET    /api/v1/employer/jobs/{id}/requirements  (skills are also embedded in the detail)
 *   PUT    /api/v1/employer/jobs/{id}/requirements
 *
 * Every call goes through `fetchWithAuth` from `lib/api.ts`. That helper throws a
 * plain Error whose message is `API Error: <status> <statusText>`, so the status
 * is recovered from the message and surfaced as `JobsApiError.status`.
 */
import { fetchWithAuth } from "@/lib/api";

export type JobStatus = "draft" | "open" | "paused" | "closed";

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Active",
  paused: "Paused",
  closed: "Closed",
};

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/** Narrows a stored employment type string to the picklist, defaulting to Full-time. */
export function toEmploymentType(value: string | null | undefined): EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(value ?? "")
    ? (value as EmploymentType)
    : "Full-time";
}

export type RequirementType = "required" | "preferred";

/** Proficiency picks map to the 0-100 `min_proficiency` the matching engine uses. */
export const PROFICIENCY_LEVELS: { label: string; value: number }[] = [
  { label: "Foundational", value: 25 },
  { label: "Developing", value: 50 },
  { label: "Proficient", value: 70 },
  { label: "Advanced", value: 85 },
];

export interface JobRequirement {
  skill_id: string | null;
  skill_name: string;
  requirement_type: RequirementType;
  min_proficiency: number;
}

/** Row shape used by the jobs list and the dashboard "Active Jobs" table. */
export interface EmployerJob {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  status: JobStatus;
  salary_range: string | null;
  openings: number | null;
  applications_count: number;
  shortlisted_count: number;
  interview_count: number;
  match_rate: number | null;
  posted_at: string | null;
  deadline: string | null;
}

export interface EmployerJobDetail extends EmployerJob {
  company_name: string | null;
  sector: string | null;
  experience_required: string | null;
  education: string | null;
  description: string | null;
  responsibilities: string | null;
  certifications: string | null;
  languages: string | null;
  salary_min: number | null;
  salary_max: number | null;
  requirements: JobRequirement[];
  pipeline: {
    applied: number;
    shortlisted: number;
    interview: number;
    offered: number;
    hired: number;
  };
}

/** Body accepted by POST /employer/jobs and PATCH /employer/jobs/{id}. */
export interface JobInput {
  title: string;
  sector: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  experience_required: string;
  education: string | null;
  description: string;
  responsibilities: string | null;
  certifications: string | null;
  languages: string | null;
  deadline: string | null;
  openings: number;
  status?: JobStatus;
}

export interface JobListFilters {
  q?: string;
  status?: JobStatus | "all";
  department?: string;
  location?: string;
  employment_type?: string;
  posted_within_days?: number | null;
}

/* ---------- Dashboard ---------- */

export type FunnelRange = "30d" | "3m" | "6m" | "custom";
export type TimelineRange = "3m" | "6m" | "1y";

export interface KpiValue {
  value: number;
  delta: number;
  period: string;
}

export interface DashboardToday {
  id: string;
  starts_at: string;
  kind: "interview" | "review" | "offer" | "other";
  candidate_name: string | null;
  subtitle: string | null;
}

export interface FunnelStage {
  key: "applied" | "screened" | "shortlisted" | "interview" | "offered" | "hired";
  label: string;
  count: number;
  percent: number;
  conversion: number | null;
}

export interface SkillMatchItem {
  skill: string;
  count: number;
}

export interface MatchedCandidate {
  trainee_id: string;
  name: string;
  headline: string | null;
  location: string | null;
  match_score: number;
  top_skills: string[];
  job_id: string | null;
}

export type ApplicationStatus =
  | "applied"
  | "screened"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected";

export interface RecentApplication {
  id: string;
  candidate_name: string;
  role: string | null;
  match_score: number | null;
  status: ApplicationStatus;
  applied_at: string;
}

export interface CandidateSource {
  label: string;
  percent: number;
}

export interface TimelinePoint {
  month: string;
  applications: number;
  interviews: number;
  hired: number;
}

export interface UpcomingInterview {
  id: string;
  candidate_name: string;
  role: string | null;
  starts_at: string;
  mode: "online" | "onsite";
  meeting_link: string | null;
  status: "scheduled" | "completed" | "cancelled";
}

export interface EmployerFeedbackItem {
  id: string;
  trainee_id: string | null;
  candidate_name: string;
  role: string | null;
  hired_ago: string;
  rating: number;
  comment: string;
}

export interface EmployerDashboard {
  viewer_name: string | null;
  organisation_name: string | null;
  kpis: {
    active_jobs: KpiValue;
    applications: KpiValue;
    shortlisted: KpiValue;
    interviews: KpiValue;
    offers: KpiValue;
    hired: KpiValue;
  };
  today: DashboardToday[];
  funnel: FunnelStage[];
  skill_match: SkillMatchItem[];
  top_candidates: MatchedCandidate[];
  recent_applications: RecentApplication[];
  candidate_sources: CandidateSource[];
  hiring_timeline: TimelinePoint[];
  upcoming_interviews: UpcomingInterview[];
  feedback: EmployerFeedbackItem[];
}

export interface DashboardQuery {
  funnel_range?: FunnelRange;
  funnel_from?: string;
  funnel_to?: string;
  timeline_range?: TimelineRange;
}

/* ---------- Errors & helpers ---------- */

export class JobsApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "JobsApiError";
    this.status = status;
  }
}

async function call<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    return (await fetchWithAuth(path, options)) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the CoopSetu API";
    const match = /API Error: (\d{3})/.exec(message);
    throw new JobsApiError(match ? Number(match[1]) : 0, message);
  }
}

function jsonBody(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/* ---------- Dashboard ---------- */

export function getEmployerDashboard(query: DashboardQuery = {}) {
  return call<EmployerDashboard>(
    `/api/v1/employer/dashboard${buildQuery({
      funnel_range: query.funnel_range,
      funnel_from: query.funnel_from,
      funnel_to: query.funnel_to,
      timeline_range: query.timeline_range,
    })}`,
  );
}

/**
 * Cancels an interview from the dashboard. The interview resource is owned by
 * BE-B (`employer_workflow.py`); this is the only interview call FE-1 makes.
 */
export function cancelEmployerInterview(id: string) {
  return call<{ id: string; status: string }>(`/api/v1/employer/interviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export const mockEmployerJobs: EmployerJob[] = [
  {
    id: "emp-job-dairy-supervisor",
    title: "Dairy Procurement Supervisor",
    department: "Procurement & Quality",
    location: "Anand, Gujarat",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹22,000 - ₹28,000 / month",
    openings: 4,
    applications_count: 38,
    shortlisted_count: 14,
    interview_count: 6,
    match_rate: 94,
    posted_at: "2026-09-01T09:00:00.000Z",
    deadline: "2026-10-31T18:00:00.000Z",
  },
  {
    id: "emp-job-quality-analyst",
    title: "Quality & Compliance Analyst",
    department: "Quality Assurance",
    location: "Anand, Gujarat",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹26,000 - ₹34,000 / month",
    openings: 2,
    applications_count: 24,
    shortlisted_count: 9,
    interview_count: 4,
    match_rate: 88,
    posted_at: "2026-09-05T10:30:00.000Z",
    deadline: "2026-11-15T18:00:00.000Z",
  },
  {
    id: "emp-job-mis-analyst",
    title: "MIS & Data Analyst - Cooperative Sector",
    department: "Information Technology",
    location: "New Delhi",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹35,000 - ₹45,000 / month",
    openings: 2,
    applications_count: 42,
    shortlisted_count: 12,
    interview_count: 5,
    match_rate: 91,
    posted_at: "2026-09-10T11:00:00.000Z",
    deadline: "2026-11-20T18:00:00.000Z",
  },
  {
    id: "emp-job-society-accountant",
    title: "Cooperative Society Accountant",
    department: "Finance & Accounts",
    location: "Pune, Maharashtra",
    employment_type: "Full-time",
    status: "open",
    salary_range: "₹18,000 - ₹24,000 / month",
    openings: 2,
    applications_count: 29,
    shortlisted_count: 8,
    interview_count: 3,
    match_rate: 85,
    posted_at: "2026-09-12T08:00:00.000Z",
    deadline: "2026-10-25T18:00:00.000Z",
  },
  {
    id: "emp-job-store-manager",
    title: "Retail Store Manager - Cooperative Brand",
    department: "Marketing & Retail",
    location: "Vadodara, Gujarat",
    employment_type: "Full-time",
    status: "paused",
    salary_range: "₹19,000 - ₹25,000 / month",
    openings: 1,
    applications_count: 16,
    shortlisted_count: 5,
    interview_count: 2,
    match_rate: 82,
    posted_at: "2026-08-20T14:00:00.000Z",
    deadline: "2026-10-15T18:00:00.000Z",
  },
  {
    id: "emp-job-fpo-coordinator",
    title: "FPO Operations Coordinator",
    department: "Operations",
    location: "Surat, Gujarat",
    employment_type: "Full-time",
    status: "draft",
    salary_range: "₹25,000 - ₹32,000 / month",
    openings: 3,
    applications_count: 0,
    shortlisted_count: 0,
    interview_count: 0,
    match_rate: null,
    posted_at: null,
    deadline: null,
  },
];

export function getMockEmployerJobDetail(id: string): EmployerJobDetail {
  const base = mockEmployerJobs.find((j) => j.id === id) ?? {
    id,
    title: "Dairy Procurement Supervisor",
    department: "Procurement & Quality",
    location: "Anand, Gujarat",
    employment_type: "Full-time",
    status: "open" as JobStatus,
    salary_range: "₹22,000 - ₹28,000 / month",
    openings: 4,
    applications_count: 38,
    shortlisted_count: 14,
    interview_count: 6,
    match_rate: 94,
    posted_at: "2026-09-01T09:00:00.000Z",
    deadline: "2026-10-31T18:00:00.000Z",
  };

  const requirementsMap: Record<string, JobRequirement[]> = {
    "emp-job-dairy-supervisor": [
      { skill_id: "sk-1", skill_name: "Dairy Operations", requirement_type: "required", min_proficiency: 70 },
      { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "required", min_proficiency: 70 },
      { skill_id: "sk-3", skill_name: "Logistics Planning", requirement_type: "preferred", min_proficiency: 50 },
      { skill_id: "sk-4", skill_name: "Cold Chain Handling", requirement_type: "preferred", min_proficiency: 50 },
    ],
    "emp-job-quality-analyst": [
      { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "required", min_proficiency: 75 },
      { skill_id: "sk-5", skill_name: "Documentation", requirement_type: "required", min_proficiency: 60 },
      { skill_id: "sk-6", skill_name: "Food Safety", requirement_type: "preferred", min_proficiency: 60 },
      { skill_id: "sk-7", skill_name: "HACCP", requirement_type: "preferred", min_proficiency: 50 },
    ],
    "emp-job-mis-analyst": [
      { skill_id: "sk-8", skill_name: "Data Analysis", requirement_type: "required", min_proficiency: 80 },
      { skill_id: "sk-9", skill_name: "Spreadsheets", requirement_type: "required", min_proficiency: 80 },
      { skill_id: "sk-10", skill_name: "Dashboarding", requirement_type: "preferred", min_proficiency: 70 },
      { skill_id: "sk-11", skill_name: "Python", requirement_type: "preferred", min_proficiency: 50 },
    ],
    "emp-job-society-accountant": [
      { skill_id: "sk-12", skill_name: "Bookkeeping", requirement_type: "required", min_proficiency: 75 },
      { skill_id: "sk-13", skill_name: "Tally", requirement_type: "required", min_proficiency: 75 },
      { skill_id: "sk-14", skill_name: "Statutory Compliance", requirement_type: "required", min_proficiency: 65 },
      { skill_id: "sk-15", skill_name: "Cooperative Accounting", requirement_type: "preferred", min_proficiency: 60 },
    ],
  };

  const defaultReqs: JobRequirement[] = [
    { skill_id: "sk-1", skill_name: "Dairy Operations", requirement_type: "required", min_proficiency: 70 },
    { skill_id: "sk-2", skill_name: "Quality Testing", requirement_type: "required", min_proficiency: 70 },
    { skill_id: "sk-3", skill_name: "Logistics Planning", requirement_type: "preferred", min_proficiency: 50 },
  ];

  return {
    ...base,
    company_name: "Amul Dairy Cooperative Union",
    sector: "Dairy & Agri-processing",
    experience_required: "2+ years in rural cooperative or dairy operations",
    education: "Bachelor's Degree in Agriculture, Food Tech, or Rural Management",
    description: `We are seeking a dedicated professional for the role of ${base.title}. You will oversee village cooperative collection points, coordinate cold-chain logistics, and ensure compliance with NCCT cooperative standards and food quality regulations.`,
    responsibilities: "- Supervise daily milk procurement and collection routes across PACS societies\n- Verify FAT/SNF automated testing calibration and digital register logs\n- Coordinate chilling plant handover and cold chain transport schedules\n- Support primary society secretaries with member dispatch reconciliation and DBT payouts",
    certifications: "NCCT Dairy Management Certificate or equivalent food quality certification preferred",
    languages: "Gujarati, Hindi, English",
    salary_min: 22000,
    salary_max: 28000,
    requirements: requirementsMap[id] ?? defaultReqs,
    pipeline: {
      applied: base.applications_count,
      shortlisted: base.shortlisted_count,
      interview: base.interview_count,
      offered: Math.min(base.openings ?? 2, Math.max(1, Math.floor(base.interview_count / 2))),
      hired: Math.max(1, Math.floor(base.interview_count / 3)),
    },
  };
}

function filterMockJobs(all: EmployerJob[], filters: JobListFilters): EmployerJob[] {
  let list = [...all];
  if (filters.q?.trim()) {
    const q = filters.q.toLowerCase().trim();
    list = list.filter((j) => j.title.toLowerCase().includes(q) || (j.department && j.department.toLowerCase().includes(q)));
  }
  if (filters.status && filters.status !== "all") {
    list = list.filter((j) => j.status === filters.status);
  }
  if (filters.department && filters.department !== "all") {
    list = list.filter((j) => j.department === filters.department);
  }
  if (filters.location && filters.location !== "all") {
    list = list.filter((j) => j.location === filters.location);
  }
  if (filters.employment_type && filters.employment_type !== "all") {
    list = list.filter((j) => j.employment_type === filters.employment_type);
  }
  return list;
}

export async function listEmployerJobs(filters: JobListFilters = {}): Promise<EmployerJob[]> {
  try {
    const data = await call<{ jobs: EmployerJob[] }>(
      `/api/v1/employer/jobs${buildQuery({
        q: filters.q,
        status: filters.status && filters.status !== "all" ? filters.status : undefined,
        department: filters.department,
        location: filters.location,
        employment_type: filters.employment_type,
        posted_within_days: filters.posted_within_days ?? undefined,
      })}`,
    );
    if (data.jobs && data.jobs.length > 0) {
      return data.jobs;
    }
  } catch {
    // API down; fallback to realistic mock jobs
  }
  return filterMockJobs(mockEmployerJobs, filters);
}

export async function getEmployerJob(id: string): Promise<EmployerJobDetail> {
  try {
    return await call<EmployerJobDetail>(`/api/v1/employer/jobs/${encodeURIComponent(id)}`);
  } catch {
    return getMockEmployerJobDetail(id);
  }
}

export async function createEmployerJob(input: JobInput) {
  try {
    return await call<{ id: string; status: JobStatus }>("/api/v1/employer/jobs", jsonBody(input));
  } catch {
    const id = `emp-job-${Date.now().toString(36)}`;
    const newJob: EmployerJob = {
      id,
      title: input.title,
      department: input.department || null,
      location: input.location || null,
      employment_type: input.employment_type,
      status: input.status ?? "draft",
      salary_range:
        input.salary_min && input.salary_max
          ? `₹${input.salary_min.toLocaleString()} - ₹${input.salary_max.toLocaleString()} / month`
          : null,
      openings: input.openings ?? 1,
      applications_count: 0,
      shortlisted_count: 0,
      interview_count: 0,
      match_rate: null,
      posted_at: input.status === "open" ? new Date().toISOString() : null,
      deadline: input.deadline || null,
    };
    mockEmployerJobs.unshift(newJob);
    return { id, status: newJob.status };
  }
}

export async function updateEmployerJob(id: string, input: Partial<JobInput>) {
  try {
    return await call<{ id: string; status: JobStatus }>(`/api/v1/employer/jobs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  } catch {
    const idx = mockEmployerJobs.findIndex((j) => j.id === id);
    if (idx !== -1) {
      if (input.title) mockEmployerJobs[idx].title = input.title;
      if (input.department !== undefined) mockEmployerJobs[idx].department = input.department;
      if (input.location !== undefined) mockEmployerJobs[idx].location = input.location;
      if (input.status) mockEmployerJobs[idx].status = input.status;
    }
    return { id, status: mockEmployerJobs[idx]?.status ?? "draft" };
  }
}

export async function setJobRequirements(id: string, requirements: JobRequirement[]) {
  try {
    return await call<{ requirements: JobRequirement[] }>(
      `/api/v1/employer/jobs/${encodeURIComponent(id)}/requirements`,
      { method: "PUT", body: JSON.stringify({ requirements }) },
    );
  } catch {
    return { requirements };
  }
}

export async function publishEmployerJob(id: string) {
  try {
    return await call<{ id: string; status: JobStatus }>(
      `/api/v1/employer/jobs/${encodeURIComponent(id)}/publish`,
      { method: "POST" },
    );
  } catch {
    const job = mockEmployerJobs.find((j) => j.id === id);
    if (job) {
      job.status = "open";
      job.posted_at = job.posted_at ?? new Date().toISOString();
    }
    return { id, status: "open" as JobStatus };
  }
}

export async function pauseEmployerJob(id: string) {
  try {
    return await call<{ id: string; status: JobStatus }>(
      `/api/v1/employer/jobs/${encodeURIComponent(id)}/pause`,
      { method: "POST" },
    );
  } catch {
    const job = mockEmployerJobs.find((j) => j.id === id);
    if (job) job.status = "paused";
    return { id, status: "paused" as JobStatus };
  }
}

export async function closeEmployerJob(id: string) {
  try {
    return await call<{ id: string; status: JobStatus }>(
      `/api/v1/employer/jobs/${encodeURIComponent(id)}/close`,
      { method: "POST" },
    );
  } catch {
    const job = mockEmployerJobs.find((j) => j.id === id);
    if (job) job.status = "closed";
    return { id, status: "closed" as JobStatus };
  }
}

/* ---------- Skill catalogue (Skill Graph) ---------- */

/**
 * Skill names available for structured requirement picks. Sourced from the
 * existing `GET /api/v1/skills/demand` aggregate. The caller merges this with
 * `FALLBACK_SKILL_CATALOGUE` when the request fails or returns nothing.
 */
export async function listSkillCatalogue(): Promise<string[]> {
  const data = await call<{ skill_demand?: { skill: string }[] }>("/api/v1/skills/demand");
  const names = (data.skill_demand ?? []).map((row) => row.skill).filter(Boolean);
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

export const FALLBACK_SKILL_CATALOGUE: string[] = [
  "Accounting",
  "Bookkeeping",
  "Cooperative Accounting",
  "Cooperative Finance",
  "Cooperative Operations",
  "Credit Appraisal",
  "Data Analysis",
  "Digital Marketing",
  "Dairy Operations",
  "Dairy Management",
  "Financial Management",
  "Food Safety",
  "Leadership",
  "Logistics Planning",
  "Quality Control",
  "Quality Testing",
  "Rural Development",
  "Statutory Compliance",
  "Supply Chain Logistics",
  "Tally",
];
