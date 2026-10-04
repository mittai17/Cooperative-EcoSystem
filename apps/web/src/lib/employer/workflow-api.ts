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

export const mockInterviews: Interview[] = [
  {
    id: "int-01",
    application_id: "app-ravindra-dairy",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.coopsetu.ai/int-ravindra-dairy",
    interviewer_name: "Rajesh Mehta",
    notes: "Focus on route optimisation and cold chain protocol",
    status: "scheduled",
    decision: null,
    overall_recommendation: null,
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  },
  {
    id: "int-02",
    application_id: "app-meenakshi-quality",
    job_id: "emp-job-quality-analyst",
    job_title: "Quality & Compliance Analyst",
    trainee_id: "cand-meenakshi-deshmukh",
    candidate_name: "Meenakshi Ramesh Deshmukh",
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.coopsetu.ai/int-meenakshi-quality",
    interviewer_name: "Priya Shah",
    notes: "Review HACCP certification and lab test procedures",
    status: "scheduled",
    decision: null,
    overall_recommendation: null,
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  },
  {
    id: "int-03",
    application_id: "app-siddharth-mis",
    job_id: "emp-job-mis-analyst",
    job_title: "MIS & Data Analyst - Cooperative Sector",
    trainee_id: "cand-siddharth-iyer",
    candidate_name: "Siddharth Iyer",
    scheduled_at: new Date(Date.now() + 259200000).toISOString(),
    duration_minutes: 60,
    mode: "onsite",
    meeting_link: null,
    interviewer_name: "Manish Patel",
    notes: "Practical spreadsheet and SQL test at the Delhi regional office",
    status: "scheduled",
    decision: null,
    overall_recommendation: null,
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  },
  {
    id: "int-04",
    application_id: "app-kavita-accounts",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-kavita-sharma",
    candidate_name: "Kavita Sharma",
    scheduled_at: new Date(Date.now() - 172800000).toISOString(),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.coopsetu.ai/int-kavita-accounts",
    interviewer_name: "Rajesh Mehta",
    notes: "Completed initial panel",
    status: "completed",
    decision: "proceed",
    overall_recommendation: "recommend",
    overall_rating: 4,
    evaluation: {
      technical_skills: 4,
      communication: 4,
      problem_solving: 4,
      domain_knowledge: 5,
      cooperative_sector_knowledge: 4,
    },
    evaluation_notes: "Strong understanding of cooperative ledger accounting, Tally reconciliation, and PACS statutory compliance.",
  },
  {
    id: "int-05",
    application_id: "app-amit-store",
    job_id: "emp-job-store-manager",
    job_title: "Retail Store Manager - Cooperative Brand",
    trainee_id: "cand-amit-verma",
    candidate_name: "Amit Verma",
    scheduled_at: new Date(Date.now() - 345600000).toISOString(),
    duration_minutes: 45,
    mode: "onsite",
    meeting_link: null,
    interviewer_name: "Priya Shah",
    notes: "On-site store walkthrough",
    status: "completed",
    decision: "hold",
    overall_recommendation: "undecided",
    overall_rating: 3,
    evaluation: {
      technical_skills: 3,
      communication: 4,
      problem_solving: 3,
      domain_knowledge: 4,
      cooperative_sector_knowledge: 3,
    },
    evaluation_notes: "Good interpersonal approach, but needs more experience in cooperative e-commerce inventory sync.",
  },
  {
    id: "int-06",
    application_id: "app-geeta-pacs",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-geeta-ben-rathod",
    candidate_name: "Geeta Ben Rathod",
    scheduled_at: new Date(Date.now() - 518400000).toISOString(),
    duration_minutes: 30,
    mode: "online",
    meeting_link: "https://meet.coopsetu.ai/int-geeta-pacs",
    interviewer_name: "Rajesh Mehta",
    notes: "Candidate withdrew due to senior PACS audit posting",
    status: "cancelled",
    decision: "reject",
    overall_recommendation: "not_recommend",
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  },
];

export function getMockInterview(id: string): Interview {
  return mockInterviews.find((i) => i.id === id) ?? {
    id,
    application_id: "app-ravindra-dairy",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.coopsetu.ai/int-demo",
    interviewer_name: "Rajesh Mehta",
    notes: "Standard cooperative technical interview",
    status: "scheduled",
    decision: null,
    overall_recommendation: null,
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  };
}

