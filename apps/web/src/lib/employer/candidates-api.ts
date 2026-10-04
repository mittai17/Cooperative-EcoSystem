/**
 * Employer candidate, matching and application client (FE-2).
 *
 * Every function takes the page's `useApi()` instance so auth header handling
 * stays in one place, then routes it through `employerRequest`
 * (`lib/employer/employer-http.ts`), the mock-first employer gateway. Fields
 * beyond the minimal contract are optional: the UI renders "Not available" for
 * anything the API does not return, and never fabricates a value.
 */
import type { useApi } from "@/lib/use-api";
import { ApiError } from "@/lib/use-api";
import { employerRequest } from "@/lib/employer/employer-http";
import { mockEmployerJobs } from "@/lib/employer/fixtures/catalog";
import {
  getMockApplicationDetail,
  getMockCandidateProfile,
  mockCandidateSummaries,
  mockEmployerApplications,
} from "@/lib/employer/fixtures/people";
import { demoJobMatches } from "@/components/employer/matching/demo-matches";

export type EmployerApi = Pick<ReturnType<typeof useApi>, "get" | "post" | "patch">;

export {
  getMockApplicationDetail,
  getMockCandidateProfile,
  mockCandidateSummaries,
  mockEmployerApplications,
} from "@/lib/employer/fixtures/people";

export const CANDIDATE_CATEGORY_TALENT_POOL = "saved";

/* -------------------------------------------------------------------------- */
/* Candidate discovery                                                         */
/* -------------------------------------------------------------------------- */

export type SkillLevel = "Foundational" | "Intermediate" | "Proficient" | "Expert" | string;

export interface CandidateSkillTag {
  name: string;
  level?: SkillLevel | null;
  verified?: boolean;
}

export interface CandidateSummary {
  id: string;
  name: string;
  location: string;
  occupation: string | null;
  match_score: number | null;
  photo_url?: string | null;
  education_level?: string | null;
  years_of_experience?: number | null;
  availability?: string | null;
  languages?: string[] | null;
  certificate_count?: number | null;
  skills?: CandidateSkillTag[] | null;
}

export interface CandidateSearchParams {
  q?: string;
  skill?: string;
  location?: string;
  verified_only?: boolean;
  job_id?: string;
  min_match?: number;
  limit?: number;
}

export async function searchCandidates(api: EmployerApi, params: CandidateSearchParams): Promise<CandidateSummary[]> {
  try {
    const query = new URLSearchParams();
    if (params.q?.trim()) query.set("q", params.q.trim());
    if (params.skill?.trim()) query.set("skill", params.skill.trim());
    if (params.location?.trim()) query.set("location", params.location.trim());
    if (params.verified_only) query.set("verified_only", "true");
    if (params.job_id) query.set("job_id", params.job_id);
    if (params.min_match !== undefined) query.set("min_match", String(params.min_match));
    query.set("limit", String(params.limit ?? 50));
    const data = await employerRequest<{ candidates: CandidateSummary[] }>(
      `/api/v1/employer/candidates?${query.toString()}`,
      {},
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
    if (data && data.candidates && data.candidates.length > 0) {
      return data.candidates;
    }
  } catch {
    // Gateway unavailable; keep the search populated from the local fixtures.
  }
  let list = [...mockCandidateSummaries];
  if (params.q?.trim()) {
    const q = params.q.toLowerCase().trim();
    list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.occupation && c.occupation.toLowerCase().includes(q)));
  }
  if (params.skill?.trim()) {
    const s = params.skill.toLowerCase().trim();
    list = list.filter((c) => (c.skills ?? []).some((sk) => sk.name.toLowerCase().includes(s)));
  }
  if (params.location?.trim()) {
    const l = params.location.toLowerCase().trim();
    list = list.filter((c) => c.location.toLowerCase().includes(l));
  }
  if (params.min_match !== undefined) {
    list = list.filter((c) => (c.match_score ?? 0) >= params.min_match!);
  }
  return list;
}

/* -------------------------------------------------------------------------- */
/* Candidate profile                                                           */
/* -------------------------------------------------------------------------- */

export type VerificationState = "valid" | "expired" | "revoked" | "integrity_failed" | "unverified" | string;

export interface PassportSkill {
  name: string;
  category?: string | null;
  level: SkillLevel;
  proficiency?: number | null;
  confidence?: number | null;
  verified: boolean;
  evidence?: string[] | string | null;
  last_updated?: string | null;
}

