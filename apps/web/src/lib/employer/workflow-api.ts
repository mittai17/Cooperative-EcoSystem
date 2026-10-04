import type { useApi } from "@/lib/use-api";
import { employerCsv, employerRequest } from "@/lib/employer/employer-http";
import { mockCompanyProfile, mockSettings, mockTeamResponse } from "@/lib/employer/fixtures/catalog";
import {
  findMockOffer,
  getMockAnalytics,
  getMockApplicationSummary,
  getMockInterview,
  getMockReportPreview,
  mockCandidateOptions,
  mockFeedbackResponse,
  mockInterviews,
  mockOffers,
  mockSkillDemandAggregate,
  mockTalentPoolEntries,
} from "@/lib/employer/fixtures/workflow";

/**
 * API client for the employer workflow module (interviews, offers, feedback,
 * talent pool, analytics, reports, company, team, settings).
 *
 * Every call takes the `useApi()` instance from the page so auth headers and
 * ApiError handling stay in one place, then routes it through `employerRequest`
 * (`lib/employer/employer-http.ts`), the mock-first employer gateway. Response
 * shapes mirror the BE-B contract in `api/v1/employer_workflow.py`; anything not
 * yet confirmed by the backend is marked "assumed" below.
 */

export type Api = ReturnType<typeof useApi>;

// ---------------------------------------------------------------- interviews

export type InterviewMode = "online" | "onsite";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";
export type InterviewDecision = "proceed" | "hold" | "reject";

export const EVALUATION_CRITERIA = [
  { key: "technical_skills", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "domain_knowledge", label: "Domain Knowledge" },
  { key: "cooperative_sector_knowledge", label: "Cooperative Sector Knowledge" },
] as const;

export type EvaluationKey = (typeof EVALUATION_CRITERIA)[number]["key"];
export type EvaluationScores = Partial<Record<EvaluationKey, number>>;

export const OVERALL_RECOMMENDATIONS = [
  { value: "strongly_recommend", label: "Strongly recommend" },
  { value: "recommend", label: "Recommend" },
  { value: "undecided", label: "Undecided" },
  { value: "not_recommend", label: "Do not recommend" },
] as const;

export interface Interview {
  id: string;
  application_id: string;
  job_id: string;
  job_title: string;
  trainee_id: string;
  candidate_name: string;
  /** ISO 8601 datetime, stored in UTC. */
  scheduled_at: string;
  duration_minutes: number;
  mode: InterviewMode;
  meeting_link: string | null;
  interviewer_name: string | null;
  notes: string | null;
  status: InterviewStatus;
  decision: InterviewDecision | null;
  overall_recommendation: string | null;
  overall_rating: number | null;
  evaluation: EvaluationScores | null;
  evaluation_notes: string | null;
}

export interface InterviewsResponse {
  interviews: Interview[];
}

export interface ApplicationSummary {
  id: string;
  trainee_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  status: string;
}

export interface InterviewCreate {
  application_id: string;
  scheduled_at: string;
  duration_minutes: number;
  mode: InterviewMode;
  meeting_link: string | null;
  interviewer_name: string | null;
  notes: string | null;
}

export interface InterviewEvaluationInput {
  scores: EvaluationScores;
  overall_recommendation: string | null;
  notes: string;
}

export const listInterviews = async (api: Api): Promise<InterviewsResponse> => {
  const data = await employerRequest<InterviewsResponse>("/api/v1/employer/interviews", {}, api);
  if (data && data.interviews && data.interviews.length > 0) return data;
  return { interviews: [...mockInterviews] };
};

export const getInterview = async (api: Api, id: string): Promise<Interview> => {
  try {
    const data = await employerRequest<Interview>(
      `/api/v1/employer/interviews/${encodeURIComponent(id)}`,
      {},
      api,
    );
    if (data && data.id) return data;
  } catch {
    // Unknown id: keep the review page populated from the local fixtures.
  }
  return getMockInterview(id);
};

export const createInterview = async (api: Api, body: InterviewCreate): Promise<Interview> => {
  return employerRequest<Interview>(
    "/api/v1/employer/interviews",
    { method: "POST", body: JSON.stringify(body) },
    api,
  );
};

