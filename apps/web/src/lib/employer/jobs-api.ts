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
 * Every call goes through `employerRequest` (`lib/employer/employer-http.ts`), the
 * mock-first employer gateway. Failures surface as `JobsApiError` with the status
 * recovered from the message, so views can tell a 404 from a transport failure.
 */
import { employerRequest, type Api } from "@/lib/employer/employer-http";
import { mockEmployerJobs } from "@/lib/employer/fixtures/catalog";

export {
  FALLBACK_SKILL_CATALOGUE,
  getMockEmployerJobDetail,
  mockEmployerJobs,
} from "@/lib/employer/fixtures/catalog";

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

async function call<T>(path: string, options: RequestInit = {}, transport?: Api): Promise<T> {
  try {
    return await employerRequest<T>(path, options, transport);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the NURVEX API";
    const carried = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;
    if (carried !== null) throw new JobsApiError(carried, message);
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
    // Gateway unavailable; keep the list populated from the local fixtures.
  }
  return filterMockJobs(mockEmployerJobs, filters);
}

export async function getEmployerJob(id: string): Promise<EmployerJobDetail> {
  return call<EmployerJobDetail>(`/api/v1/employer/jobs/${encodeURIComponent(id)}`);
}

export async function createEmployerJob(input: JobInput) {
  return call<{ id: string; status: JobStatus }>("/api/v1/employer/jobs", jsonBody(input));
}

export async function updateEmployerJob(id: string, input: Partial<JobInput>) {
  return call<{ id: string; status: JobStatus }>(`/api/v1/employer/jobs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function setJobRequirements(id: string, requirements: JobRequirement[]) {
  return call<{ requirements: JobRequirement[] }>(
    `/api/v1/employer/jobs/${encodeURIComponent(id)}/requirements`,
    { method: "PUT", body: JSON.stringify({ requirements }) },
  );
}

export async function publishEmployerJob(id: string) {
  return call<{ id: string; status: JobStatus }>(
    `/api/v1/employer/jobs/${encodeURIComponent(id)}/publish`,
    { method: "POST" },
  );
}

export async function pauseEmployerJob(id: string) {
  return call<{ id: string; status: JobStatus }>(
    `/api/v1/employer/jobs/${encodeURIComponent(id)}/pause`,
    { method: "POST" },
  );
}

export async function closeEmployerJob(id: string) {
  return call<{ id: string; status: JobStatus }>(
    `/api/v1/employer/jobs/${encodeURIComponent(id)}/close`,
    { method: "POST" },
  );
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
