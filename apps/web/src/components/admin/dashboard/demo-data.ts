import type { AdminDashboard } from "@/lib/admin/admin-api";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/** Fictional fallback rows, shown only behind the DemoBanner when the API fails. */
export const DEMO_DASHBOARD: AdminDashboard = {
  kpis: {
    institutions: 128,
    trainers: 842,
    trainees: 12460,
    certified: 2180,
    employers: 215,
    deltas: { institutions: 12, trainers: 48, trainees: 1240, certified: 320, employers: 28 },
  },
  enrollment_trend: [
    { month: "May", new_enrollments: 1020, certifications: 410 },
    { month: "Jun", new_enrollments: 1180, certifications: 455 },
    { month: "Jul", new_enrollments: 1140, certifications: 390 },
    { month: "Aug", new_enrollments: 1320, certifications: 520 },
    { month: "Sep", new_enrollments: 1460, certifications: 610 },
    { month: "Oct", new_enrollments: 1580, certifications: 470 },
  ],
  institutions_by_state: [
    { state: "Maharashtra", count: 46 },
    { state: "Gujarat", count: 28 },
    { state: "Karnataka", count: 22 },
    { state: "Tamil Nadu", count: 19 },
    { state: "Kerala", count: 12 },
    { state: "Delhi", count: 9 },
    { state: "Uttar Pradesh", count: 7 },
    { state: "Assam", count: 4 },
  ],
  program_distribution: [
    { label: "Dairy & Livestock", percent: 32 },
    { label: "Cooperative Management", percent: 24 },
    { label: "Agri Business", percent: 18 },
    { label: "Rural Development", percent: 12 },
    { label: "Digital Skills", percent: 8 },
    { label: "Others", percent: 6 },
  ],
  placement_overview: [
    { month: "May", placements: 92, rate: 58 },
    { month: "Jun", placements: 110, rate: 63 },
    { month: "Jul", placements: 96, rate: 66 },
    { month: "Aug", placements: 104, rate: 67 },
    { month: "Sep", placements: 98, rate: 68 },
    { month: "Oct", placements: 124, rate: 74 },
  ],
  top_institutions: [
    { id: "demo-1", name: "VAMNICOM", state: "Maharashtra", trainees: 1240, trainers: 68, rating: 4.8 },
    { id: "demo-2", name: "Amul Dairy Training Centre", state: "Gujarat", trainees: 980, trainers: 54, rating: 4.7 },
    { id: "demo-3", name: "NCDC Training Institute", state: "Delhi", trainees: 860, trainers: 42, rating: 4.6 },
    { id: "demo-4", name: "Sahakar Bharati College", state: "Karnataka", trainees: 720, trainers: 38, rating: 4.5 },
    { id: "demo-5", name: "Gujarat Cooperative College", state: "Gujarat", trainees: 650, trainers: 36, rating: 4.4 },
  ],
  recent_activity: [
    { kind: "institution", title: "New institution registered", subtitle: "Sahyadri Cooperative College, Pune", at: minutesAgo(2) },
    { kind: "trainer", title: "Trainer onboarded", subtitle: "Dr. Meera Shah", at: minutesAgo(12) },
    { kind: "certification", title: "Trainee certified", subtitle: "Amit Verma – Dairy Management", at: minutesAgo(35) },
    { kind: "job", title: "New job posted", subtitle: "Dairy Quality Analyst – Amul", at: minutesAgo(60) },
    { kind: "placement", title: "Placement completed", subtitle: "Kiran Deshmukh – Quality Control Executive", at: minutesAgo(120) },
    { kind: "assessment", title: "Assessment published", subtitle: "Cooperative Accounting – Module 2", at: minutesAgo(180) },
  ],
  recent_placements: [
    { candidate_name: "Kiran Deshmukh", role: "Quality Control Executive", employer: "Amul Dairy", date: "2026-10-03" },
    { candidate_name: "Amit Verma", role: "Data Analyst", employer: "GCMMF", date: "2026-10-02" },
    { candidate_name: "Neha Patel", role: "Operations Trainee", employer: "Saras Dairy", date: "2026-10-01" },
    { candidate_name: "Rahul Thakur", role: "Supply Chain Executive", employer: "IFFCO", date: "2026-09-30" },
    { candidate_name: "Meera Singh", role: "HR Assistant", employer: "NCDC", date: "2026-09-30" },
  ],
  ai_insights: [
    {
      title: "Enrollment Growth",
      text: "Trainee enrollment is up 24% compared to last quarter, driven by increased demand in dairy and agri-business programs.",
    },
    {
      title: "Skill Demand Trend",
      text: "Employers are increasingly looking for Data Analytics, Quality Control, and Supply Chain skills.",
    },
    {
      title: "Placement Opportunity",
      text: "215 active employers have posted 482 new jobs. Consider expanding industry partnerships.",
    },
  ],
};
