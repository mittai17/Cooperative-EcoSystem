import { fetchWithAuth, getApiBase, resolveAuthToken } from "@/lib/api";
import { demoDashboard } from "@/components/employer/dashboard/demo-data";
import { demoJobMatches } from "@/components/employer/matching/demo-matches";
import type {
  FunnelRange,
  JobInput,
  JobRequirement,
  JobStatus,
  TimelineRange,
} from "@/lib/employer/jobs-api";
import type {
  EvaluationScores,
  FeedbackRatings,
  FeedbackRecord,
  Interview,
  InterviewCreate,
  InterviewEvaluationInput,
  InterviewMode,
  Offer,
  OfferInput,
  OfferStatus,
  ReportKey,
  ReportPreview,
  TalentCategory,
  TalentEntry,
  TeamRole,
} from "@/lib/employer/workflow-api";
import type { useApi } from "@/lib/use-api";
import {
  applyMockJobStatus,
  findMockJob,
  getMockEmployerJobDetail,
  JOB_REQUIREMENTS,
  mockCompanyProfile,
  mockEmployerJobs,
  mockSettings,
  mockSkillDemand,
  mockTeamResponse,
} from "@/lib/employer/fixtures/catalog";
import {
  getMockApplicationDetail,
  getMockCandidateProfile,
  mockCandidateSummaries,
  mockEmployerApplications,
} from "@/lib/employer/fixtures/people";
import {
  addMockTeamMember,
  applyMockOfferStatus,
  findMockInterview,
  findMockOffer,
  getMockAnalytics,
  getMockApplicationSummary,
  getMockReportPreview,
  mockFeedbackResponse,
  mockInterviews,
  mockOffers,
  mockSkillDemandAggregate,
  mockTalentPoolEntries,
  removeMockTalentEntry,
  setMockTalentCategory,
  upsertMockFeedbackRecord,
  upsertMockTalentEntry,
} from "@/lib/employer/fixtures/workflow";
import { mockInterviewJobs, questionsForJob } from "@/lib/employer/fixtures/interview-studio";
import type { InterviewHistoryEntry } from "@/lib/ai-interview/common";

export type Api = ReturnType<typeof useApi>;

/**
 * The employer portal is served from its own mock-first gateway. Set
 * NEXT_PUBLIC_EMPLOYER_LIVE_API=true to talk to the FastAPI backend instead;
 * until then no employer request leaves the browser.
 */
export const EMPLOYER_MOCK_MODE = process.env.NEXT_PUBLIC_EMPLOYER_LIVE_API !== "true";

export class EmployerHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "EmployerHttpError";
    this.status = status;
  }
}

const SIMULATED_LATENCY_MS = 120;

const delay = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

function parseBody(options: RequestInit): Record<string, unknown> {
  if (typeof options.body !== "string") return {};
  try {
    const parsed: unknown = JSON.parse(options.body);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function decode(value: string | null): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean).map(decode);
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function notFound(pathname: string): EmployerHttpError {
  return new EmployerHttpError(404, `404 Not Found: ${pathname}`);
}

let sequence = 0;
function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

function matchesCandidates(qs: URLSearchParams): typeof mockCandidateSummaries {
  const q = (qs.get("q") ?? "").trim().toLowerCase();
  const skill = (qs.get("skill") ?? "").trim().toLowerCase();
  const location = (qs.get("location") ?? "").trim().toLowerCase();
  const minMatch = Number(qs.get("min_match"));
  const limit = Number(qs.get("limit"));

  let list = [...mockCandidateSummaries];
  if (q) {
    list = list.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(q) ||
        (candidate.occupation ?? "").toLowerCase().includes(q) ||
        candidate.location.toLowerCase().includes(q) ||
        (candidate.education_level ?? "").toLowerCase().includes(q) ||
        (candidate.skills ?? []).some((skill) => skill.name.toLowerCase().includes(q)),
    );
  }
  if (skill) {
    list = list.filter((candidate) => (candidate.skills ?? []).some((item) => item.name.toLowerCase().includes(skill)));
  }
  if (location) {
    list = list.filter((candidate) => candidate.location.toLowerCase().includes(location));
  }
  if (Number.isFinite(minMatch)) {
    list = list.filter((candidate) => (candidate.match_score ?? 0) >= minMatch);
  }
  if (Number.isFinite(limit) && limit > 0) {
    list = list.slice(0, limit);
  }
  return list;
}

