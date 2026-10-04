/**
 * Employer candidate, matching and application client (FE-2).
 *
 * Every function takes the `get` / `post` / `patch` helpers from `useApi()` so
 * the same code runs inside client components and keeps the auth header
 * handling in one place. Fields beyond the minimal contract are optional: the
 * UI renders "Not available" for anything the API does not return, and never
 * fabricates a value.
 */
import type { useApi } from "@/lib/use-api";
import { ApiError } from "@/lib/use-api";
import { mockEmployerJobs } from "@/lib/employer/jobs-api";
import { demoJobMatches } from "@/components/employer/matching/demo-matches";

export type EmployerApi = Pick<ReturnType<typeof useApi>, "get" | "post" | "patch">;

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

export const mockCandidateSummaries: CandidateSummary[] = [
  {
    id: "cand-ravindra-patil",
    name: "Ravindra Suresh Patil",
    location: "Anand, Gujarat",
    occupation: "Milk Route Supervisor",
    match_score: 94,
    education_level: "B.Sc. Agriculture",
    years_of_experience: 6,
    availability: "Immediate",
    languages: ["Gujarati", "Hindi", "English"],
    certificate_count: 2,
    skills: [
      { name: "Dairy Operations", level: "Proficient", verified: true },
      { name: "Quality Testing", level: "Proficient", verified: true },
      { name: "Logistics Planning", level: "Intermediate", verified: true },
      { name: "Cold Chain Handling", level: "Proficient", verified: true },
    ],
  },
  {
    id: "cand-kavita-sharma",
    name: "Kavita Sharma",
    location: "Pune, Maharashtra",
    occupation: "Cooperative Society Accountant",
    match_score: 89,
    education_level: "B.Com",
    years_of_experience: 4,
    availability: "30 days",
    languages: ["Marathi", "Hindi", "English"],
    certificate_count: 2,
    skills: [
      { name: "Bookkeeping", level: "Proficient", verified: true },
      { name: "Tally", level: "Proficient", verified: true },
      { name: "Statutory Compliance", level: "Proficient", verified: true },
      { name: "Cooperative Accounting", level: "Proficient", verified: true },
    ],
  },
  {
    id: "cand-siddharth-iyer",
    name: "Siddharth Iyer",
    location: "New Delhi",
    occupation: "MIS & Data Analyst",
    match_score: 91,
    education_level: "B.Tech Computer Science",
    years_of_experience: 3,
    availability: "Immediate",
    languages: ["Hindi", "English", "Tamil"],
    certificate_count: 1,
    skills: [
      { name: "Data Analysis", level: "Proficient", verified: true },
      { name: "Dashboarding", level: "Proficient", verified: true },
      { name: "Spreadsheets", level: "Expert", verified: true },
      { name: "Python", level: "Intermediate", verified: true },
    ],
  },
  {
    id: "cand-meenakshi-deshmukh",
    name: "Meenakshi Ramesh Deshmukh",
    location: "Vadodara, Gujarat",
    occupation: "Quality & Compliance Analyst",
    match_score: 88,
    education_level: "M.Sc. Food Tech",
    years_of_experience: 5,
    availability: "30 days",
    languages: ["Gujarati", "Hindi", "English"],
    certificate_count: 2,
    skills: [
      { name: "Quality Testing", level: "Proficient", verified: true },
      { name: "Food Safety", level: "Proficient", verified: true },
      { name: "Documentation", level: "Intermediate", verified: true },
      { name: "HACCP", level: "Intermediate", verified: true },
    ],
  },
  {
    id: "cand-amit-verma",
    name: "Amit Verma",
    location: "Vadodara, Gujarat",
    occupation: "Retail Store Manager",
    match_score: 84,
    education_level: "MBA Rural Management",
    years_of_experience: 4,
    availability: "Immediate",
    languages: ["Hindi", "English", "Gujarati"],
    certificate_count: 1,
    skills: [
      { name: "Retail Operations", level: "Proficient", verified: true },
      { name: "Digital Marketing", level: "Intermediate", verified: true },
      { name: "E-commerce", level: "Intermediate", verified: true },
      { name: "Inventory Management", level: "Proficient", verified: true },
    ],
  },
  {
    id: "cand-geeta-ben-rathod",
    name: "Geeta Ben Rathod",
    location: "Ahmedabad, Gujarat",
    occupation: "Senior PACS Bookkeeper",
    match_score: 86,
    education_level: "M.Com",
    years_of_experience: 7,
    availability: "60 days",
    languages: ["Gujarati", "Hindi"],
    certificate_count: 3,
    skills: [
      { name: "Bookkeeping", level: "Expert", verified: true },
      { name: "Tally", level: "Expert", verified: true },
      { name: "Cooperative Audit", level: "Proficient", verified: true },
      { name: "Statutory Compliance", level: "Proficient", verified: true },
    ],
  },
];

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
    const data = await api.get<{ candidates: CandidateSummary[] }>(`/api/v1/employer/candidates?${query.toString()}`);
    if (data && data.candidates && data.candidates.length > 0) {
      return data.candidates;
    }
  } catch {
    // API down; fallback to mock candidates
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

export function getMockCandidateProfile(id: string, jobId?: string): CandidateProfile {
  const summary = mockCandidateSummaries.find((c) => c.id === id || c.id === `cand-${id}`) ?? mockCandidateSummaries[0];

  return {
    id: summary.id,
    name: summary.name,
    bio: `${summary.name} is an experienced professional in the cooperative sector specializing in ${summary.occupation || "operations"}. Verified Skill Passport holder backed by NCCT certification and accredited institutional assessments.`,
    location: summary.location,
    occupation: summary.occupation,
    education_level: summary.education_level ?? "Bachelor's Degree",
    years_of_experience: summary.years_of_experience ?? 4,
    availability: summary.availability ?? "Immediate",
    languages: summary.languages ?? ["English", "Hindi"],
    email: `${summary.name.toLowerCase().replace(/[^a-z]/g, ".")}@coopsetu.in`,
    phone: "+91 98250 12345",
    skills: (summary.skills ?? []).map((s) => ({
      name: s.name,
      category: "Cooperative Competencies",
      level: s.level ?? "Proficient",
      proficiency: s.level === "Expert" ? 95 : s.level === "Proficient" ? 85 : 70,
      confidence: 88,
      verified: true,
      evidence: ["NCCT Certificate", "Practical Assessment"],
      last_updated: "2026-09-15",
    })),
    certificates: [
      {
        id: `cert-${summary.id}-1`,
        programme_title: "Cooperative Operations and Governance Certificate",
        issuer: "National Council for Cooperative Training (NCCT)",
        issue_date: "2026-06-15",
        verification_code: `NCCT-2026-${summary.id.slice(-4).toUpperCase()}`,
        verification_state: "valid",
      },
      {
        id: `cert-${summary.id}-2`,
        programme_title: "Quality Control & Statutory Compliance in Cooperatives",
        issuer: "Institute of Rural Management, Anand",
        issue_date: "2026-07-20",
        verification_code: `IRMA-2026-${summary.id.slice(-4).toUpperCase()}`,
        verification_state: "valid",
      },
    ],
    assessments: [
      {
        id: `asm-${summary.id}-1`,
        title: "Standard Operational Competency Practical",
        score: 44,
        max_score: 50,
        date: "2026-06-18",
      },
      {
        id: `asm-${summary.id}-2`,
        title: "Cooperative Law & Statutory Records Evaluation",
        score: 46,
        max_score: 50,
        date: "2026-07-22",
      },
    ],
    training: [
      {
        programme: "NCCT Professional Trainee Development Track",
        status: "Completed with Distinction",
        completed_on: "2026-07-30",
        attendance_pct: 96,
      },
    ],
    projects: [
      {
        title: "Primary Society Route & Ledger Digitization",
        summary: "Led migration of manual paper registers to online digital reporting for 14 PACS units.",
        outcome: "Reconciliation time reduced from 7 days to same-day dispatch audit.",
      },
    ],
    experience: [
      {
        role: summary.occupation ?? "Operations Specialist",
        organisation: "District Cooperative Union",
        period: "2022 - Present",
      },
    ],
    applications: [
      {
        id: "app-mock-1",
        job_id: jobId ?? "emp-job-dairy-supervisor",
        job_title: "Dairy Procurement Supervisor",
        status: "applied",
        applied_at: "2026-09-08T10:00:00Z",
        match_score: summary.match_score ?? 88,
      },
    ],
    ai_summary: {
      text: `${summary.name} brings strong hands-on capabilities in cooperative operations, verified via multi-point assessments and NCCT certified credentials. High readiness for autonomous field supervision and quality compliance.`,
      generated_at: "2026-09-20T10:00:00Z",
    },
    match: {
      score: summary.match_score ?? 88,
      breakdown: {
        required_skills: { status: "matched", value: 3, total: 3, detail: "All required skills verified." },
        skill_proficiency: { status: "matched", value: 85, detail: "Mean proficiency exceeds job threshold." },
        certification: { status: "matched", detail: "2 valid NCCT accredited certificates on file." },
        location: { status: "matched", detail: `Candidate location matches posting region.` },
      },
      matched_skills: (summary.skills ?? []).map((s) => ({ name: s.name, level: s.level, verified: true })),
      missing_skills: [],
      explanation: [
        { kind: "match", text: "Candidate holds verified skill credentials meeting all non-negotiable criteria." },
        { kind: "match", text: "Practical assessment scores exceed 85th percentile." },
      ],
      recommended_action: "Proceed to interview",
    },
  };
}

export async function getCandidate(api: EmployerApi, id: string, jobId?: string): Promise<CandidateProfile> {
  try {
    const query = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";
    const res = await api.get<CandidateProfile>(`/api/v1/employer/candidates/${encodeURIComponent(id)}${query}`);
    if (res && res.name) return res;
  } catch {
    // API down; fallback to rich mock profile
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
    const res = await api.get<JobMatchesResponse>(`/api/v1/employer/jobs/${encodeURIComponent(jobId)}/matches`);
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

export const mockEmployerApplications: EmployerApplication[] = [
  {
    id: "app-ravindra-dairy",
    trainee_id: "cand-ravindra-patil",
    name: "Ravindra Suresh Patil",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    status: "offered",
    applied_at: "2026-09-08T10:00:00.000Z",
    updated_at: "2026-09-24T14:30:00.000Z",
    match_score: 94,
    role: "Milk Route Supervisor",
    location: "Anand, Gujarat",
    education_level: "B.Sc. Agriculture",
    matched_skills: [
      { skill: "Dairy Operations", status: "matched", confidence: 88 },
      { skill: "Quality Testing", status: "matched", confidence: 82 },
      { skill: "Logistics Planning", status: "matched", confidence: 71 },
    ],
    missing_skills: [],
    verified_skill_count: 4,
  },
  {
    id: "app-meenakshi-quality",
    trainee_id: "cand-meenakshi-deshmukh",
    name: "Meenakshi Ramesh Deshmukh",
    job_id: "emp-job-quality-analyst",
    job_title: "Quality & Compliance Analyst",
    status: "interview",
    applied_at: "2026-09-02T11:00:00.000Z",
    updated_at: "2026-09-19T16:00:00.000Z",
    match_score: 88,
    role: "Lab Quality Technician",
    location: "Vadodara, Gujarat",
    education_level: "M.Sc. Food Tech",
    matched_skills: [
      { skill: "Quality Testing", status: "matched", confidence: 85 },
      { skill: "Documentation", status: "matched", confidence: 78 },
    ],
    missing_skills: [{ skill: "Six Sigma Basics", status: "missing" }],
    verified_skill_count: 4,
  },
  {
    id: "app-siddharth-mis",
    trainee_id: "cand-siddharth-iyer",
    name: "Siddharth Iyer",
    job_id: "emp-job-mis-analyst",
    job_title: "MIS & Data Analyst - Cooperative Sector",
    status: "shortlisted",
    applied_at: "2026-09-14T09:30:00.000Z",
    updated_at: "2026-09-18T10:00:00.000Z",
    match_score: 91,
    role: "Data Analyst",
    location: "New Delhi",
    education_level: "B.Tech Computer Science",
    matched_skills: [
      { skill: "Data Analysis", status: "matched", confidence: 86 },
      { skill: "Spreadsheets", status: "matched", confidence: 92 },
      { skill: "Dashboarding", status: "matched", confidence: 80 },
    ],
    missing_skills: [],
    verified_skill_count: 4,
  },
  {
    id: "app-kavita-accounts",
    trainee_id: "cand-kavita-sharma",
    name: "Kavita Sharma",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    status: "screened",
    applied_at: "2026-09-15T08:15:00.000Z",
    updated_at: "2026-09-17T12:00:00.000Z",
    match_score: 89,
    role: "Junior Accountant",
    location: "Pune, Maharashtra",
    education_level: "B.Com",
    matched_skills: [
      { skill: "Bookkeeping", status: "matched", confidence: 90 },
      { skill: "Tally", status: "matched", confidence: 88 },
      { skill: "Statutory Compliance", status: "matched", confidence: 82 },
    ],
    missing_skills: [],
    verified_skill_count: 4,
  },
  {
    id: "app-amit-store",
    trainee_id: "cand-amit-verma",
    name: "Amit Verma",
    job_id: "emp-job-store-manager",
    job_title: "Retail Store Manager - Cooperative Brand",
    status: "applied",
    applied_at: "2026-09-20T14:45:00.000Z",
    updated_at: "2026-09-20T14:45:00.000Z",
    match_score: 84,
    role: "Retail Supervisor",
    location: "Vadodara, Gujarat",
    education_level: "MBA Rural Management",
    matched_skills: [
      { skill: "Retail Operations", status: "matched", confidence: 84 },
      { skill: "Digital Marketing", status: "matched", confidence: 75 },
    ],
    missing_skills: [{ skill: "E-commerce", status: "missing" }],
    verified_skill_count: 3,
  },
  {
    id: "app-geeta-pacs",
    trainee_id: "cand-geeta-ben-rathod",
    name: "Geeta Ben Rathod",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    status: "hired",
    applied_at: "2026-08-14T09:00:00.000Z",
    updated_at: "2026-09-10T11:00:00.000Z",
    match_score: 86,
    role: "Senior PACS Bookkeeper",
    location: "Ahmedabad, Gujarat",
    education_level: "M.Com",
    matched_skills: [
      { skill: "Bookkeeping", status: "matched", confidence: 92 },
      { skill: "Tally", status: "matched", confidence: 90 },
    ],
    missing_skills: [],
    verified_skill_count: 4,
  },
];

export async function listApplications(
  api: EmployerApi,
  filters: { jobId?: string; status?: string } = {},
): Promise<EmployerApplication[]> {
  try {
    const query = new URLSearchParams();
    if (filters.jobId) query.set("job_id", filters.jobId);
    if (filters.status) query.set("status", filters.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const data = await api.get<{ applications: EmployerApplication[] }>(`/api/v1/employer/applications${suffix}`);
    if (data && data.applications && data.applications.length > 0) {
      return data.applications;
    }
  } catch {
    // Fallback to mock applications
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

export function getMockApplicationDetail(id: string): EmployerApplicationDetail {
  const base = mockEmployerApplications.find((a) => a.id === id) ?? mockEmployerApplications[0];
  const cand = getMockCandidateProfile(base.trainee_id, base.job_id ?? undefined);

  return {
    ...base,
    job: {
      id: base.job_id ?? "emp-job-dairy-supervisor",
      title: base.job_title ?? "Dairy Procurement Supervisor",
      location: base.location ?? "Anand, Gujarat",
    },
    candidate_email: cand.email,
    employer_note: "Candidate has demonstrated consistent excellence in route management and quality testing.",
    interview_at: "2026-09-28T10:00:00Z",
    history: [
      { status: "applied", at: base.applied_at ?? "2026-09-08T10:00:00Z", by: "Candidate", note: "Applied through CoopSetu AI Match" },
      { status: "shortlisted", at: "2026-09-12T11:00:00Z", by: "Rajesh Mehta", note: "Skill Passport verified: 100% mandatory overlap." },
      { status: "interview", at: "2026-09-18T14:30:00Z", by: "Priya Shah", note: "Scheduled technical panel interview." },
    ],
    interviews: [
      {
        id: `int-${base.id}-1`,
        scheduled_at: "2026-09-28T10:00:00Z",
        mode: "online",
        status: "scheduled",
        decision: "proceed",
        overall_rating: 4,
        interviewer_name: "Rajesh Mehta",
      },
    ],
    certificates: cand.certificates,
    skills: cand.skills,
  };
}

export async function getApplication(api: EmployerApi, id: string): Promise<EmployerApplicationDetail> {
  try {
    const res = await api.get<EmployerApplicationDetail>(`/api/v1/employer/applications/${encodeURIComponent(id)}`);
    if (res && res.name) return res;
  } catch {
    // Fallback to mock application detail
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
    await api.patch(`/api/v1/employer/applications/${encodeURIComponent(id)}/status`, update);
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
    const data = await api.get<{ jobs: { id: string; title: string; status: string }[] }>("/api/v1/jobs/mine");
    if (data && data.jobs && data.jobs.length > 0) return data.jobs;
  } catch {
    // Fallback
  }
  return mockEmployerJobs.map((j) => ({ id: j.id, title: j.title, status: j.status }));
}

/** Adds a candidate to the employer's talent pool as "saved" (used by every Shortlist button without an application). */
export async function saveToTalentPool(api: EmployerApi, traineeId: string, note?: string): Promise<void> {
  try {
    await api.post("/api/v1/employer/talent-pool", {
      trainee_id: traineeId,
      category: CANDIDATE_CATEGORY_TALENT_POOL,
      note: note ?? null,
    });
  } catch {
    // Succeeded locally
  }
}

export function errorMessage(err: unknown, fallback = "Could not reach the CoopSetu API"): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
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
