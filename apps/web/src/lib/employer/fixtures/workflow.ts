import type {
  AnalyticsResponse,
  ApplicationSummary,
  CandidateOption,
  FeedbackResponse,
  HireRecord,
  Interview,
  Offer,
  OfferStatus,
  ReportKey,
  ReportPreview,
  SkillDemandAggregate,
  TalentCategory,
  TalentEntry,
  TeamMember,
  TeamRole,
} from "@/lib/employer/workflow-api";
import { mockEmployerApplications } from "@/lib/employer/fixtures/people";
import { mockCandidateSummaries } from "@/lib/employer/fixtures/people";
import { mockEmployerJobs } from "@/lib/employer/fixtures/catalog";

const minutesFromNow = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString();

function localTimeLaterToday(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const mockInterviews: Interview[] = [
  {
    id: "int-01",
    application_id: "app-ravindra-dairy",
    job_id: "emp-job-dairy-supervisor",
    job_title: "Dairy Procurement Supervisor",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    scheduled_at: minutesFromNow(90),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.nurvex.ai/int-ravindra-dairy",
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
    scheduled_at: minutesFromNow(60 * 30),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.nurvex.ai/int-meenakshi-quality",
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
    scheduled_at: minutesFromNow(60 * 54),
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
    id: "int-08",
    application_id: "app-sunita-accountant",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-sunita-yadav",
    candidate_name: "Sunita Devi Yadav",
    scheduled_at: localTimeLaterToday(16, 30),
    duration_minutes: 30,
    mode: "onsite",
    meeting_link: null,
    interviewer_name: "Manish Patel",
    notes: "Final round at the Pune district union office",
    status: "scheduled",
    decision: null,
    overall_recommendation: null,
    overall_rating: null,
    evaluation: null,
    evaluation_notes: null,
  },
  {
    id: "int-04",
    application_id: "app-sunita-accountant",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-sunita-yadav",
    candidate_name: "Sunita Devi Yadav",
    scheduled_at: minutesFromNow(-60 * 26),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.nurvex.ai/int-sunita-accounts",
    interviewer_name: "Rajesh Mehta",
    notes: "Assess cooperative accounting and AGM financial statements",
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
    evaluation_notes: "Strong grasp of cooperative ledger accounting, Tally reconciliation and statutory registers. Would benefit from deeper cooperative audit exposure.",
  },
  {
    id: "int-05",
    application_id: "app-kavita-accounts",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-kavita-sharma",
    candidate_name: "Kavita Sharma",
    scheduled_at: minutesFromNow(-60 * 48),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.nurvex.ai/int-kavita-accounts",
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
    id: "int-06",
    application_id: "app-amit-store",
    job_id: "emp-job-store-manager",
    job_title: "Retail Store Manager - Cooperative Brand",
    trainee_id: "cand-amit-verma",
    candidate_name: "Amit Verma",
    scheduled_at: minutesFromNow(-60 * 72),
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
    id: "int-07",
    application_id: "app-geeta-pacs",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-geeta-ben-rathod",
    candidate_name: "Geeta Ben Rathod",
    scheduled_at: minutesFromNow(-60 * 96),
    duration_minutes: 30,
    mode: "online",
    meeting_link: "https://meet.nurvex.ai/int-geeta-pacs",
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

export function findMockInterview(id: string): Interview | undefined {
  return mockInterviews.find((interview) => interview.id === id);
}

export function getMockInterview(id: string): Interview {
  const known = findMockInterview(id);
  if (known) return known;
  const summary = getMockApplicationSummary(id);
  return {
    id,
    application_id: summary.id,
    job_id: summary.job_id,
    job_title: summary.job_title,
    trainee_id: summary.trainee_id,
    candidate_name: summary.candidate_name,
    scheduled_at: minutesFromNow(1440),
    duration_minutes: 45,
    mode: "online",
    meeting_link: "https://meet.nurvex.ai/int-demo",
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

const APPLICATION_SUMMARIES: Record<string, ApplicationSummary> = {
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
  "app-geeta-pacs": {
    id: "app-geeta-pacs",
    trainee_id: "cand-geeta-ben-rathod",
    candidate_name: "Geeta Ben Rathod",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    status: "hired",
  },
  "app-sunita-accountant": {
    id: "app-sunita-accountant",
    trainee_id: "cand-sunita-yadav",
    candidate_name: "Sunita Devi Yadav",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    status: "shortlisted",
  },
  "app-aslam-mis": {
    id: "app-aslam-mis",
    trainee_id: "cand-aslam-sheikh",
    candidate_name: "Mohammed Aslam Sheikh",
    job_id: "emp-job-mis-analyst",
    job_title: "MIS & Data Analyst - Cooperative Sector",
    status: "screened",
  },
};

export function getMockApplicationSummary(id: string): ApplicationSummary {
  const known = APPLICATION_SUMMARIES[id];
  if (known) return known;
  const fromApplications = mockEmployerApplications.find((application) => application.id === id);
  const fallback = mockEmployerApplications[0];
  const record = fromApplications ?? fallback;
  return {
    id,
    trainee_id: record.trainee_id,
    candidate_name: record.name,
    job_id: record.job_id ?? "emp-job-dairy-supervisor",
    job_title: record.job_title ?? "Dairy Procurement Supervisor",
    status: record.status,
  };
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
  {
    id: "off-05",
    application_id: "app-sunita-accountant",
    job_id: "emp-job-society-accountant",
    job_title: "Cooperative Society Accountant",
    trainee_id: "cand-sunita-yadav",
    candidate_name: "Sunita Devi Yadav",
    status: "sent",
    salary: 23500,
    employment_type: "full_time",
    joining_date: "2026-10-20",
    location: "Pune, Maharashtra",
    benefits: "PF, ESI, Transport allowance and annual cooperative dividend eligibility.",
    additional_terms: "Reporting to the District Cooperative Union office, Pune.",
    sent_at: "2026-09-26T09:30:00.000Z",
    responded_at: null,
    created_at: "2026-09-26T08:45:00.000Z",
  },
];

export function findMockOffer(id: string): Offer | undefined {
  return mockOffers.find((offer) => offer.id === id);
}

export const mockFeedbackResponse: FeedbackResponse = {
  hires: [
    {
      application_id: "app-geeta-pacs",
      job_id: "emp-job-society-accountant",
      job_title: "Cooperative Society Accountant",
      trainee_id: "cand-geeta-ben-rathod",
      employee_name: "Geeta Ben Rathod",
      hired_at: "2026-08-11T11:00:00Z",
      feedback_submitted: false,
    },
    {
      application_id: "app-kavita-accounts",
      job_id: "emp-job-society-accountant",
      job_title: "Cooperative Society Accountant",
      trainee_id: "cand-kavita-sharma",
      employee_name: "Kavita Sharma",
      hired_at: "2026-07-01T09:30:00Z",
      feedback_submitted: true,
    },
    {
      application_id: "app-ravindra-dairy",
      job_id: "emp-job-dairy-supervisor",
      job_title: "Dairy Procurement Supervisor",
      trainee_id: "cand-ravindra-patil",
      employee_name: "Ravindra Suresh Patil",
      hired_at: "2026-06-02T10:00:00Z",
      feedback_submitted: true,
    },
    {
      application_id: "app-meenakshi-quality",
      job_id: "emp-job-quality-analyst",
      job_title: "Quality & Compliance Analyst",
      trainee_id: "cand-meenakshi-deshmukh",
      employee_name: "Meenakshi Ramesh Deshmukh",
      hired_at: "2026-06-20T09:00:00Z",
      feedback_submitted: true,
    },
  ],
  feedback: [
    {
      id: "fb-1",
      job_id: "emp-job-dairy-supervisor",
      job_title: "Dairy Procurement Supervisor",
      trainee_id: "cand-ravindra-patil",
      employee_name: "Ravindra Suresh Patil",
      ratings: {
        technical_skills: 5,
        communication: 4,
        problem_solving: 4,
        domain_knowledge: 5,
        digital_skills: 3,
        work_readiness: 5,
      },
      performance_rating: 4.4,
      additional_skills_needed: ["Cold Chain Telematics", "Route Costing"],
      comments:
        "Ravindra runs the Anand cluster routes with almost no dispatch deviations. Needs exposure to reefer telematics and route-level cost optimisation.",
      created_at: "2026-08-30T14:20:00Z",
    },
    {
      id: "fb-2",
      job_id: "emp-job-quality-analyst",
      job_title: "Quality & Compliance Analyst",
      trainee_id: "cand-meenakshi-deshmukh",
      employee_name: "Meenakshi Ramesh Deshmukh",
      ratings: {
        technical_skills: 5,
        communication: 4,
        problem_solving: 4,
        domain_knowledge: 5,
        digital_skills: 4,
        work_readiness: 4,
      },
      performance_rating: 4.3,
      additional_skills_needed: ["Six Sigma Green Belt", "FSSAI Audit Documentation"],
      comments:
        "Meenakshi owns the lab compliance file now and closes calibration gaps before audits. Focused on process improvement; Six Sigma would round out the profile.",
      created_at: "2026-08-18T11:05:00Z",
    },
    {
      id: "fb-3",
      job_id: "emp-job-society-accountant",
      job_title: "Cooperative Society Accountant",
      trainee_id: "cand-kavita-sharma",
      employee_name: "Kavita Sharma",
      ratings: {
        technical_skills: 4,
        communication: 4,
        problem_solving: 4,
        domain_knowledge: 4,
        digital_skills: 4,
        work_readiness: 5,
      },
      performance_rating: 4.2,
      additional_skills_needed: ["Cooperative Audit", "AGM Financial Statements"],
      comments:
        "Kavita is reliable with statutory registers and reconciles member payouts the same day. Would like to observe an independent society audit.",
      created_at: "2026-08-02T09:45:00Z",
    },
  ],
};

export const mockSkillDemandAggregate: SkillDemandAggregate = {
  responses: 42,
  skills: [
    { skill: "Cooperative Accounting", mentions: 24 },
    { skill: "Cold Chain Handling", mentions: 21 },
    { skill: "FSSAI & HACCP Compliance", mentions: 19 },
    { skill: "Tally", mentions: 17 },
    { skill: "Six Sigma Basics", mentions: 12 },
    { skill: "Solar Microgrid Maintenance", mentions: 9 },
  ],
};

export const mockTalentPoolEntries: TalentEntry[] = [
  {
    id: "tp-1",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    location: "Anand, Gujarat",
    occupation: "Milk Route Supervisor",
    category: "high_potential",
    note: "Excellent score on FAT/SNF testing and HACCP sanitisation protocol. Recommended for the supervisory opening next quarter.",
    match_score: 94,
    added_at: "2026-09-06T10:00:00Z",
  },
  {
    id: "tp-2",
    trainee_id: "cand-sunita-yadav",
    candidate_name: "Sunita Devi Yadav",
    location: "South Delhi, Delhi",
    occupation: "Cooperative Society Accountant",
    category: "saved",
    note: "Strong statutory register discipline and Tally throughput. Keep warm for the Pune society accountant opening.",
    match_score: 87,
    added_at: "2026-09-19T14:30:00Z",
  },
  {
    id: "tp-3",
    trainee_id: "cand-aslam-sheikh",
    candidate_name: "Mohammed Aslam Sheikh",
    location: "Pune, Maharashtra",
    occupation: "MIS & Data Analyst",
    category: "future_hiring",
    note: "Strong spreadsheet reporting. Needs dashboarding practice before a full MIS analyst role.",
    match_score: 74,
    added_at: "2026-09-21T09:15:00Z",
  },
  {
    id: "tp-4",
    trainee_id: "cand-meenakshi-deshmukh",
    candidate_name: "Meenakshi Ramesh Deshmukh",
    location: "Vadodara, Gujarat",
    occupation: "Quality & Compliance Analyst",
    category: "interviewed",
    note: "Great lab leadership, demonstrated strong HACCP implementation across two plants.",
    match_score: 88,
    added_at: "2026-09-12T16:00:00Z",
  },
  {
    id: "tp-5",
    trainee_id: "cand-farida-khatoon",
    candidate_name: "Farida Khatoon",
    location: "Kheda, Gujarat",
    occupation: "Retail Store Associate",
    category: "previously_hired",
    note: "Hired for the Kheda counter last season. Excellent member-facing service; rehire for the new outlet.",
    match_score: 78,
    added_at: "2026-08-28T11:20:00Z",
  },
  {
    id: "tp-6",
    trainee_id: "cand-geeta-ben-rathod",
    candidate_name: "Geeta Ben Rathod",
    location: "Ahmedabad, Gujarat",
    occupation: "Senior PACS Bookkeeper",
    category: "previously_hired",
    note: "Joined as society accountant and is now the senior bookkeeper for the Ahmedabad cluster.",
    match_score: 86,
    added_at: "2026-08-11T10:40:00Z",
  },
];

export const mockCandidateOptions: CandidateOption[] = mockCandidateSummaries.map((candidate) => ({
  id: candidate.id,
  name: candidate.name,
  location: candidate.location,
  occupation: candidate.occupation,
  match_score: candidate.match_score,
}));

export function findMockTalentEntry(id: string): TalentEntry | undefined {
  return mockTalentPoolEntries.find((entry) => entry.id === id);
}

export function applyMockOfferStatus(id: string, status: OfferStatus): Offer | undefined {
  const offer = findMockOffer(id);
  if (!offer) return undefined;
  offer.status = status;
  if (status === "sent") offer.sent_at = new Date().toISOString();
  return offer;
}

export function upsertMockTalentEntry(entry: TalentEntry): TalentEntry {
  const index = mockTalentPoolEntries.findIndex((item) => item.trainee_id === entry.trainee_id);
  if (index === -1) mockTalentPoolEntries.unshift(entry);
  else mockTalentPoolEntries[index] = { ...mockTalentPoolEntries[index], ...entry };
  return entry;
}

export function setMockTalentCategory(id: string, category: TalentCategory): TalentEntry | undefined {
  const entry = findMockTalentEntry(id);
  if (entry) entry.category = category;
  return entry;
}

export function removeMockTalentEntry(id: string): void {
  const index = mockTalentPoolEntries.findIndex((entry) => entry.id === id);
  if (index !== -1) mockTalentPoolEntries.splice(index, 1);
}

export function addMockTeamMember(body: { name: string; email: string; role: TeamRole }): TeamMember {
  return {
    id: `tm-${Date.now().toString(36)}`,
    name: body.name,
    email: body.email,
    role: body.role,
    status: "invited",
    last_active: null,
  };
}

export function upsertMockHire(hire: HireRecord): void {
  const index = mockFeedbackResponse.hires.findIndex((item) => item.application_id === hire.application_id);
  if (index === -1) mockFeedbackResponse.hires.unshift(hire);
  else mockFeedbackResponse.hires[index] = hire;
}

const ANALYTICS_MONTHS = 12;

const ANALYTICS_TIMELINE = [
  { month: "Nov 2025", applications: 18, hires: 1 },
  { month: "Dec 2025", applications: 24, hires: 2 },
  { month: "Jan 2026", applications: 31, hires: 2 },
  { month: "Feb 2026", applications: 38, hires: 2 },
  { month: "Mar 2026", applications: 31, hires: 2 },
  { month: "Apr 2026", applications: 27, hires: 2 },
  { month: "May 2026", applications: 33, hires: 2 },
  { month: "Jun 2026", applications: 29, hires: 2 },
  { month: "Jul 2026", applications: 36, hires: 2 },
  { month: "Aug 2026", applications: 41, hires: 3 },
  { month: "Sep 2026", applications: 34, hires: 3 },
  { month: "Oct 2026", applications: 46, hires: 4 },
];

const ANALYTICS_TIME_TO_HIRE = [22, 20, 18, 17, 16, 16, 15, 15, 14, 13, 13, 12];

const ANALYTICS_TOP_SKILLS = [
  { skill: "Cooperative Accounting", count: 34 },
  { skill: "Cold Chain Handling", count: 28 },
  { skill: "Quality Testing", count: 22 },
  { skill: "Dairy Operations", count: 19 },
  { skill: "Tally", count: 14 },
  { skill: "Bookkeeping", count: 12 },
];

const ANALYTICS_SOURCES = [
  { source: "NURVEX Skill Passport", count: 78 },
  { source: "Institution Referrals", count: 36 },
  { source: "Direct Referral", count: 18 },
  { source: "Apprenticeship Program", count: 10 },
];

export function getMockAnalytics(months: number): AnalyticsResponse {
  const window = Math.max(3, Math.min(ANALYTICS_MONTHS, months));
  const slice = ANALYTICS_TIMELINE.slice(-window);
  const tth = ANALYTICS_TIME_TO_HIRE.slice(-window);
  const scale = window / ANALYTICS_MONTHS;
  const applied = Math.round(142 * scale);
  const shortlists = Math.round(48 * scale);
  const interviews = Math.round(26 * scale);
  const offers = Math.round(12 * scale);
  const hires = Math.round(9 * scale);

  return {
    range_months: window,
    kpis: {
      applications: applied,
      shortlists,
      interviews,
      offers,
      hires,
      time_to_hire_days: tth[tth.length - 1] ?? null,
      hiring_conversion_pct: applied > 0 ? Math.round((hires / applied) * 1000) / 10 : null,
    },
    funnel: [
      { stage: "Applied", count: applied },
      { stage: "Shortlisted", count: shortlists },
      { stage: "Interview", count: interviews },
      { stage: "Offered", count: offers },
      { stage: "Hired", count: hires },
    ],
    hiring_timeline: slice,
    top_skills: ANALYTICS_TOP_SKILLS,
    candidate_sources: ANALYTICS_SOURCES,
    time_to_hire_trend: slice.map((point, index) => ({ month: point.month, days: tth[index] ?? 0 })),
    job_performance: mockEmployerJobs
      .filter((job) => job.applications_count > 0)
      .map((job) => ({
        job_id: job.id,
        job_title: job.title,
        applications: job.applications_count,
        shortlisted: job.shortlisted_count,
        hires: Math.max(1, Math.floor(job.interview_count / 3)),
        conversion_pct:
          job.applications_count > 0
            ? Math.round((Math.max(1, Math.floor(job.interview_count / 3)) / job.applications_count) * 1000) / 10
            : null,
      })),
  };
}

export function getMockReportPreview(key: ReportKey): ReportPreview {
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
        rows: mockEmployerJobs.map((job) => ({
          job_title: job.title,
          status: job.status === "open" ? "Active" : job.status.charAt(0).toUpperCase() + job.status.slice(1),
          applications: job.applications_count,
          shortlisted: job.shortlisted_count,
          interviewed: job.interview_count,
          hired: Math.max(1, Math.floor(job.interview_count / 3)),
        })),
        total_rows: mockEmployerJobs.length,
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
          { department: "Procurement & Quality", open_roles: 2, avg_time_to_fill: 18, retention_rate: "96%" },
          { department: "Cold Chain Logistics & Distribution", open_roles: 1, avg_time_to_fill: 14, retention_rate: "92%" },
          { department: "Quality Assurance", open_roles: 1, avg_time_to_fill: 15, retention_rate: "98%" },
          { department: "Information Technology", open_roles: 1, avg_time_to_fill: 21, retention_rate: "90%" },
          { department: "Marketing & Retail", open_roles: 1, avg_time_to_fill: 24, retention_rate: "89%" },
        ],
        total_rows: 5,
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
          { skill: "Cooperative Accounting", verified_candidates: 34, avg_proficiency: 88, certification_rate: "94%" },
          { skill: "Cold Chain Handling", verified_candidates: 28, avg_proficiency: 85, certification_rate: "89%" },
          { skill: "Quality Testing", verified_candidates: 22, avg_proficiency: 92, certification_rate: "95%" },
          { skill: "Bookkeeping & Tally", verified_candidates: 18, avg_proficiency: 84, certification_rate: "88%" },
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
        rows: mockInterviews
          .filter((interview) => interview.status === "completed")
          .map((interview) => ({
            candidate_name: interview.candidate_name,
            job_title: interview.job_title,
            interviewer: interview.interviewer_name ?? "Not recorded",
            recommendation:
              interview.overall_recommendation === "recommend"
                ? "Hire"
                : interview.overall_recommendation === "strongly_recommend"
                  ? "Strong Hire"
                  : interview.overall_recommendation === "not_recommend"
                    ? "Do not hire"
                    : "Undecided",
            technical_score: `${interview.evaluation?.technical_skills ?? "-"}/5`,
            culture_fit: `${interview.evaluation?.cooperative_sector_knowledge ?? "-"}/5`,
          })),
        total_rows: mockInterviews.filter((interview) => interview.status === "completed").length,
      };
    case "employment":
      return {
        key,
        title: "Offer & Employment Records",
        description: "Status of formal employment offers, compensation, and onboarding dates.",
        columns: [
          { key: "candidate_name", label: "Candidate Name" },
          { key: "job_title", label: "Designation" },
          { key: "salary", label: "Monthly CTC (INR)" },
          { key: "status", label: "Offer Status" },
          { key: "start_date", label: "Proposed Joining Date" },
        ],
        rows: mockOffers.map((offer) => ({
          candidate_name: offer.candidate_name,
          job_title: offer.job_title,
          salary: offer.salary === null ? "—" : `₹${offer.salary.toLocaleString("en-IN")}`,
          status: offer.status.charAt(0).toUpperCase() + offer.status.slice(1),
          start_date: offer.joining_date ?? "—",
        })),
        total_rows: mockOffers.length,
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
        rows: mockFeedbackResponse.feedback.map((record) => ({
          employee_name: record.employee_name,
          role: record.job_title,
          performance: record.performance_rating === null ? "Pending" : `${record.performance_rating} / 5.0`,
          additional_needs:
            record.additional_skills_needed.length > 0 ? record.additional_skills_needed.join(", ") : "None reported",
        })),
        total_rows: mockFeedbackResponse.feedback.length,
      };
  }
}

export function upsertMockFeedbackRecord(record: FeedbackResponse["feedback"][number]): FeedbackResponse["feedback"][number] {
  const index = mockFeedbackResponse.feedback.findIndex((item) => item.id === record.id);
  if (index === -1) mockFeedbackResponse.feedback.unshift(record);
  else mockFeedbackResponse.feedback[index] = record;
  return record;
}

