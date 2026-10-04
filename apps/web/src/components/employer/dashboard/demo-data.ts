import type { EmployerDashboard, EmployerFeedbackItem, FunnelRange, FunnelStage, TimelinePoint, TimelineRange } from "@/lib/employer/jobs-api";

/**
 * Fictional demo fallback for the employer dashboard. Only shown when
 * `GET /api/v1/employer/dashboard` is unavailable, always behind the
 * `.demo-data-tag` chip. Names, roles and places are invented.
 */

const FUNNEL_BASE: { key: FunnelStage["key"]; label: string; count: number }[] = [
  { key: "applied", label: "Applied", count: 57 },
  { key: "screened", label: "Screened", count: 28 },
  { key: "shortlisted", label: "Shortlisted", count: 14 },
  { key: "interview", label: "Interview", count: 7 },
  { key: "offered", label: "Offered", count: 5 },
  { key: "hired", label: "Hired", count: 3 },
];

const FUNNEL_SCALE: Record<FunnelRange, number> = {
  "30d": 0.45,
  "3m": 1,
  "6m": 1.7,
  custom: 1,
};

/** Builds a funnel whose counts scale with the selected period, so the filter visibly changes the demo. */
export function demoFunnel(range: FunnelRange): FunnelStage[] {
  const scale = FUNNEL_SCALE[range];
  const counts = FUNNEL_BASE.map((stage) => ({ ...stage, count: Math.max(1, Math.round(stage.count * scale)) }));
  const applied = counts[0].count;
  return counts.map((stage, index) => {
    const prev = index === 0 ? null : counts[index - 1].count;
    return {
      key: stage.key,
      label: stage.label,
      count: stage.count,
      percent: Math.round((stage.count / applied) * 100),
      conversion: prev === null ? null : Math.round((stage.count / prev) * 100),
    };
  });
}

const TIMELINE_ALL: TimelinePoint[] = [
  { month: "Nov", applications: 9, interviews: 2, hired: 0 },
  { month: "Dec", applications: 12, interviews: 3, hired: 1 },
  { month: "Jan", applications: 15, interviews: 4, hired: 1 },
  { month: "Feb", applications: 11, interviews: 3, hired: 0 },
  { month: "Mar", applications: 18, interviews: 5, hired: 2 },
  { month: "Apr", applications: 21, interviews: 6, hired: 1 },
  { month: "May", applications: 17, interviews: 5, hired: 2 },
  { month: "Jun", applications: 24, interviews: 7, hired: 2 },
  { month: "Jul", applications: 22, interviews: 6, hired: 2 },
  { month: "Aug", applications: 26, interviews: 8, hired: 3 },
  { month: "Sep", applications: 20, interviews: 6, hired: 2 },
  { month: "Oct", applications: 25, interviews: 7, hired: 3 },
];

const TIMELINE_MONTHS_BY_RANGE: Record<TimelineRange, number> = { "3m": 3, "6m": 6, "1y": 12 };

export function demoTimeline(range: TimelineRange): TimelinePoint[] {
  return TIMELINE_ALL.slice(-TIMELINE_MONTHS_BY_RANGE[range]);
}

const DEMO_FEEDBACK: EmployerFeedbackItem[] = [
  {
    id: "fb-1",
    trainee_id: "cand-ravindra-patil",
    candidate_name: "Ravindra Suresh Patil",
    role: "Dairy Procurement Supervisor",
    hired_ago: "Hired 4 months ago",
    rating: 4,
    comment: "Runs the Anand cluster routes with almost no dispatch deviations. Needs exposure to reefer telematics and route costing.",
  },
  {
    id: "fb-2",
    trainee_id: "cand-meenakshi-deshmukh",
    candidate_name: "Meenakshi Ramesh Deshmukh",
    role: "Quality & Compliance Analyst",
    hired_ago: "Hired 2 months ago",
    rating: 5,
    comment: "Owns the lab compliance file and closes calibration gaps before audits. Six Sigma would round out the profile.",
  },
  {
    id: "fb-3",
    trainee_id: "cand-kavita-sharma",
    candidate_name: "Kavita Sharma",
    role: "Cooperative Society Accountant",
    hired_ago: "Hired 3 months ago",
    rating: 5,
    comment: "Reconciles member payouts the same day and keeps statutory registers audit ready. Very dependable.",
  },
  {
    id: "fb-4",
    trainee_id: "cand-geeta-ben-rathod",
    candidate_name: "Geeta Ben Rathod",
    role: "Senior PACS Bookkeeper",
    hired_ago: "Hired 6 months ago",
    rating: 3,
    comment: "Strong on cooperative audit records. Would benefit from more exposure to cold chain dispatch billing.",
  },
];