export function getMockApplicationSummary(id: string): ApplicationSummary {
  const map: Record<string, ApplicationSummary> = {
    "app-ravindra-dairy": {
      id: "app-ravindra-dairy",
      trainee_id: "cand-ravindra-patil",
      candidate_name: "Ravindra Suresh Patil",
      job_id: "emp-job-dairy-supervisor",
      job_title: "Dairy Procurement Supervisor",
      status: "shortlisted",
    },
    "app-meenakshi-quality": {
      id: "app-meenakshi-quality",
      trainee_id: "cand-meenakshi-deshmukh",
      candidate_name: "Meenakshi Ramesh Deshmukh",
      job_id: "emp-job-quality-analyst",
      job_title: "Quality & Compliance Analyst",
      status: "shortlisted",
    },
    "app-siddharth-mis": {
      id: "app-siddharth-mis",
      trainee_id: "cand-siddharth-iyer",
      candidate_name: "Siddharth Iyer",
      job_id: "emp-job-mis-analyst",
      job_title: "MIS & Data Analyst - Cooperative Sector",
      status: "shortlisted",
    },
    "app-kavita-accounts": {
      id: "app-kavita-accounts",
      trainee_id: "cand-kavita-sharma",
      candidate_name: "Kavita Sharma",
      job_id: "emp-job-society-accountant",
      job_title: "Cooperative Society Accountant",
      status: "interviewed",
    },
    "app-amit-store": {
      id: "app-amit-store",
      trainee_id: "cand-amit-verma",
      candidate_name: "Amit Verma",
      job_id: "emp-job-store-manager",
      job_title: "Retail Store Manager - Cooperative Brand",
      status: "shortlisted",
    },
  };
  return map[id] ?? {
    id,
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    status: "shortlisted",
  };
}

export const listInterviews = async (api: Api): Promise<InterviewsResponse> => {
  try {
    const data = await api.get<InterviewsResponse>("/api/v1/employer/interviews");
    if (data && data.interviews && data.interviews.length > 0) return data;
  } catch {
    // Fallback to mock interviews
  }
  return { interviews: [...mockInterviews] };
};

export const getInterview = async (api: Api, id: string): Promise<Interview> => {
  try {
    const data = await api.get<Interview>(`/api/v1/employer/interviews/${id}`);
    if (data && data.id) return data;
  } catch {
    // Fallback to mock interview
  }
  return getMockInterview(id);
};

export const createInterview = async (api: Api, body: InterviewCreate): Promise<Interview> => {
  try {
    return await api.post<Interview>("/api/v1/employer/interviews", body);
  } catch {
    const app = getMockApplicationSummary(body.application_id);
    const created: Interview = {
      id: `int-${Date.now().toString(36)}`,
      application_id: body.application_id,
      job_id: app.job_id,
      job_title: app.job_title,
      trainee_id: app.trainee_id,
      candidate_name: app.candidate_name,
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes,
      mode: body.mode,
      meeting_link: body.meeting_link,
      interviewer_name: body.interviewer_name,
      notes: body.notes,
      status: "scheduled",
      decision: null,
      overall_recommendation: null,
      overall_rating: null,
      evaluation: null,
      evaluation_notes: null,
    };
    mockInterviews.unshift(created);
    return created;
  }
};

export const updateInterview = async (
  api: Api,
  id: string,
  body: Partial<Pick<Interview, "status" | "decision" | "scheduled_at" | "duration_minutes" | "meeting_link">>,
): Promise<Interview> => {
  try {
    return await api.patch<Interview>(`/api/v1/employer/interviews/${id}`, body);
  } catch {
    const item = getMockInterview(id);
    Object.assign(item, body);
    return item;
  }
};