function createMockJob(body: Record<string, unknown>): { id: string; status: JobStatus } {
  const input = body as unknown as JobInput;
  const id = nextId("emp-job");
  const salaryMin = asNumber(input.salary_min);
  const salaryMax = asNumber(input.salary_max);
  const status: JobStatus = input.status ?? "draft";
  mockEmployerJobs.unshift({
    id,
    title: input.title,
    department: input.department || null,
    location: input.location || null,
    employment_type: input.employment_type,
    status,
    salary_range:
      salaryMin !== null && salaryMax !== null
        ? `₹${salaryMin.toLocaleString("en-IN")} - ₹${salaryMax.toLocaleString("en-IN")} / month`
        : null,
    openings: input.openings ?? 1,
    applications_count: 0,
    shortlisted_count: 0,
    interview_count: 0,
    match_rate: null,
    posted_at: status === "open" ? new Date().toISOString() : null,
    deadline: input.deadline || null,
  });
  return { id, status };
}

function updateMockJob(id: string, body: Record<string, unknown>): { id: string; status: JobStatus } {
  const job = findMockJob(id);
  if (!job) throw notFound(`/api/v1/employer/jobs/${id}`);
  const input = body as Partial<JobInput>;
  if (input.title) job.title = input.title;
  if (input.department !== undefined) job.department = input.department || null;
  if (input.location !== undefined) job.location = input.location || null;
  if (input.employment_type) job.employment_type = input.employment_type;
  if (input.openings !== undefined) job.openings = input.openings;
  if (input.deadline !== undefined) job.deadline = input.deadline || null;
  if (input.status) job.status = input.status;
  return { id, status: job.status };
}

function createMockInterview(body: Record<string, unknown>): Interview {
  const input = body as unknown as InterviewCreate;
  const application = getMockApplicationSummary(input.application_id);
  const interview: Interview = {
    id: nextId("int"),
    application_id: application.id,
    job_id: application.job_id,
    job_title: application.job_title,
    trainee_id: application.trainee_id,
    candidate_name: application.candidate_name,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    mode: (input.mode ?? "online") as InterviewMode,
    meeting_link: input.meeting_link ?? null,
    interviewer_name: input.interviewer_name ?? null,
    notes: input.notes ?? null,
    status: "scheduled",
    decision: null,
    overall_recommendation: null,
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  };
  mockInterviews.unshift(interview);
  const applicationRecord = mockEmployerApplications.find((item) => item.id === application.id);
  if (applicationRecord) applicationRecord.status = "interview";
  return interview;
}

function createMockOffer(body: Record<string, unknown>): Offer {
  const input = body as unknown as OfferInput;
  const application = getMockApplicationSummary(input.application_id);
  const offer: Offer = {
    id: nextId("off"),
    application_id: application.id,
    job_id: application.job_id,
    job_title: application.job_title,
    trainee_id: application.trainee_id,
    candidate_name: application.candidate_name,
    status: input.status,
    salary: asNumber(input.salary),
    employment_type: input.employment_type,
    joining_date: input.joining_date ?? null,
    location: input.location ?? null,
    benefits: input.benefits ?? null,
    additional_terms: input.additional_terms ?? null,
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
    responded_at: null,
    created_at: new Date().toISOString(),
  };
  mockOffers.unshift(offer);
  return offer;
}