export const updateInterview = async (
  api: Api,
  id: string,
  body: Partial<Pick<Interview, "status" | "decision" | "scheduled_at" | "duration_minutes" | "meeting_link">>,
): Promise<Interview> => {
  return employerRequest<Interview>(
    `/api/v1/employer/interviews/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    api,
  );
};

export const saveInterviewEvaluation = async (
  api: Api,
  id: string,
  body: InterviewEvaluationInput,
): Promise<Interview> => {
  return employerRequest<Interview>(
    `/api/v1/employer/interviews/${encodeURIComponent(id)}/evaluation`,
    { method: "POST", body: JSON.stringify(body) },
    api,
  );
};

export const getApplicationSummary = async (api: Api, id: string): Promise<ApplicationSummary> => {
  const data = await employerRequest<
    Partial<ApplicationSummary> & {
      name?: string;
      job?: { id: string | null; title: string | null } | null;
    }
  >(`/api/v1/employer/applications/${encodeURIComponent(id)}`, {}, api);
  const candidateName = data?.candidate_name ?? data?.name ?? null;
  const jobTitle = data?.job_title ?? data?.job?.title ?? null;
  if (data && data.trainee_id && candidateName && jobTitle) {
    return {
      id: data.id ?? id,
      trainee_id: data.trainee_id,
      candidate_name: candidateName,
      job_id: data.job_id ?? data.job?.id ?? "",
      job_title: jobTitle,
      status: data.status ?? "applied",
    };
  }
  return getMockApplicationSummary(id);
};

// ------------------------------------------------------------------- offers

export type OfferStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "withdrawn";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export interface Offer {
  id: string;
  application_id: string;
  job_id: string;
  job_title: string;
  trainee_id: string;
  candidate_name: string;
  status: OfferStatus;
  salary: number | null;
  employment_type: EmploymentType | null;
  /** ISO date (YYYY-MM-DD). */
  joining_date: string | null;
  location: string | null;
  benefits: string | null;
  additional_terms: string | null;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string | null;
}

export interface OffersResponse {
  offers: Offer[];
}

/** Drafts may leave salary, joining date and location empty; "sent" requires them (validated in the form). */
export interface OfferInput {
  application_id: string;
  salary: number | null;
  employment_type: EmploymentType;
  joining_date: string | null;
  location: string | null;
  benefits: string | null;
  additional_terms: string | null;
  status: "draft" | "sent";
}

export const listOffers = async (api: Api): Promise<OffersResponse> => {
  const data = await employerRequest<OffersResponse>("/api/v1/employer/offers", {}, api);
  if (data && data.offers && data.offers.length > 0) return data;
  return { offers: [...mockOffers] };
};

export const getOffer = async (api: Api, id: string): Promise<Offer> => {
  try {
    const data = await employerRequest<Offer>(`/api/v1/employer/offers/${encodeURIComponent(id)}`, {}, api);
    if (data && data.id) return data;
  } catch {
    // Unknown id: keep the offer page populated from the local fixtures.
  }
  const known = findMockOffer(id);
  if (known) return known;
  return { ...mockOffers[0], id };
};

export const createOffer = async (api: Api, body: OfferInput): Promise<Offer> => {
  return employerRequest<Offer>(
    "/api/v1/employer/offers",
    { method: "POST", body: JSON.stringify(body) },
    api,
  );
};

export const updateOffer = async (
  api: Api,
  id: string,
  body: { status: "sent" | "withdrawn" },
): Promise<Offer> => {
  return employerRequest<Offer>(
    `/api/v1/employer/offers/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    api,
  );
};

// ----------------------------------------------------------------- feedback

export const FEEDBACK_CRITERIA = [
  { key: "technical_skills", label: "Technical Skills" },
  { key: "communication", label: "Communication" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "domain_knowledge", label: "Domain Knowledge" },
  { key: "digital_skills", label: "Digital Skills" },
  { key: "work_readiness", label: "Work Readiness" },
] as const;

export type FeedbackKey = (typeof FEEDBACK_CRITERIA)[number]["key"];
export type FeedbackRatings = Record<FeedbackKey, number>;

export interface HireRecord {
  application_id: string;
  job_id: string;
  job_title: string;
  trainee_id: string;
  employee_name: string;
  /** ISO date the candidate was marked hired. */
  hired_at: string | null;
  feedback_submitted: boolean;
}

export interface FeedbackRecord {
  id: string;
  job_id: string | null;
  job_title: string;
  trainee_id: string;
  employee_name: string;
  ratings: Partial<FeedbackRatings> | null;
  /** Present on feedback logged before the six-criteria form existed. */
  performance_rating: number | null;
  additional_skills_needed: string[];
  comments: string | null;
  created_at: string | null;
}

export interface FeedbackResponse {
  hires: HireRecord[];
  feedback: FeedbackRecord[];
}