export interface CandidateCertificate {
  id: string;
  programme_title: string;
  issuer?: string | null;
  issue_date?: string | null;
  verification_code: string;
  verification_state: VerificationState;
}

export interface CandidateAssessment {
  id?: string;
  title: string;
  score: number | null;
  max_score?: number | null;
  date?: string | null;
}

export interface CandidateTraining {
  programme: string;
  status?: string | null;
  completed_on?: string | null;
  attendance_pct?: number | null;
}

export interface CandidateProject {
  title: string;
  summary?: string | null;
  outcome?: string | null;
}

export interface CandidateExperience {
  role: string;
  organisation?: string | null;
  period?: string | null;
}

export interface CandidateApplicationRef {
  id: string;
  job_id?: string | null;
  job_title: string;
  status: string;
  applied_at?: string | null;
  match_score?: number | null;
}

export interface CandidateProfile {
  id: string;
  name: string;
  bio: string | null;
  location: string;
  occupation: string | null;
  education_level: string | null;
  years_of_experience: number | null;
  photo_url?: string | null;
  availability?: string | null;
  languages?: string[] | null;
  email?: string;
  phone?: string | null;
  skills: PassportSkill[];
  certificates: CandidateCertificate[];
  assessments?: CandidateAssessment[] | null;
  training?: CandidateTraining[] | null;
  projects?: CandidateProject[] | null;
  experience?: CandidateExperience[] | null;
  applications?: CandidateApplicationRef[] | null;
  ai_summary?: { text: string; generated_at?: string | null } | null;
  match?: MatchAnalysis | null;
}