function submitMockFeedback(body: Record<string, unknown>): FeedbackRecord {
  const input = body as unknown as {
    job_id: string;
    trainee_id: string;
    ratings: FeedbackRatings;
    additional_skills_needed: string[];
    comments: string;
  };
  const hire = mockFeedbackResponse.hires.find((item) => item.trainee_id === input.trainee_id);
  if (hire) hire.feedback_submitted = true;
  const values = Object.values(input.ratings ?? {}).filter((value): value is number => typeof value === "number");
  const record: FeedbackRecord = {
    id: nextId("fb"),
    job_id: input.job_id,
    job_title: hire?.job_title ?? "Position",
    trainee_id: input.trainee_id,
    employee_name: hire?.employee_name ?? "Employee",
    ratings: input.ratings,
    performance_rating:
      values.length > 0 ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null,
    additional_skills_needed: input.additional_skills_needed ?? [],
    comments: input.comments,
    created_at: new Date().toISOString(),
  };
  return upsertMockFeedbackRecord(record);
}

function addMockTalentEntry(body: Record<string, unknown>): TalentEntry {
  const traineeId = String(body.trainee_id ?? "");
  const candidate = mockCandidateSummaries.find((item) => item.id === traineeId);
  const entry: TalentEntry = {
    id: nextId("tp"),
    trainee_id: traineeId,
    candidate_name: candidate?.name ?? "Candidate",
    location: candidate?.location ?? null,
    occupation: candidate?.occupation ?? null,
    category: (body.category ?? "saved") as TalentCategory,
    note: (body.note as string | null) ?? null,
    match_score: candidate?.match_score ?? 85,
    added_at: new Date().toISOString(),
  };
  return upsertMockTalentEntry(entry);
}