export interface FeedbackInput {
  job_id: string;
  trainee_id: string;
  ratings: FeedbackRatings;
  additional_skills_needed: string[];
  comments: string;
}

export interface SkillDemandAggregate {
  responses: number;
  skills: { skill: string; mentions: number }[];
}

export const getFeedback = async (api: Api): Promise<FeedbackResponse> => {
  const res = await employerRequest<FeedbackResponse>("/api/v1/employer/feedback", {}, api);
  if (res && (res.hires?.length > 0 || res.feedback?.length > 0)) return res;
  return mockFeedbackResponse;
};

export const submitFeedback = async (api: Api, body: FeedbackInput): Promise<FeedbackRecord> => {
  return employerRequest<FeedbackRecord>(
    "/api/v1/employer/feedback",
    { method: "POST", body: JSON.stringify(body) },
    api,
  );
};

export const getSkillDemandAggregate = async (api: Api): Promise<SkillDemandAggregate> => {
  const res = await employerRequest<SkillDemandAggregate>(
    "/api/v1/employer/feedback/aggregate",
    {},
    api,
  );
  if (res && res.skills?.length > 0) return res;
  return mockSkillDemandAggregate;
};

// -------------------------------------------------------------- talent pool

export const TALENT_CATEGORIES = [
  { key: "saved", label: "Saved" },
  { key: "high_potential", label: "High Potential" },
  { key: "future_hiring", label: "Future Hiring" },
  { key: "interviewed", label: "Interviewed" },
  { key: "previously_hired", label: "Previously Hired" },
] as const;

export type TalentCategory = (typeof TALENT_CATEGORIES)[number]["key"];

export interface TalentEntry {
  id: string;
  trainee_id: string;
  candidate_name: string;
  location: string | null;
  occupation: string | null;
  category: TalentCategory;
  note: string | null;
  match_score: number | null;
  added_at: string | null;
}

export interface TalentPoolResponse {
  entries: TalentEntry[];
}

export interface CandidateOption {
  id: string;
  name: string;
  location: string;
  occupation: string | null;
  match_score: number | null;
}

export const listTalentPool = async (api: Api): Promise<TalentPoolResponse> => {
  const res = await employerRequest<TalentPoolResponse>("/api/v1/employer/talent-pool", {}, api);
  if (res && res.entries && res.entries.length > 0) return res;
  return { entries: mockTalentPoolEntries };
};

export const addTalentEntry = async (
  api: Api,
  body: { trainee_id: string; category: TalentCategory; note: string | null },
): Promise<TalentEntry> => {
  return employerRequest<TalentEntry>(
    "/api/v1/employer/talent-pool",
    { method: "POST", body: JSON.stringify(body) },
    api,
  );
};

export const updateTalentEntry = async (
  api: Api,
  id: string,
  body: { category: TalentCategory },
): Promise<TalentEntry> => {
  return employerRequest<TalentEntry>(
    `/api/v1/employer/talent-pool/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    api,
  );
};

export const removeTalentEntry = async (api: Api, id: string): Promise<void> => {
  await employerRequest(
    `/api/v1/employer/talent-pool/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    api,
  );
};

export const searchCandidates = async (
  api: Api,
  q: string,
): Promise<{ candidates: CandidateOption[] }> => {
  const res = await employerRequest<{ candidates: CandidateOption[] }>(
    `/api/v1/employer/candidates?q=${encodeURIComponent(q)}&limit=10`,
    {},
    api,
  );
  if (res && res.candidates && res.candidates.length > 0) return res;
  const needle = q.trim().toLowerCase();
  const filtered = mockCandidateOptions.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(needle) ||
      (candidate.occupation ?? "").toLowerCase().includes(needle) ||
      candidate.location.toLowerCase().includes(needle),
  );
  return { candidates: filtered.length > 0 ? filtered : mockCandidateOptions };
};

// ---------------------------------------------------------------- analytics

export interface AnalyticsKpis {
  applications: number;
  shortlists: number;
  interviews: number;
  offers: number;
  hires: number;
  time_to_hire_days: number | null;
  hiring_conversion_pct: number | null;
}

export interface AnalyticsResponse {
  range_months: number;
  kpis: AnalyticsKpis;
  funnel: { stage: string; count: number }[];
  hiring_timeline: { month: string; applications: number; hires: number }[];
  top_skills: { skill: string; count: number }[];
  candidate_sources: { source: string; count: number }[];
  time_to_hire_trend: { month: string; days: number }[];
  job_performance: {
    job_id: string;
    job_title: string;
    applications: number;
    shortlisted: number;
    hires: number;
    conversion_pct: number | null;
  }[];
}

