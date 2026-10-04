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
  { key: "offered", label: "Offered", count: 3 },
  { key: "hired", label: "Hired", count: 5 },
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
  { month: "Jul", applications: 22, interviews: 6, hired: 3 },
  { month: "Aug", applications: 26, interviews: 8, hired: 3 },
  { month: "Sep", applications: 20, interviews: 6, hired: 2 },
  { month: "Oct", applications: 25, interviews: 7, hired: 4 },
];

const TIMELINE_MONTHS_BY_RANGE: Record<TimelineRange, number> = { "3m": 3, "6m": 6, "1y": 12 };

export function demoTimeline(range: TimelineRange): TimelinePoint[] {
  return TIMELINE_ALL.slice(-TIMELINE_MONTHS_BY_RANGE[range]);
}

const DEMO_FEEDBACK: EmployerFeedbackItem[] = [
  {
    id: "fb-01",
    trainee_id: null,
    candidate_name: "Hitesh Solanki",
    role: "Dairy Operations Associate",
    hired_ago: "Hired 3 months ago",
    rating: 4,
    comment: "Good technical skills, quick learner and well adopted to the cooperative work culture.",
  },
  {
    id: "fb-02",
    trainee_id: null,
    candidate_name: "Priya Shah",
    role: "Quality Control Executive",
    hired_ago: "Hired 5 months ago",
    rating: 5,
    comment: "Excellent performance in lab operations and team collaboration.",
  },
  {
    id: "fb-03",
    trainee_id: null,
    candidate_name: "Manish Patel",
    role: "Supply Chain Coordinator",
    hired_ago: "Hired 6 months ago",
    rating: 3,
    comment: "Strong analytical skills, reliable and proactive in routing decisions.",
  },
];

export function demoDashboard(funnelRange: FunnelRange, timelineRange: TimelineRange): EmployerDashboard {
  return {
    viewer_name: "Rajesh Mehta",
    organisation_name: "Amul Dairy Cooperative Union",
    kpis: {
      active_jobs: { value: 4, delta: 2, period: "this month" },
      applications: { value: 57, delta: 18, period: "this month" },
      shortlisted: { value: 14, delta: 6, period: "this month" },
      interviews: { value: 7, delta: 3, period: "this month" },
      offers: { value: 3, delta: 2, period: "this month" },
      hired: { value: 5, delta: 4, period: "this month" },
    },
    today: [
      { id: "t-1", starts_at: todayAt(10, 0), kind: "interview", candidate_name: "Ravindra Suresh Patil", subtitle: "Dairy Management Trainee" },
      { id: "t-2", starts_at: todayAt(11, 30), kind: "interview", candidate_name: "Neha Patel", subtitle: "Quality Control Executive" },
      { id: "t-3", starts_at: todayAt(14, 0), kind: "review", candidate_name: null, subtitle: "Team review: candidate shortlisting" },
    ],
    funnel: demoFunnel(funnelRange),
    skill_match: [
      { skill: "Dairy Management", count: 48 },
      { skill: "Quality Control", count: 36 },
      { skill: "Cooperative Operations", count: 28 },
      { skill: "Supply Chain", count: 24 },
      { skill: "Data Analytics", count: 18 },
    ],
    top_candidates: [
      { trainee_id: "demo-cand-01", name: "Ravindra Suresh Patil", headline: "Dairy Management Trainee · B.Sc. Agriculture", location: "Anand, Gujarat", match_score: 94, top_skills: ["Dairy Management", "Quality Control", "Cooperative Operations"], job_id: null },
      { trainee_id: "demo-cand-02", name: "Kiran Deshmukh", headline: "PACS Accounts Specialist · B.Com", location: "Baroda, Gujarat", match_score: 89, top_skills: ["Accounting", "Cooperative Finance", "Digital Tools"], job_id: null },
      { trainee_id: "demo-cand-03", name: "Sunil Parmar", headline: "Supply Chain Coordinator · B.Tech", location: "Surat, Gujarat", match_score: 86, top_skills: ["Supply Chain", "Logistics", "Data Analysis"], job_id: null },
      { trainee_id: "demo-cand-04", name: "Neha Patel", headline: "Quality Control Executive · M.Sc. Food Tech", location: "Vadodara, Gujarat", match_score: 82, top_skills: ["Quality Control", "Food Safety", "Lab Testing"], job_id: null },
    ],
    recent_applications: [
      { id: "demo-app-01", candidate_name: "Amit Verma", role: "Data Analyst", match_score: 92, status: "applied", applied_at: hoursAgo(2) },
      { id: "demo-app-02", candidate_name: "Pooja Sharma", role: "HR Executive", match_score: 88, status: "shortlisted", applied_at: hoursAgo(4) },
      { id: "demo-app-03", candidate_name: "Vikram Joshi", role: "Dairy Operations Trainee", match_score: 76, status: "interview", applied_at: hoursAgo(24) },
      { id: "demo-app-04", candidate_name: "Sneha Iyer", role: "Quality Analyst", match_score: 84, status: "applied", applied_at: hoursAgo(48) },
      { id: "demo-app-05", candidate_name: "Rahul Thakur", role: "Marketing Executive", match_score: 70, status: "rejected", applied_at: hoursAgo(72) },
    ],
    candidate_sources: [
      { label: "CoopSetu Training", percent: 40 },
      { label: "Institution Referrals", percent: 25 },
      { label: "Job Portal", percent: 20 },
      { label: "Walk-in", percent: 10 },
      { label: "Other", percent: 5 },
    ],
    hiring_timeline: demoTimeline(timelineRange),
    upcoming_interviews: [
      { id: "demo-int-01", candidate_name: "Ravindra Suresh Patil", role: "Dairy Management Trainee", starts_at: futureAt(1, 10, 0), mode: "online", meeting_link: null, status: "scheduled" },
      { id: "demo-int-02", candidate_name: "Neha Patel", role: "Quality Control Executive", starts_at: futureAt(1, 11, 30), mode: "online", meeting_link: null, status: "scheduled" },
      { id: "demo-int-03", candidate_name: "Amit Verma", role: "Data Analyst", starts_at: futureAt(2, 14, 0), mode: "onsite", meeting_link: null, status: "scheduled" },
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