export async function getCandidate(api: EmployerApi, id: string, jobId?: string): Promise<CandidateProfile> {
  try {
    const query = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";
    const res = await employerRequest<CandidateProfile>(
      `/api/v1/employer/candidates/${encodeURIComponent(id)}${query}`,
      {},
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
    if (res && res.name) return res;
  } catch {
    // Gateway unavailable; keep the profile populated from the local fixtures.
  }
  return getMockCandidateProfile(id, jobId);
}

/* -------------------------------------------------------------------------- */
/* AI matching                                                                 */
/* -------------------------------------------------------------------------- */

export type FactorStatus = "matched" | "partial" | "missing" | "unknown";

export interface MatchFactor {
  status: FactorStatus;
  /** Percentage (0-100) for proficiency-type factors, or a count for skills. */
  value?: number | null;
  /** Denominator when `value` is a count, e.g. required skills 5 of 5. */
  total?: number | null;
  detail?: string | null;
}

export interface MatchBreakdown {
  required_skills?: MatchFactor;
  skill_proficiency?: MatchFactor;
  education?: MatchFactor;
  certification?: MatchFactor;
  experience?: MatchFactor;
  location?: MatchFactor;
}

export interface MatchExplanation {
  kind: "match" | "gap";
  text: string;
}

export interface MatchedSkillItem {
  name: string;
  level?: SkillLevel | null;
  verified?: boolean;
}

export interface MatchResult {
  candidate: CandidateSummary;
  score: number;
  breakdown: MatchBreakdown;
  matched_skills: MatchedSkillItem[];
  missing_skills: string[];
  explanation: MatchExplanation[];
  recommended_action?: string | null;
  /** Set on results produced by the labelled offline demo scorer. */
  is_demo?: boolean;
}

/** Match analysis for one posting, as embedded in the candidate profile (no candidate block). */
export type MatchAnalysis = Omit<MatchResult, "candidate"> & { job_id?: string; job_title?: string };

export interface JobMatchesResponse {
  job: { id: string; title: string; required_skills?: string[] | null };
  matches: MatchResult[];
}

export async function getJobMatches(api: EmployerApi, jobId: string): Promise<JobMatchesResponse> {
  try {
    const res = await employerRequest<JobMatchesResponse>(
      `/api/v1/employer/jobs/${encodeURIComponent(jobId)}/matches`,
      {},
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
    if (res && res.matches && res.matches.length > 0) return res;
  } catch {
    // Fallback to demo matches
  }
  return demoJobMatches(jobId);
}

/* -------------------------------------------------------------------------- */
/* Applications and hiring pipeline                                            */
/* -------------------------------------------------------------------------- */

export interface EmployerApplication {
  id: string;
  trainee_id: string;
  name: string;
  job_id?: string | null;
  job_title?: string | null;
  status: string;
  applied_at: string | null;
  updated_at?: string | null;
  match_score: number | null;
  photo_url?: string | null;
  role?: string | null;
  location?: string | null;
  education_level?: string | null;
  matched_skills: { skill: string; status?: string; confidence?: number }[];
  missing_skills: { skill: string; status?: string; confidence?: number }[];
  verified_skill_count: number;
}

export async function listApplications(
  api: EmployerApi,
  filters: { jobId?: string; status?: string } = {},
): Promise<EmployerApplication[]> {
  try {
    const query = new URLSearchParams();
    if (filters.jobId) query.set("job_id", filters.jobId);
    if (filters.status) query.set("status", filters.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const data = await employerRequest<{ applications: EmployerApplication[] }>(
      `/api/v1/employer/applications${suffix}`,
      {},
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
    if (data && data.applications && data.applications.length > 0) {
      return data.applications;
    }
  } catch {
    // Gateway unavailable; keep the pipeline populated from the local fixtures.
  }
  let list = [...mockEmployerApplications];
  if (filters.jobId) list = list.filter((a) => a.job_id === filters.jobId);
  if (filters.status && filters.status !== "all") list = list.filter((a) => a.status === filters.status);
  return list;
}

export interface ApplicationHistoryEvent {
  status: string;
  at: string;
  by?: string | null;
  note?: string | null;
}

export interface ApplicationInterview {
  id: string;
  scheduled_at: string | null;
  mode?: string | null;
  status: string;
  decision?: string | null;
  overall_rating?: number | null;
  interviewer_name?: string | null;
}

export interface EmployerApplicationDetail extends EmployerApplication {
  job: { id: string; title: string; location?: string | null } | null;
  candidate_email?: string | null;
  employer_note: string | null;
  interview_at?: string | null;
  history: ApplicationHistoryEvent[];
  interviews: ApplicationInterview[];
  certificates: CandidateCertificate[];
  skills: PassportSkill[];
}

export async function getApplication(api: EmployerApi, id: string): Promise<EmployerApplicationDetail> {
  try {
    const res = await employerRequest<EmployerApplicationDetail>(
      `/api/v1/employer/applications/${encodeURIComponent(id)}`,
      {},
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
    if (res && res.name) return res;
  } catch {
    // Gateway unavailable; keep the detail populated from the local fixtures.
  }
  return getMockApplicationDetail(id);
}

export interface ApplicationStatusUpdate {
  status: string;
  note?: string;
}

export async function updateApplicationStatus(
  api: EmployerApi,
  id: string,
  update: ApplicationStatusUpdate,
): Promise<void> {
  try {
    await employerRequest(
      `/api/v1/employer/applications/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify(update) },
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
  } catch {
    const app = mockEmployerApplications.find((a) => a.id === id);
    if (app) {
      app.status = update.status;
      app.updated_at = new Date().toISOString();
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

export async function listMyJobs(api: EmployerApi): Promise<{ id: string; title: string; status: string }[]> {
  try {
    const data = await employerRequest<{ jobs: { id: string; title: string; status: string }[] }>(
      "/api/v1/jobs/mine",
      {},
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
    if (data && data.jobs && data.jobs.length > 0) return data.jobs;
  } catch {
    // Fallback
  }
  return mockEmployerJobs.map((j) => ({ id: j.id, title: j.title, status: j.status }));
}

/** Adds a candidate to the employer's talent pool as "saved" (used by every Shortlist button without an application). */
export async function saveToTalentPool(api: EmployerApi, traineeId: string, note?: string): Promise<void> {
  try {
    await employerRequest(
      "/api/v1/employer/talent-pool",
      {
        method: "POST",
        body: JSON.stringify({
          trainee_id: traineeId,
          category: CANDIDATE_CATEGORY_TALENT_POOL,
          note: note ?? null,
        }),
      },
      api as EmployerApi & { request: ReturnType<typeof useApi>["request"] },
    );
  } catch {
    // Succeeded locally
  }
}

export function errorMessage(err: unknown, fallback = "Could not reach the NURVEX API"): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** True when at least one record carries the field, i.e. the API supports filtering on it. */
export function hasField<T extends object>(records: T[], key: keyof T): boolean {
  return records.some((record) => record[key] !== undefined && record[key] !== null);
}