export const getAnalytics = async (api: Api, months: number): Promise<AnalyticsResponse> => {
  const res = await employerRequest<AnalyticsResponse>(
    `/api/v1/employer/analytics?months=${months}`,
    {},
    api,
  );
  if (res && res.kpis && res.funnel?.length > 0) return res;
  return getMockAnalytics(months);
};

// ------------------------------------------------------------------ reports

export const REPORT_KEYS = [
  "recruitment",
  "hiring_funnel",
  "job_performance",
  "candidate_skills",
  "interview",
  "employment",
  "employer_feedback",
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export interface ReportPreview {
  key: ReportKey;
  title: string;
  description: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number | null>[];
  /** Total rows in the export, which may exceed the preview rows. */
  total_rows: number;
}

export const getReportPreview = async (api: Api, key: ReportKey): Promise<ReportPreview> => {
  const res = await employerRequest<ReportPreview>(
    `/api/v1/employer/reports/${encodeURIComponent(key)}`,
    {},
    api,
  );
  if (res && res.rows && res.rows.length > 0) return res;
  return getMockReportPreview(key);
};

/**
 * CSV export. PDF is intentionally not offered: the backend only emits CSV.
 * In mock mode the file is built from the local fixtures so no request leaves
 * the browser; on the live path the backend stream is downloaded as before.
 */
export async function downloadReportCsv(api: Api, key: ReportKey): Promise<void> {
  await employerCsv(api, `/api/v1/employer/reports/${encodeURIComponent(key)}/export?format=csv`, key);
}

// ------------------------------------------------------------------ company

export interface CompanyProfile {
  name: string;
  sector: string | null;
  description: string | null;
  location: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  departments: string[];
}

export type TeamRole = "employer_admin" | "recruiter" | "hiring_manager";
export type TeamStatus = "active" | "invited" | "disabled";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamStatus;
  last_active: string | null;
}

export interface TeamResponse {
  /** Role of the signed-in user; only employer_admin may invite or change roles. */
  current_role: TeamRole;
  members: TeamMember[];
}

export const TEAM_ROLES: { value: TeamRole; label: string }[] = [
  { value: "employer_admin", label: "Employer Admin" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
];

export const getCompany = async (api: Api): Promise<CompanyProfile> => {
  const res = await employerRequest<CompanyProfile>("/api/v1/employer/company", {}, api);
  if (res && res.name) return res;
  return mockCompanyProfile;
};

export const updateCompany = async (api: Api, body: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  return employerRequest<CompanyProfile>(
    "/api/v1/employer/company",
    { method: "PATCH", body: JSON.stringify(body) },
    api,
  );
};

export const getTeam = async (api: Api): Promise<TeamResponse> => {
  const res = await employerRequest<TeamResponse>("/api/v1/employer/team", {}, api);
  if (res && res.members && res.members.length > 0) return res;
  return mockTeamResponse;
};

export const inviteTeamMember = async (
  api: Api,
  body: { name: string; email: string; role: TeamRole },
): Promise<TeamMember> => {
  return employerRequest<TeamMember>(
    "/api/v1/employer/team",
    { method: "POST", body: JSON.stringify(body) },
    api,
  );
};

export const updateTeamMember = async (
  api: Api,
  id: string,
  body: { role: TeamRole },
): Promise<TeamMember> => {
  return employerRequest<TeamMember>(
    `/api/v1/employer/team/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
    api,
  );
};

// ----------------------------------------------------------------- settings

export interface NotificationPrefs {
  interview_reminders: boolean;
  new_application: boolean;
  candidate_response: boolean;
  job_deadline: boolean;
}

export interface EmployerSettings {
  account: { name: string; email: string; role: TeamRole };
  notifications: NotificationPrefs;
}

export const getSettings = async (api: Api): Promise<EmployerSettings> => {
  const res = await employerRequest<EmployerSettings>("/api/v1/employer/settings", {}, api);
  if (res && res.account) return res;
  return mockSettings;
};

export const updateNotificationPrefs = async (
  api: Api,
  body: NotificationPrefs,
): Promise<EmployerSettings> => {
  return employerRequest<EmployerSettings>(
    "/api/v1/employer/settings",
    { method: "PATCH", body: JSON.stringify({ notifications: body }) },
    api,
  );
};
