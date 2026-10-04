import type { useApi } from "@/lib/use-api";

/**
 * API client for the employer workflow module (interviews, offers, feedback,
 * talent pool, analytics, reports, company, team, settings).
 *
 * Every call takes the `useApi()` instance from the page so auth headers and
 * ApiError handling stay in one place. Response shapes mirror the BE-B contract
 * in `api/v1/employer_workflow.py`; anything not yet confirmed by the backend is
 * marked "assumed" below.
 */

export type Api = ReturnType<typeof useApi>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DEMO_TOKEN = "mock_token";

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

export const listInterviews = (api: Api) => api.get<InterviewsResponse>("/api/v1/employer/interviews");
export const getInterview = (api: Api, id: string) =>
  api.get<Interview>(`/api/v1/employer/interviews/${id}`);
export const createInterview = (api: Api, body: InterviewCreate) =>
  api.post<Interview>("/api/v1/employer/interviews", body);
export const updateInterview = (
  api: Api,
  id: string,
  body: Partial<Pick<Interview, "status" | "decision" | "scheduled_at" | "duration_minutes" | "meeting_link">>,
) => api.patch<Interview>(`/api/v1/employer/interviews/${id}`, body);
export const saveInterviewEvaluation = (api: Api, id: string, body: InterviewEvaluationInput) =>
  api.post<Interview>(`/api/v1/employer/interviews/${id}/evaluation`, body);
export const getApplicationSummary = (api: Api, id: string) =>
  api.get<ApplicationSummary>(`/api/v1/employer/applications/${id}`);

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

export const listOffers = (api: Api) => api.get<OffersResponse>("/api/v1/employer/offers");
export const getOffer = (api: Api, id: string) => api.get<Offer>(`/api/v1/employer/offers/${id}`);
export const createOffer = (api: Api, body: OfferInput) => api.post<Offer>("/api/v1/employer/offers", body);
export const updateOffer = (api: Api, id: string, body: { status: "sent" | "withdrawn" }) =>
  api.patch<Offer>(`/api/v1/employer/offers/${id}`, body);

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

export const getFeedback = (api: Api) => api.get<FeedbackResponse>("/api/v1/employer/feedback");
export const submitFeedback = (api: Api, body: FeedbackInput) =>
  api.post<FeedbackRecord>("/api/v1/employer/feedback", body);
export const getSkillDemandAggregate = (api: Api) =>
  api.get<SkillDemandAggregate>("/api/v1/employer/feedback/aggregate");

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

export const listTalentPool = (api: Api) => api.get<TalentPoolResponse>("/api/v1/employer/talent-pool");
export const addTalentEntry = (api: Api, body: { trainee_id: string; category: TalentCategory; note: string | null }) =>
  api.post<TalentEntry>("/api/v1/employer/talent-pool", body);
export const updateTalentEntry = (api: Api, id: string, body: { category: TalentCategory }) =>
  api.patch<TalentEntry>(`/api/v1/employer/talent-pool/${id}`, body);
export const removeTalentEntry = (api: Api, id: string) =>
  api.request<void>(`/api/v1/employer/talent-pool/${id}`, { method: "DELETE" });
export const searchCandidates = (api: Api, q: string) =>
  api.get<{ candidates: CandidateOption[] }>(`/api/v1/employer/candidates?q=${encodeURIComponent(q)}&limit=10`);

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

export const getAnalytics = (api: Api, months: number) =>
  api.get<AnalyticsResponse>(`/api/v1/employer/analytics?months=${months}`);

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

export const getReportPreview = (api: Api, key: ReportKey) =>
  api.get<ReportPreview>(`/api/v1/employer/reports/${key}`);

/**
 * CSV export. PDF is intentionally not offered: the backend only emits CSV.
 * Fetches with the same auth header as useApi and triggers a browser download.
 */
export async function downloadReportCsv(key: ReportKey): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/v1/employer/reports/${key}/export?format=csv`,
    { headers: { Authorization: `Bearer ${DEMO_TOKEN}` } },
  );
  if (!response.ok) {
    let detail = response.statusText || `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // no JSON body; keep statusText
    }
    throw new Error(detail);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `coopsetu-${key}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

export const getCompany = (api: Api) => api.get<CompanyProfile>("/api/v1/employer/company");
export const updateCompany = (api: Api, body: Partial<CompanyProfile>) =>
  api.patch<CompanyProfile>("/api/v1/employer/company", body);
export const getTeam = (api: Api) => api.get<TeamResponse>("/api/v1/employer/team");
export const inviteTeamMember = (api: Api, body: { name: string; email: string; role: TeamRole }) =>
  api.post<TeamMember>("/api/v1/employer/team", body);
export const updateTeamMember = (api: Api, id: string, body: { role: TeamRole }) =>
  api.patch<TeamMember>(`/api/v1/employer/team/${id}`, body);

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

export const getSettings = (api: Api) => api.get<EmployerSettings>("/api/v1/employer/settings");
export const updateNotificationPrefs = (api: Api, body: NotificationPrefs) =>
  api.patch<EmployerSettings>("/api/v1/employer/settings", { notifications: body });