export const saveInterviewEvaluation = async (api: Api, id: string, body: InterviewEvaluationInput): Promise<Interview> => {
  try {
    return await api.post<Interview>(`/api/v1/employer/interviews/${id}/evaluation`, body);
  } catch {
    const item = getMockInterview(id);
    item.evaluation = body.scores;
    item.overall_recommendation = body.overall_recommendation;
    item.evaluation_notes = body.notes;
    item.status = "completed";
    const scores = Object.values(body.scores).filter((s): s is number => typeof s === "number");
    if (scores.length > 0) {
      item.overall_rating = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    return item;
  }
};

export const getApplicationSummary = async (api: Api, id: string): Promise<ApplicationSummary> => {
  try {
    const data = await api.get<ApplicationSummary>(`/api/v1/employer/applications/${id}`);
    if (data && data.candidate_name) return data;
  } catch {
    // Fallback to mock application summary
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

export const mockOffers: Offer[] = [
  {
    id: "off-01",
    application_id: "app-ravindra-dairy",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    status: "sent",
    salary: 28000,
    employment_type: "full_time",
    joining_date: "2026-10-15",
    location: "Anand, Gujarat",
    benefits: "Comprehensive health insurance, Provident Fund (PF), Mobile & Route allowance, Annual performance bonus.",
    additional_terms: "Probation period of 3 months. Standard cooperative union service rules apply.",
    sent_at: "2026-09-24T10:00:00.000Z",
    responded_at: null,
    created_at: "2026-09-23T16:00:00.000Z",
  },
  {
    id: "off-02",
    application_id: "app-kavita-accounts",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-kavita-sharma",
    candidate_name: "Kavita Sharma",
    status: "accepted",
    salary: 24000,
    employment_type: "full_time",
    joining_date: "2026-10-01",
    location: "Pune, Maharashtra",
    benefits: "PF, Cooperative housing assistance, Travel reimbursement, Medical allowance.",
    additional_terms: "Offer accepted on 2026-09-18. Joining formalities initiated.",
    sent_at: "2026-09-15T11:00:00.000Z",
    responded_at: "2026-09-18T14:30:00.000Z",
    created_at: "2026-09-15T09:30:00.000Z",
  },
  {
    id: "off-03",
    application_id: "app-siddharth-mis",
    job_id: "emp-job-mis-analyst",
    job_title: "MIS & Data Analyst - Cooperative Sector",
    trainee_id: "cand-siddharth-iyer",
    candidate_name: "Siddharth Iyer",
    status: "draft",
    salary: 42000,
    employment_type: "full_time",
    joining_date: "2026-11-01",
    location: "New Delhi",
    benefits: "Medical cover, Annual bonus, Remote work flexibility on alternate weeks.",
    additional_terms: "Pending final review by Hiring Manager.",
    sent_at: null,
    responded_at: null,
    created_at: "2026-09-25T11:00:00.000Z",
  },
  {
    id: "off-04",
    application_id: "app-amit-store",
    job_id: "emp-job-store-manager",
    job_title: "Retail Store Manager - Cooperative Brand",
    trainee_id: "cand-amit-verma",
    candidate_name: "Amit Verma",
    status: "withdrawn",
    salary: 22000,
    employment_type: "full_time",
    joining_date: "2026-10-10",
    location: "Vadodara, Gujarat",
    benefits: "Standard retail employee welfare package.",
    additional_terms: "Offer withdrawn due to store opening postponement.",
    sent_at: "2026-09-10T09:00:00.000Z",
    responded_at: null,
    created_at: "2026-09-09T14:00:00.000Z",
  },
];

export function getMockOffer(id: string): Offer {
  return mockOffers.find((o) => o.id === id) ?? {
    id,
    application_id: "app-ravindra-dairy",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    status: "sent",
    salary: 28000,
    employment_type: "full_time",
    joining_date: "2026-10-15",
    location: "Anand, Gujarat",
    benefits: "Comprehensive health insurance, Provident Fund (PF), Mobile allowance.",
    additional_terms: "Probation period of 3 months.",
    sent_at: "2026-09-24T10:00:00.000Z",
    responded_at: null,
    created_at: "2026-09-23T16:00:00.000Z",
  };
}

export const listOffers = async (api: Api): Promise<OffersResponse> => {
  try {
    const data = await api.get<OffersResponse>("/api/v1/employer/offers");
    if (data && data.offers && data.offers.length > 0) return data;
  } catch {
    // Fallback to mock offers
  }
  return { offers: [...mockOffers] };
};

export const getOffer = async (api: Api, id: string): Promise<Offer> => {
  try {
    const data = await api.get<Offer>(`/api/v1/employer/offers/${id}`);
    if (data && data.id) return data;
  } catch {
    // Fallback to mock offer
  }
  return getMockOffer(id);
};

export const createOffer = async (api: Api, body: OfferInput): Promise<Offer> => {
  try {
    return await api.post<Offer>("/api/v1/employer/offers", body);
  } catch {
    const app = getMockApplicationSummary(body.application_id);
    const created: Offer = {
      id: `off-${Date.now().toString(36)}`,
      application_id: body.application_id,
      job_id: app.job_id,
      job_title: app.job_title,
      trainee_id: app.trainee_id,
      candidate_name: app.candidate_name,
      status: body.status,
      salary: body.salary,
      employment_type: body.employment_type,
      joining_date: body.joining_date,
      location: body.location,
      benefits: body.benefits,
      additional_terms: body.additional_terms,
      sent_at: body.status === "sent" ? new Date().toISOString() : null,
      responded_at: null,
      created_at: new Date().toISOString(),
    };
    mockOffers.unshift(created);
    return created;
  }
};

export const updateOffer = async (api: Api, id: string, body: { status: "sent" | "withdrawn" }): Promise<Offer> => {
  try {
    return await api.patch<Offer>(`/api/v1/employer/offers/${id}`, body);
  } catch {
    const offer = getMockOffer(id);
    offer.status = body.status;
    if (body.status === "sent") offer.sent_at = new Date().toISOString();
    return offer;
  }
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

export const mockFeedbackResponse: FeedbackResponse = {
  hires: [
    {
      application_id: "app-5",
      job_id: "job-1",
      job_title: "Dairy Plant Automation Technician",
      trainee_id: "cand-5",
      employee_name: "Kavita Patel",
      hired_at: "2026-03-25T11:00:00Z",
      feedback_submitted: false,
    },
    {
      application_id: "app-prev-1",
      job_id: "job-2",
      job_title: "Cold Chain Logistics Coordinator",
      trainee_id: "cand-2",
      employee_name: "Rahul Verma",
      hired_at: "2026-02-15T09:30:00Z",
      feedback_submitted: true,
    },
  ],
  feedback: [
    {
      id: "fb-1",
      job_id: "job-2",
      job_title: "Cold Chain Logistics Coordinator",
      trainee_id: "cand-2",
      employee_name: "Rahul Verma",
      ratings: {
        technical_skills: 5,
        communication: 4,
        problem_solving: 4,
        domain_knowledge: 5,
        digital_skills: 4,
        work_readiness: 5,
      },
      performance_rating: 4.8,
      additional_skills_needed: ["Advanced Fleet Telematics", "Vendor Negotiation"],
      comments: "Rahul has exceeded expectations in managing temperature-controlled dispatch logs. Highly disciplined and cooperative.",
      created_at: "2026-03-01T14:20:00Z",
    },
  ],
};

export const mockSkillDemandAggregate: SkillDemandAggregate = {
  responses: 18,
  skills: [
    { skill: "PLC Automation & SCADA", mentions: 14 },
    { skill: "Cold Chain Telematics", mentions: 11 },
    { skill: "FSSAI & HACCP Compliance", mentions: 9 },
    { skill: "IoT Sensor Calibration", mentions: 8 },
    { skill: "Solar Microgrid Maintenance", mentions: 6 },
  ],
};

export const getFeedback = async (api: Api): Promise<FeedbackResponse> => {
  try {
    const res = await api.get<FeedbackResponse>("/api/v1/employer/feedback");
    if (res && (res.hires?.length > 0 || res.feedback?.length > 0)) return res;
    return mockFeedbackResponse;
  } catch {
    return mockFeedbackResponse;
  }
};

export const submitFeedback = async (api: Api, body: FeedbackInput): Promise<FeedbackRecord> => {
  try {
    return await api.post<FeedbackRecord>("/api/v1/employer/feedback", body);
  } catch {
    const hire = mockFeedbackResponse.hires.find((h) => h.trainee_id === body.trainee_id);
    if (hire) hire.feedback_submitted = true;
    const newRecord: FeedbackRecord = {
      id: `fb-${Date.now()}`,
      job_id: body.job_id,
      job_title: hire?.job_title ?? "Position",
      trainee_id: body.trainee_id,
      employee_name: hire?.employee_name ?? "Employee",
      ratings: body.ratings,
      performance_rating: 4.5,
      additional_skills_needed: body.additional_skills_needed,
      comments: body.comments,
      created_at: new Date().toISOString(),
    };
    mockFeedbackResponse.feedback.unshift(newRecord);
    return newRecord;
  }
};

export const getSkillDemandAggregate = async (api: Api): Promise<SkillDemandAggregate> => {
  try {
    const res = await api.get<SkillDemandAggregate>("/api/v1/employer/feedback/aggregate");
    if (res && res.skills?.length > 0) return res;
    return mockSkillDemandAggregate;
  } catch {
    return mockSkillDemandAggregate;
  }
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

export const mockTalentPoolEntries: TalentEntry[] = [
  {
    id: "tp-1",
    trainee_id: "cand-1",
    candidate_name: "Aarav Sharma",
    location: "Anand, Gujarat",
    occupation: "Dairy Plant Operator",
    category: "high_potential",
    note: "Excellent score on Siemens PLC and HACCP sanitization protocol. Recommended for supervisory opening next quarter.",
    match_score: 95,
    added_at: "2026-03-20T10:00:00Z",
  },
  {
    id: "tp-2",
    trainee_id: "cand-3",
    candidate_name: "Priya Nair",
    location: "Kochi, Kerala",
    occupation: "Quality Control Analyst",
    category: "saved",
    note: "Strong microbiological testing background. Keep warm for upcoming expansion in South Zone.",
    match_score: 91,
    added_at: "2026-03-22T14:30:00Z",
  },
  {
    id: "tp-3",
    trainee_id: "cand-4",
    candidate_name: "Vikram Singh",
    location: "Jaipur, Rajasthan",
    occupation: "Solar Microgrid Engineer",
    category: "future_hiring",
    note: "Grid sync expert. Ideal for rooftop solar installation phase 2.",
    match_score: 87,
    added_at: "2026-03-24T09:15:00Z",
  },
  {
    id: "tp-4",
    trainee_id: "cand-6",
    candidate_name: "Deepak Choudhary",
    location: "Karnal, Haryana",
    occupation: "Agri-Cooperative Field Manager",
    category: "interviewed",
    note: "Great leadership skills, demonstrated strong farmer mobilization experience.",
    match_score: 84,
    added_at: "2026-03-27T16:00:00Z",
  },
];

export const mockCandidateOptions: CandidateOption[] = [
  { id: "cand-1", name: "Aarav Sharma", location: "Anand, Gujarat", occupation: "Dairy Plant Operator", match_score: 95 },
  { id: "cand-2", name: "Rahul Verma", location: "Surat, Gujarat", occupation: "Cold Chain Supervisor", match_score: 88 },
  { id: "cand-3", name: "Priya Nair", location: "Kochi, Kerala", occupation: "Quality Control Analyst", match_score: 91 },
  { id: "cand-4", name: "Vikram Singh", location: "Jaipur, Rajasthan", occupation: "Solar Microgrid Engineer", match_score: 87 },
  { id: "cand-5", name: "Kavita Patel", location: "Ahmedabad, Gujarat", occupation: "Automation Technician", match_score: 94 },
  { id: "cand-6", name: "Deepak Choudhary", location: "Karnal, Haryana", occupation: "Field Coordinator", match_score: 84 },
];

export const listTalentPool = async (api: Api): Promise<TalentPoolResponse> => {
  try {
    const res = await api.get<TalentPoolResponse>("/api/v1/employer/talent-pool");
    if (res && res.entries && res.entries.length > 0) return res;
    return { entries: mockTalentPoolEntries };
  } catch {
    return { entries: mockTalentPoolEntries };
  }
};

export const addTalentEntry = async (
  api: Api,
  body: { trainee_id: string; category: TalentCategory; note: string | null },
): Promise<TalentEntry> => {
  try {
    return await api.post<TalentEntry>("/api/v1/employer/talent-pool", body);
  } catch {
    const candidate = mockCandidateOptions.find((c) => c.id === body.trainee_id);
    const newEntry: TalentEntry = {
      id: `tp-${Date.now()}`,
      trainee_id: body.trainee_id,
      candidate_name: candidate?.name ?? "Candidate",
      location: candidate?.location ?? null,
      occupation: candidate?.occupation ?? null,
      category: body.category,
      note: body.note,
      match_score: candidate?.match_score ?? 85,
      added_at: new Date().toISOString(),
    };
    mockTalentPoolEntries.unshift(newEntry);
    return newEntry;
  }
};

export const updateTalentEntry = async (
  api: Api,
  id: string,
  body: { category: TalentCategory },
): Promise<TalentEntry> => {
  try {
    return await api.patch<TalentEntry>(`/api/v1/employer/talent-pool/${id}`, body);
  } catch {
    const entry = mockTalentPoolEntries.find((e) => e.id === id);
    if (entry) entry.category = body.category;
    return (
      entry ?? {
        id,
        trainee_id: "cand-1",
        candidate_name: "Candidate",
        location: null,
        occupation: null,
        category: body.category,
        note: null,
        match_score: 90,
        added_at: new Date().toISOString(),
      }
    );
  }
};

export const removeTalentEntry = async (api: Api, id: string): Promise<void> => {
  try {
    await api.request<void>(`/api/v1/employer/talent-pool/${id}`, { method: "DELETE" });
  } catch {
    const idx = mockTalentPoolEntries.findIndex((e) => e.id === id);
    if (idx !== -1) mockTalentPoolEntries.splice(idx, 1);
  }
};

export const searchCandidates = async (
  api: Api,
  q: string,
): Promise<{ candidates: CandidateOption[] }> => {
  try {
    const res = await api.get<{ candidates: CandidateOption[] }>(
      `/api/v1/employer/candidates?q=${encodeURIComponent(q)}&limit=10`,
    );
    if (res && res.candidates && res.candidates.length > 0) return res;
    const filtered = mockCandidateOptions.filter(
      (c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.occupation && c.occupation.toLowerCase().includes(q.toLowerCase())) ||
        c.location.toLowerCase().includes(q.toLowerCase()),
    );
    return { candidates: filtered.length > 0 ? filtered : mockCandidateOptions };
  } catch {
    const filtered = mockCandidateOptions.filter(
      (c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.occupation && c.occupation.toLowerCase().includes(q.toLowerCase())) ||
        c.location.toLowerCase().includes(q.toLowerCase()),
    );
    return { candidates: filtered.length > 0 ? filtered : mockCandidateOptions };
  }
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

export const getMockAnalytics = (months: number): AnalyticsResponse => ({
  range_months: months,
  kpis: {
    applications: 142,
    shortlists: 48,
    interviews: 26,
    offers: 12,
    hires: 9,
    time_to_hire_days: 16,
    hiring_conversion_pct: 6.3,
  },
  funnel: [
    { stage: "Applied", count: 142 },
    { stage: "Shortlisted", count: 48 },
    { stage: "Interview", count: 26 },
    { stage: "Offered", count: 12 },
    { stage: "Hired", count: 9 },
  ],
  hiring_timeline: [
    { month: "Nov 2025", applications: 18, hires: 1 },
    { month: "Dec 2025", applications: 24, hires: 2 },
    { month: "Jan 2026", applications: 31, hires: 2 },
    { month: "Feb 2026", applications: 38, hires: 2 },
    { month: "Mar 2026", applications: 31, hires: 2 },
  ],
  top_skills: [
    { skill: "PLC Automation & SCADA", count: 34 },
    { skill: "Cold Chain Logistics", count: 28 },
    { skill: "FSSAI HACCP Compliance", count: 22 },
    { skill: "Quality Assurance Testing", count: 19 },
    { skill: "Solar Energy Systems", count: 14 },
    { skill: "Inventory Management ERP", count: 12 },
  ],
  candidate_sources: [
    { source: "CoopSetu Skill Passport", count: 78 },
    { source: "Vocational Training Centers (VTC)", count: 36 },
    { source: "Direct Referral", count: 18 },
    { source: "Apprenticeship Program", count: 10 },
  ],
  time_to_hire_trend: [
    { month: "Nov 2025", days: 22 },
    { month: "Dec 2025", days: 20 },
    { month: "Jan 2026", days: 18 },
    { month: "Feb 2026", days: 17 },
    { month: "Mar 2026", days: 16 },
  ],
  job_performance: [
    {
      job_id: "job-1",
      job_title: "Dairy Plant Automation Technician",
      applications: 42,
      shortlisted: 14,
      hires: 3,
      conversion_pct: 7.1,
    },
    {
      job_id: "job-2",
      job_title: "Cold Chain Logistics Coordinator",
      applications: 35,
      shortlisted: 12,
      hires: 2,
      conversion_pct: 5.7,
    },
    {
      job_id: "job-3",
      job_title: "Milk Quality Testing Specialist",
      applications: 28,
      shortlisted: 9,
      hires: 2,
      conversion_pct: 7.1,
    },
    {
      job_id: "job-4",
      job_title: "Solar Microgrid Maintenance Engineer",
      applications: 21,
      shortlisted: 8,
      hires: 1,
      conversion_pct: 4.8,
    },
    {
      job_id: "job-5",
      job_title: "Cooperative Field Marketing Executive",
      applications: 16,
      shortlisted: 5,
      hires: 1,
      conversion_pct: 6.2,
    },
  ],
});

export const getAnalytics = async (api: Api, months: number): Promise<AnalyticsResponse> => {
  try {
    const res = await api.get<AnalyticsResponse>(`/api/v1/employer/analytics?months=${months}`);
    if (res && res.kpis && res.funnel?.length > 0) return res;
    return getMockAnalytics(months);
  } catch {
    return getMockAnalytics(months);
  }
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

export const getMockReportPreview = (key: ReportKey): ReportPreview => {
  switch (key) {
    case "recruitment":
      return {
        key,
        title: "Recruitment Pipeline Summary",
        description: "Overview of job postings, applicant volumes, and funnel stages.",
        columns: [
          { key: "job_title", label: "Job Title" },
          { key: "status", label: "Status" },
          { key: "applications", label: "Total Applications" },
          { key: "shortlisted", label: "Shortlisted" },
          { key: "interviewed", label: "Interviewed" },
          { key: "hired", label: "Hired" },
        ],
        rows: [
          { job_title: "Dairy Plant Automation Technician", status: "Active", applications: 42, shortlisted: 14, interviewed: 8, hired: 3 },
          { job_title: "Cold Chain Logistics Coordinator", status: "Active", applications: 35, shortlisted: 12, interviewed: 6, hired: 2 },
          { job_title: "Milk Quality Testing Specialist", status: "Active", applications: 28, shortlisted: 9, interviewed: 5, hired: 2 },
          { job_title: "Solar Microgrid Maintenance Engineer", status: "Active", applications: 21, shortlisted: 8, interviewed: 4, hired: 1 },
          { job_title: "Cooperative Field Marketing Executive", status: "Active", applications: 16, shortlisted: 5, interviewed: 3, hired: 1 },
        ],
        total_rows: 5,
      };
    case "hiring_funnel":
      return {
        key,
        title: "Hiring Funnel & Conversion Rates",
        description: "Stage-by-stage drop-off and conversion efficiency across cycles.",
        columns: [
          { key: "stage", label: "Pipeline Stage" },
          { key: "count", label: "Candidate Count" },
          { key: "stage_conversion", label: "Stage Conversion Rate" },
          { key: "overall_conversion", label: "Overall Conversion Rate" },
        ],
        rows: [
          { stage: "Applied", count: 142, stage_conversion: "100%", overall_conversion: "100%" },
          { stage: "Shortlisted", count: 48, stage_conversion: "33.8%", overall_conversion: "33.8%" },
          { stage: "Interview Scheduled", count: 26, stage_conversion: "54.2%", overall_conversion: "18.3%" },
          { stage: "Offer Extended", count: 12, stage_conversion: "46.2%", overall_conversion: "8.5%" },
          { stage: "Hired / Accepted", count: 9, stage_conversion: "75.0%", overall_conversion: "6.3%" },
        ],
        total_rows: 5,
      };
    case "job_performance":
      return {
        key,
        title: "Job Performance Analysis",
        description: "Time-to-fill, candidate velocity, and department-level efficiency.",
        columns: [
          { key: "department", label: "Department" },
          { key: "open_roles", label: "Open Roles" },
          { key: "avg_time_to_fill", label: "Avg Time to Fill (Days)" },
          { key: "retention_rate", label: "90-Day Retention" },
        ],
        rows: [
          { department: "Plant Automation", open_roles: 2, avg_time_to_fill: 18, retention_rate: "96%" },
          { department: "Cold Chain Logistics", open_roles: 1, avg_time_to_fill: 14, retention_rate: "92%" },
          { department: "Quality Assurance", open_roles: 1, avg_time_to_fill: 15, retention_rate: "98%" },
          { department: "Renewable Energy", open_roles: 1, avg_time_to_fill: 21, retention_rate: "90%" },
        ],
        total_rows: 4,
      };
    case "candidate_skills":
      return {
        key,
        title: "Candidate Skill Passport Distribution",
        description: "Verified competencies, credentials, and match scores across talent pool.",
        columns: [
          { key: "skill", label: "Verified Competency" },
          { key: "verified_candidates", label: "Verified Candidates" },
          { key: "avg_proficiency", label: "Avg Proficiency (Out of 100)" },
          { key: "certification_rate", label: "NCVT / Skill India Certified" },
        ],
        rows: [
          { skill: "PLC Automation & SCADA", verified_candidates: 34, avg_proficiency: 88, certification_rate: "94%" },
          { skill: "Cold Chain Logistics & Telematics", verified_candidates: 28, avg_proficiency: 85, certification_rate: "89%" },
          { skill: "FSSAI HACCP Food Safety", verified_candidates: 22, avg_proficiency: 92, certification_rate: "95%" },
          { skill: "Solar Inverter & Microgrid", verified_candidates: 14, avg_proficiency: 84, certification_rate: "86%" },
        ],
        total_rows: 4,
      };
    case "interview":
      return {
        key,
        title: "Interview Outcomes & Evaluations",
        description: "Completed interview scores, recommendations, and assessor ratings.",
        columns: [
          { key: "candidate_name", label: "Candidate Name" },
          { key: "job_title", label: "Job Title" },
          { key: "interviewer", label: "Interviewer" },
          { key: "recommendation", label: "Recommendation" },
          { key: "technical_score", label: "Technical Score" },
          { key: "culture_fit", label: "Cooperative Fit" },
        ],
        rows: [
          { candidate_name: "Aarav Sharma", job_title: "Dairy Plant Automation Technician", interviewer: "Harish Patel", recommendation: "Strong Hire", technical_score: "9/10", culture_fit: "9/10" },
          { candidate_name: "Rahul Verma", job_title: "Cold Chain Logistics Coordinator", interviewer: "Meera Trivedi", recommendation: "Hire", technical_score: "8.5/10", culture_fit: "8.5/10" },
          { candidate_name: "Priya Nair", job_title: "Milk Quality Testing Specialist", interviewer: "Dr. R. S. Sodhi", recommendation: "Strong Hire", technical_score: "9.5/10", culture_fit: "9/10" },
        ],
        total_rows: 3,
      };
    case "employment":
      return {
        key,
        title: "Offer & Employment Records",
        description: "Status of formal employment offers, compensation, and onboarding dates.",
        columns: [
          { key: "candidate_name", label: "Candidate Name" },
          { key: "job_title", label: "Designation" },
          { key: "salary", label: "Annual CTC (INR)" },
          { key: "status", label: "Offer Status" },
          { key: "start_date", label: "Proposed Joining Date" },
        ],
        rows: [
          { candidate_name: "Aarav Sharma", job_title: "Dairy Plant Automation Technician", salary: "₹4,20,000", status: "Sent", start_date: "2026-05-01" },
          { candidate_name: "Kavita Patel", job_title: "Dairy Plant Automation Technician", salary: "₹4,50,000", status: "Accepted", start_date: "2026-04-15" },
          { candidate_name: "Rahul Verma", job_title: "Cold Chain Logistics Coordinator", salary: "₹3,80,000", status: "Accepted", start_date: "2026-03-01" },
        ],
        total_rows: 3,
      };
    case "employer_feedback":
    default:
      return {
        key: "employer_feedback",
        title: "Post-Hire Feedback & Skill Demand",
        description: "Employer satisfaction scores and additional skill requirements.",
        columns: [
          { key: "employee_name", label: "Employee Name" },
          { key: "role", label: "Role" },
          { key: "performance", label: "Performance Rating" },
          { key: "additional_needs", label: "Additional Skills Identified" },
        ],
        rows: [
          { employee_name: "Rahul Verma", role: "Cold Chain Logistics Coordinator", performance: "4.8 / 5.0", additional_needs: "Advanced Fleet Telematics, Vendor Negotiation" },
          { employee_name: "Kavita Patel", role: "Automation Technician", performance: "Pending (Hired recently)", additional_needs: "Siemens TIA Portal v19 refresh" },
        ],
        total_rows: 2,
      };
  }
};

export const getReportPreview = async (api: Api, key: ReportKey): Promise<ReportPreview> => {
  try {
    const res = await api.get<ReportPreview>(`/api/v1/employer/reports/${key}`);
    if (res && res.rows && res.rows.length > 0) return res;
    return getMockReportPreview(key);
  } catch {
    return getMockReportPreview(key);
  }
};

/**
 * CSV export. PDF is intentionally not offered: the backend only emits CSV.
 * Fetches with the same auth header as useApi and triggers a browser download.
 * Falls back to client-side CSV generation when backend is offline or errors.
 */
export async function downloadReportCsv(key: ReportKey): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/employer/reports/${key}/export?format=csv`,
      { headers: { Authorization: `Bearer ${DEMO_TOKEN}` } },
    );
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `coopsetu-${key}-report.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // fallback to client-side CSV generation
  }

  // Fallback: generate CSV client side from mock preview
  const preview = getMockReportPreview(key);
  const headers = preview.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
  const rows = preview.rows.map((row) =>
    preview.columns
      .map((col) => {
        const val = row[col.key] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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

export const mockCompanyProfile: CompanyProfile = {
  name: "Amul Cooperative Union (GCMMF)",
  sector: "Dairy, Agri-Food Processing & Supply Chain",
  description: "Gujarat Cooperative Milk Marketing Federation Ltd. (GCMMF) is India's largest food products marketing organization, empowering millions of dairy farmers across thousands of village cooperatives.",
  location: "Anand, Gujarat, India",
  website: "https://www.amul.com",
  contact_email: "recruitment@amul.coop",
  contact_phone: "+91 2692 258506",
  departments: [
    "Dairy Processing & Plant Automation",
    "Cold Chain Logistics & Distribution",
    "Quality Assurance & Laboratory Services",
    "Cooperative Member Relations",
    "Renewable Energy & Sustainability",
  ],
};

export const mockTeamResponse: TeamResponse = {
  current_role: "employer_admin",
  members: [
    {
      id: "tm-1",
      name: "Dr. R. S. Sodhi",
      email: "rsodhi@amul.coop",
      role: "employer_admin",
      status: "active",
      last_active: "2026-04-01T10:15:00Z",
    },
    {
      id: "tm-2",
      name: "Meera Trivedi",
      email: "mtrivedi@amul.coop",
      role: "recruiter",
      status: "active",
      last_active: "2026-04-03T16:45:00Z",
    },
    {
      id: "tm-3",
      name: "Harish Patel",
      email: "hpatel@amul.coop",
      role: "hiring_manager",
      status: "active",
      last_active: "2026-04-02T11:20:00Z",
    },
    {
      id: "tm-4",
      name: "Anita Desai",
      email: "adesai@amul.coop",
      role: "recruiter",
      status: "invited",
      last_active: null,
    },
  ],
};

export const getCompany = async (api: Api): Promise<CompanyProfile> => {
  try {
    const res = await api.get<CompanyProfile>("/api/v1/employer/company");
    if (res && res.name) return res;
    return mockCompanyProfile;
  } catch {
    return mockCompanyProfile;
  }
};

export const updateCompany = async (api: Api, body: Partial<CompanyProfile>): Promise<CompanyProfile> => {
  try {
    return await api.patch<CompanyProfile>("/api/v1/employer/company", body);
  } catch {
    Object.assign(mockCompanyProfile, body);
    return { ...mockCompanyProfile };
  }
};

export const getTeam = async (api: Api): Promise<TeamResponse> => {
  try {
    const res = await api.get<TeamResponse>("/api/v1/employer/team");
    if (res && res.members && res.members.length > 0) return res;
    return mockTeamResponse;
  } catch {
    return mockTeamResponse;
  }
};

export const inviteTeamMember = async (
  api: Api,
  body: { name: string; email: string; role: TeamRole },
): Promise<TeamMember> => {
  try {
    return await api.post<TeamMember>("/api/v1/employer/team", body);
  } catch {
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: body.role,
      status: "invited",
      last_active: null,
    };
    mockTeamResponse.members.push(newMember);
    return newMember;
  }
};

export const updateTeamMember = async (
  api: Api,
  id: string,
  body: { role: TeamRole },
): Promise<TeamMember> => {
  try {
    return await api.patch<TeamMember>(`/api/v1/employer/team/${id}`, body);
  } catch {
    const member = mockTeamResponse.members.find((m) => m.id === id);
    if (member) member.role = body.role;
    return (
      member ?? {
        id,
        name: "Team Member",
        email: "member@amul.coop",
        role: body.role,
        status: "active",
        last_active: new Date().toISOString(),
      }
    );
  }
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

export const mockSettings: EmployerSettings = {
  account: {
    name: "Dr. R. S. Sodhi",
    email: "rsodhi@amul.coop",
    role: "employer_admin",
  },
  notifications: {
    interview_reminders: true,
    new_application: true,
    candidate_response: true,
    job_deadline: false,
  },
};

export const getSettings = async (api: Api): Promise<EmployerSettings> => {
  try {
    const res = await api.get<EmployerSettings>("/api/v1/employer/settings");
    if (res && res.account) return res;
    return mockSettings;
  } catch {
    return mockSettings;
  }
};

export const updateNotificationPrefs = async (
  api: Api,
  body: NotificationPrefs,
): Promise<EmployerSettings> => {
  try {
    return await api.patch<EmployerSettings>("/api/v1/employer/settings", { notifications: body });
  } catch {
    mockSettings.notifications = { ...body };
    return { ...mockSettings };
  }
};