function resolveMock(path: string, method: string, options: RequestInit): unknown {
  const [pathname, search = ""] = path.split("?");
  const qs = new URLSearchParams(search);
  const parts = segments(pathname);
  const body = parseBody(options);
  const is = (verb: string) => method === verb;

  if (parts[0] !== "api" || parts[1] !== "v1") throw notFound(pathname);

  if (parts[2] === "skills" && parts[3] === "demand" && is("GET")) {
    return { skill_demand: mockSkillDemand };
  }

  if (parts[2] === "jobs" && parts[3] === "mine" && is("GET")) {
    return {
      jobs: mockEmployerJobs.map((job) => ({ id: job.id, title: job.title, status: job.status })),
    };
  }

  if (parts[2] !== "employer") throw notFound(pathname);
  const resource = parts[3] ?? "";

  if (resource === "dashboard" && is("GET")) {
    const funnel = (qs.get("funnel_range") as FunnelRange) || "3m";
    const timeline = (qs.get("timeline_range") as TimelineRange) || "6m";
    return demoDashboard(funnel, timeline);
  }

  if (resource === "jobs") {
    const id = parts[4] ? decode(parts[4]) : null;
    const action = parts[5] ? decode(parts[5]) : null;
    if (!id) {
      if (is("GET")) return { jobs: mockEmployerJobs };
      if (is("POST")) return createMockJob(body);
      throw notFound(pathname);
    }
    if (action === "requirements") {
      if (is("GET")) return { requirements: JOB_REQUIREMENTS[id] ?? [] };
      if (is("PUT")) {
        const requirements = Array.isArray(body.requirements) ? (body.requirements as JobRequirement[]) : [];
        JOB_REQUIREMENTS[id] = requirements;
        return { requirements };
      }
      throw notFound(pathname);
    }
    if (action === "matches" && is("GET")) {
      if (!findMockJob(id)) throw notFound(pathname);
      return demoJobMatches(id);
    }
    if (action && ["publish", "pause", "close"].includes(action) && is("POST")) {
      const next = action === "publish" ? "open" : action === "pause" ? "paused" : "closed";
      return applyMockJobStatus(id, next as JobStatus);
    }
    if (action) throw notFound(pathname);
    if (is("GET")) {
      const detail = getMockEmployerJobDetail(id);
      if (!detail) throw notFound(pathname);
      return detail;
    }
    if (is("PATCH") || is("PUT")) return updateMockJob(id, body);
    throw notFound(pathname);
  }

  if (resource === "candidates") {
    const id = parts[4] ? decode(parts[4]) : null;
    if (!id) {
      if (is("GET")) return { candidates: matchesCandidates(qs) };
      throw notFound(pathname);
    }
    if (is("GET")) return getMockCandidateProfile(id, qs.get("job_id") ?? undefined);
    throw notFound(pathname);
  }

  if (resource === "applications") {
    const id = parts[4] ? decode(parts[4]) : null;
    const action = parts[5] ? decode(parts[5]) : null;
    if (!id) {
      if (is("GET")) {
        const jobId = qs.get("job_id");
        const status = qs.get("status");
        let list = [...mockEmployerApplications];
        if (jobId) list = list.filter((item) => item.job_id === jobId);
        if (status && status !== "all") list = list.filter((item) => item.status === status);
        return { applications: list };
      }
      throw notFound(pathname);
    }
    if (action === "status" && is("PATCH")) {
      const record = mockEmployerApplications.find((item) => item.id === id);
      if (!record) throw notFound(pathname);
      const next = String(body.status ?? record.status);
      record.status = next;
      record.updated_at = new Date().toISOString();
      return { id, status: next };
    }
    if (action === "notes" && (is("PATCH") || is("PUT"))) {
      return { id, employer_note: (body.employer_note as string | null) ?? null };
    }
    if (action) throw notFound(pathname);
    if (is("GET")) return getMockApplicationDetail(id);
    throw notFound(pathname);
  }

  if (resource === "interviews") {
    const id = parts[4] ? decode(parts[4]) : null;
    const action = parts[5] ? decode(parts[5]) : null;
    if (!id) {
      if (is("GET")) return { interviews: [...mockInterviews] };
      if (is("POST")) return createMockInterview(body);
      throw notFound(pathname);
    }
    const interview = findMockInterview(id);
    if (action === "evaluation" && is("POST")) {
      if (!interview) throw notFound(pathname);
      const input = body as unknown as InterviewEvaluationInput;
      const scores = (input.scores ?? {}) as EvaluationScores;
      const values = Object.values(scores).filter((value): value is number => typeof value === "number");
      interview.evaluation = scores;
      interview.overall_recommendation = input.overall_recommendation ?? null;
      interview.evaluation_notes = input.notes ?? null;
      interview.status = "completed";
      if (values.length > 0) {
        interview.overall_rating = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      }
      return interview;
    }
    if (action) throw notFound(pathname);
    if (!interview) throw notFound(pathname);
    if (is("PATCH")) {
      if (typeof body.status === "string") interview.status = body.status as Interview["status"];
      if (typeof body.decision === "string") interview.decision = body.decision as Interview["decision"];
      if (typeof body.scheduled_at === "string") interview.scheduled_at = body.scheduled_at;
      if (typeof body.duration_minutes === "number") interview.duration_minutes = body.duration_minutes;
      if (body.meeting_link !== undefined) interview.meeting_link = body.meeting_link as string | null;
      return interview;
    }
    if (is("GET")) return interview;
    throw notFound(pathname);
  }

  if (resource === "offers") {
    const id = parts[4] ? decode(parts[4]) : null;
    if (!id) {
      if (is("GET")) return { offers: [...mockOffers] };
      if (is("POST")) return createMockOffer(body);
      throw notFound(pathname);
    }
    const offer = findMockOffer(id);
    if (!offer) throw notFound(pathname);
    if (is("GET")) return offer;
    if (is("PATCH")) {
      const next = String(body.status ?? offer.status) as OfferStatus;
      return applyMockOfferStatus(id, next) ?? offer;
    }
    throw notFound(pathname);
  }

  if (resource === "feedback") {
    const action = parts[4] ? decode(parts[4]) : null;
    if (action === "aggregate" && is("GET")) return mockSkillDemandAggregate;
    if (action) throw notFound(pathname);
    if (is("GET")) return mockFeedbackResponse;
    if (is("POST")) return submitMockFeedback(body);
    throw notFound(pathname);
  }

  if (resource === "talent-pool") {
    const id = parts[4] ? decode(parts[4]) : null;
    if (!id) {
      if (is("GET")) return { entries: [...mockTalentPoolEntries] };
      if (is("POST")) return addMockTalentEntry(body);
      throw notFound(pathname);
    }
    if (is("DELETE")) {
      removeMockTalentEntry(id);
      return null;
    }
    if (is("PATCH") || is("PUT")) {
      const entry = setMockTalentCategory(id, String(body.category ?? "saved") as TalentCategory);
      if (!entry) throw notFound(pathname);
      return entry;
    }
    if (is("GET")) {
      const entry = mockTalentPoolEntries.find((item) => item.id === id);
      if (!entry) throw notFound(pathname);
      return entry;
    }
    throw notFound(pathname);
  }

  if (resource === "analytics" && is("GET")) {
    return getMockAnalytics(Number(qs.get("months")) || 6);
  }

  if (resource === "reports") {
    const key = parts[4] ? decode(parts[4]) : null;
    if (!key || key === "export") throw notFound(pathname);
    if (is("GET")) return getMockReportPreview(key as ReportKey);
    throw notFound(pathname);
  }

  if (resource === "company" && (is("GET") || is("PATCH") || is("PUT"))) {
    if (is("PATCH") || is("PUT")) Object.assign(mockCompanyProfile, body);
    return mockCompanyProfile;
  }

  if (resource === "team") {
    const id = parts[4] ? decode(parts[4]) : null;
    if (!id) {
      if (is("GET")) return mockTeamResponse;
      if (is("POST")) {
        const member = addMockTeamMember({
          name: String(body.name ?? "Team Member"),
          email: String(body.email ?? "member@amul.coop"),
          role: (body.role ?? "recruiter") as TeamRole,
        });
        mockTeamResponse.members.push(member);
        return member;
      }
      throw notFound(pathname);
    }
    const member = mockTeamResponse.members.find((item) => item.id === id);
    if (is("PATCH") || is("PUT")) {
      if (body.role) {
        if (!member) throw notFound(pathname);
        member.role = body.role as TeamRole;
      }
      return member ?? mockTeamResponse.members[0];
    }
    throw notFound(pathname);
  }

  if (resource === "settings" && (is("GET") || is("PATCH") || is("PUT"))) {
    if ((is("PATCH") || is("PUT")) && body.notifications) {
      mockSettings.notifications = { ...(body.notifications as typeof mockSettings.notifications) };
    }
    if ((is("PATCH") || is("PUT")) && body.account) {
      Object.assign(mockSettings.account, body.account as Partial<typeof mockSettings.account>);
    }
    return mockSettings;
  }

  if (resource === "ai-interview") {
    const action = parts[4] ? decode(parts[4]) : null;
    const sessionId = parts[5] ? decode(parts[5]) : null;
    if (action === "jobs" && is("GET")) return { items: mockInterviewJobs };
    if (action === "sessions" && !sessionId && is("POST")) {
      const jobId = String(body.job_id ?? "");
      const job = mockInterviewJobs.find((item) => item.id === jobId) ?? {
        id: jobId,
        title: "Cooperative Technical Specialist",
        status: "open",
      };
      return {
        session_id: nextId("mock-session"),
        job: { id: job.id, title: job.title },
        first_question: questionsForJob(jobId)[0],
        source: "gemini",
        disclaimer:
          "AI-assisted technical interview simulator powered by Gemini & NURVEX Skill Passport benchmarks.",
      };
    }
    if (action === "sessions" && sessionId && parts[6] === "turns" && is("POST")) {
      const input = body as unknown as { job_id: string; history: InterviewHistoryEntry[] };
      const questions = questionsForJob(input.job_id);
      const asked = (input.history ?? []).filter((entry) => entry.role === "interviewer").length;
      const next = asked < questions.length ? questions[asked] : null;
      return {
        next_question: next,
        source: next ? "gemini" : null,
        turn_index: asked + 1,
        done: next === null,
      };
    }
    if (action === "sessions" && sessionId && parts[6] === "evaluate" && is("POST")) {
      const input = body as unknown as { job_id: string; history: InterviewHistoryEntry[] };
      const job = mockInterviewJobs.find((item) => item.id === input.job_id) ?? {
        id: input.job_id,
        title: "Technical Specialist",
        status: "open",
      };
      const answers = (input.history ?? []).filter((entry) => entry.role === "candidate");
      return {
        session_id: sessionId,
        label: `Evaluation: ${job.title}`,
        source: "gemini",
        answers_evaluated: answers.length,
        scores: {
          communication: 4,
          domain_knowledge: 5,
          problem_solving: 4,
          cooperative_sector_knowledge: 5,
        },
        strengths: [
          "Strong familiarity with cooperative dairy workflows and automation requirements.",
          "Clear and structured articulation of root cause analysis.",
          "Demonstrated understanding of hygiene, HACCP, and precision monitoring protocols.",
        ],
        gaps: ["Could expand on automated data logging integration with state-level cooperative federated servers."],
        follow_up_topics: [
          "SCADA distributed network redundancy",
          "Predictive maintenance scheduling algorithms",
        ],
        note: "Candidate demonstrates strong practical competence and alignment with cooperative sector operational values.",
        disclaimer:
          "AI evaluation is designed to assist hiring managers in structured assessment and does not constitute a final hiring verdict.",
      };
    }
    throw notFound(pathname);
  }

  throw notFound(pathname);
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function previewToCsv(preview: ReportPreview): string {
  const escape = (value: string): string => `"${value.replace(/"/g, '""')}"`;
  const header = preview.columns.map((column) => escape(column.label)).join(",");
  const rows = preview.rows.map((row) =>
    preview.columns.map((column) => escape(String(row[column.key] ?? ""))).join(","),
  );
  return [header, ...rows].join("\n");
}

/**
 * CSV export for a report. In mock mode the file is generated from the local
 * fixtures so the browser never reaches the network; on the live path the
 * backend stream is downloaded instead.
 */
export async function employerCsv(
  transport: Pick<Api, "request"> | undefined,
  path: string,
  reportKey: string,
): Promise<void> {
  if (!EMPLOYER_MOCK_MODE && transport) {
    const response = await fetch(`${getApiBase()}${path}`, {
      headers: { Authorization: `Bearer ${resolveAuthToken()}` },
    });
    if (response.ok) {
      triggerBrowserDownload(await response.blob(), `nurvex-${reportKey}-report.csv`);
      return;
    }
  }
  const preview = resolveMock(
    `/api/v1/employer/reports/${encodeURIComponent(reportKey)}`,
    "GET",
    {},
  ) as ReportPreview;
  triggerBrowserDownload(
    new Blob([previewToCsv(preview)], { type: "text/csv;charset=utf-8;" }),
    `nurvex-${reportKey}-report.csv`,
  );
}

/** Employer-scoped request. Mock-first; pass the page's `useApi()` instance to keep the live path unchanged. */
export async function employerRequest<T>(
  path: string,
  options: RequestInit = {},
  transport?: Pick<Api, "request">,
): Promise<T> {
  if (!EMPLOYER_MOCK_MODE) {
    if (transport) return transport.request<T>(path, options);
    return (await fetchWithAuth(path, options)) as T;
  }
  await delay();
  const method = (options.method ?? "GET").toUpperCase();
  return resolveMock(path, method, options) as T;
}