export function demoDashboard(funnelRange: FunnelRange, timelineRange: TimelineRange): EmployerDashboard {
  return {
    viewer_name: "Rajesh Mehta",
    organisation_name: "Amul Dairy Cooperative Union",
    kpis: {
      active_jobs: { value: 6, delta: 2, period: "this month" },
      applications: { value: 57, delta: 18, period: "this month" },
      shortlisted: { value: 14, delta: 6, period: "this month" },
      interviews: { value: 7, delta: 3, period: "this month" },
      offers: { value: 5, delta: 2, period: "this month" },
      hired: { value: 3, delta: 2, period: "this month" },
    },
    today: [
      { id: "int-01", starts_at: todayAt(10, 0), kind: "interview", candidate_name: "Ravindra Suresh Patil", subtitle: "Dairy Procurement Supervisor" },
      { id: "int-08", starts_at: todayAt(11, 30), kind: "interview", candidate_name: "Sunita Devi Yadav", subtitle: "Cooperative Society Accountant" },
      { id: "int-03", starts_at: todayAt(14, 0), kind: "interview", candidate_name: "Siddharth Iyer", subtitle: "MIS & Data Analyst - Cooperative Sector" },
      { id: "t-3", starts_at: todayAt(16, 0), kind: "review", candidate_name: null, subtitle: "Team review: shortlisting for the FPO coordinator posting" },
    ],
    funnel: demoFunnel(funnelRange),
    skill_match: [
      { skill: "Dairy Operations", count: 48 },
      { skill: "Quality Testing", count: 36 },
      { skill: "Cooperative Operations", count: 28 },
      { skill: "Supply Chain", count: 24 },
      { skill: "Data Analytics", count: 18 },
    ],
    top_candidates: [
      { trainee_id: "cand-ravindra-patil", name: "Ravindra Suresh Patil", headline: "Milk Route Supervisor · B.Sc. Agriculture", location: "Anand, Gujarat", match_score: 94, top_skills: ["Dairy Operations", "Quality Testing", "Cold Chain Handling"], job_id: "emp-job-dairy-supervisor" },
      { trainee_id: "cand-kavita-sharma", name: "Kavita Sharma", headline: "Cooperative Society Accountant · B.Com", location: "Pune, Maharashtra", match_score: 89, top_skills: ["Bookkeeping", "Tally", "Statutory Compliance"], job_id: "emp-job-society-accountant" },
      { trainee_id: "cand-meenakshi-deshmukh", name: "Meenakshi Ramesh Deshmukh", headline: "Quality & Compliance Analyst · M.Sc. Food Tech", location: "Vadodara, Gujarat", match_score: 88, top_skills: ["Quality Testing", "Documentation", "Food Safety"], job_id: "emp-job-quality-analyst" },
      { trainee_id: "cand-siddharth-iyer", name: "Siddharth Iyer", headline: "MIS & Data Analyst · B.Tech Computer Science", location: "New Delhi", match_score: 91, top_skills: ["Data Analysis", "Spreadsheets", "Dashboarding"], job_id: "emp-job-mis-analyst" },
    ],
    recent_applications: [
      { id: "app-amit-store", candidate_name: "Amit Verma", role: "Retail Store Manager - Cooperative Brand", match_score: 84, status: "applied", applied_at: hoursAgo(2) },
      { id: "app-sunita-accountant", candidate_name: "Sunita Devi Yadav", role: "Cooperative Society Accountant", match_score: 87, status: "shortlisted", applied_at: hoursAgo(6) },
      { id: "app-aslam-mis", candidate_name: "Mohammed Aslam Sheikh", role: "MIS & Data Analyst - Cooperative Sector", match_score: 74, status: "screened", applied_at: hoursAgo(28) },
      { id: "app-meenakshi-quality", candidate_name: "Meenakshi Ramesh Deshmukh", role: "Quality & Compliance Analyst", match_score: 88, status: "interview", applied_at: hoursAgo(52) },
      { id: "app-farida-store", candidate_name: "Farida Khatoon", role: "Retail Store Manager - Cooperative Brand", match_score: 78, status: "rejected", applied_at: hoursAgo(96) },
    ],
    candidate_sources: [
      { label: "NURVEX Skill Passport", percent: 40 },
      { label: "Institution Referrals", percent: 25 },
      { label: "Job Portal", percent: 20 },
      { label: "Walk-in", percent: 10 },
      { label: "Other", percent: 5 },
    ],
    hiring_timeline: demoTimeline(timelineRange),
    upcoming_interviews: [
      { id: "int-01", candidate_name: "Ravindra Suresh Patil", role: "Dairy Procurement Supervisor", starts_at: futureAt(1, 10, 0), mode: "online", meeting_link: "https://meet.nurvex.ai/int-ravindra-dairy", status: "scheduled" },
      { id: "int-02", candidate_name: "Meenakshi Ramesh Deshmukh", role: "Quality & Compliance Analyst", starts_at: futureAt(1, 11, 30), mode: "online", meeting_link: "https://meet.nurvex.ai/int-meenakshi-quality", status: "scheduled" },
      { id: "int-03", candidate_name: "Siddharth Iyer", role: "MIS & Data Analyst - Cooperative Sector", starts_at: futureAt(2, 14, 0), mode: "onsite", meeting_link: null, status: "scheduled" },
      { id: "int-08", candidate_name: "Sunita Devi Yadav", role: "Cooperative Society Accountant", starts_at: futureAt(2, 16, 30), mode: "onsite", meeting_link: null, status: "scheduled" },
    ],
    feedback: DEMO_FEEDBACK,
  };
}

function todayAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function futureAt(daysAhead: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}