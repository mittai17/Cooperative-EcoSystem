import type { AttemptDetail, DetailQuestion } from "@/components/trainer/assessments/types";

export const TRAINER_TODAY = "2026-09-28";
export const TRAINER_INSTITUTION =
  "Vaikunth Mehta National Institute of Cooperative Management, Pune";
export const TRAINER_CAMPUS = "VAMNICOM Main Campus, Pune";

export const trainerProfile = {
  id: "NCCT-PUNE-4471",
  employeeId: "NCCT-PUNE-4471",
  name: "Dr. Meenal Kulkarni",
  designation: "Faculty - Cooperative Governance & Management",
  institution: TRAINER_INSTITUTION,
  email: "m.kulkarni@vamnicom.gov.in",
  phone: "+91 98230 44710",
  qualification: "Ph.D. in Cooperative Management",
  campus: "VAMNICOM, Pune, Maharashtra",
  accreditation: "NCCT Certified Trainer",
  specialisations: [
    "Cooperative Governance & Model Bylaws",
    "PACS Digital Accounting & Statutory Audit",
    "Board Leadership & Conflict Mediation",
    "Core Banking Systems for Credit Societies",
  ],
  bio: "Over 16 years of academic and field-level cooperative training experience across NCCT institutions and the Maharashtra state cooperative federation. Specialised in digital transformation of Primary Agricultural Credit Societies (PACS), statutory compliance monitoring and accounting automation for rural credit institutions.",
  stats: {
    sessions_taught: 128,
    active_cohorts: 4,
    trainees_mentored: 340,
    feedback_score: "4.9 / 5.0",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Batches, courses and classes                                                */
/* -------------------------------------------------------------------------- */

export interface PortalBatch {
  id: string;
  name: string;
}

export const portalBatches: PortalBatch[] = [
  { id: "b-2026-b", name: "Batch 2026-B" },
  { id: "b-2026-c", name: "Batch 2026-C" },
  { id: "b-2026-a", name: "Cohort 2026-A" },
  { id: "b-2025-c", name: "Batch 2025-C" },
];

export interface PortalCourse {
  id: string;
  title: string;
  category: string;
}

export const portalCourses: PortalCourse[] = [
  { id: "c-cmf", title: "Cooperative Management Fundamentals", category: "Governance" },
  { id: "c-lcb", title: "Leadership for Cooperative Board Members", category: "Leadership" },
  { id: "c-mis", title: "Credit Society Data & MIS", category: "Accounts" },
  { id: "c-bwl", title: "Board Leadership Weekend Lab", category: "Simulation" },
];

export interface PortalClass {
  id: string;
  course_id: string;
  course: string;
  category: string;
  batch: string;
  batch_id: string;
  batch_label: string;
  room: string;
  venue: string;
  capacity: number;
  trainees: number;
  progress: number;
  attendance: number;
  assessments_completed: number;
  assessments_total: number;
  average_assessment: number;
  completion_rate: number;
  at_risk: number;
  status_active: boolean;
  next_class: { start: string; label: string; room: string | null };
  schedule_days: string[];
  start: string;
  end: string;
}

const CLASS_ROWS: Omit<PortalClass, "course" | "category" | "batch_label" | "trainees" | "at_risk">[] = [
  {
    id: "cls-cmf-b",
    course_id: "c-cmf",
    batch: "2026-B",
    batch_id: "b-2026-b",
    room: "Hall A-204",
    venue: TRAINER_CAMPUS,
    capacity: 12,
    progress: 68,
    attendance: 94,
    assessments_completed: 4,
    assessments_total: 5,
    average_assessment: 82,
    completion_rate: 90,
    status_active: true,
    next_class: { start: "2026-09-30T04:30:00Z", label: "Wed 30 Sep, 10:00 AM", room: "Hall A-204" },
    schedule_days: ["Mon", "Wed"],
    start: "10:00",
    end: "11:30",
  },
  {
    id: "cls-lcb-c",
    course_id: "c-lcb",
    batch: "2026-C",
    batch_id: "b-2026-c",
    room: "Hall B-112",
    venue: TRAINER_CAMPUS,
    capacity: 10,
    progress: 82,
    attendance: 91,
    assessments_completed: 5,
    assessments_total: 6,
    average_assessment: 86,
    completion_rate: 95,
    status_active: true,
    next_class: { start: "2026-09-29T08:30:00Z", label: "Tue 29 Sep, 02:00 PM", room: "Hall B-112" },
    schedule_days: ["Tue", "Thu"],
    start: "14:00",
    end: "15:30",
  },
  {
    id: "cls-mis-a",
    course_id: "c-mis",
    batch: "2026-A",
    batch_id: "b-2026-a",
    room: "Analytics Lab 3",
    venue: TRAINER_CAMPUS,
    capacity: 8,
    progress: 45,
    attendance: 96,
    assessments_completed: 2,
    assessments_total: 4,
    average_assessment: 88,
    completion_rate: 72,
    status_active: true,
    next_class: { start: "2026-10-02T05:30:00Z", label: "Fri 2 Oct, 11:00 AM", room: "Analytics Lab 3" },
    schedule_days: ["Fri"],
    start: "11:00",
    end: "13:00",
  },
  {
    id: "cls-bwl-c",
    course_id: "c-bwl",
    batch: "2025-C",
    batch_id: "b-2025-c",
    room: "Computer Lab 2",
    venue: TRAINER_CAMPUS,
    capacity: 5,
    progress: 100,
    attendance: 98,
    assessments_completed: 3,
    assessments_total: 3,
    average_assessment: 90,
    completion_rate: 100,
    status_active: false,
    next_class: { start: "2026-10-03T04:00:00Z", label: "Sat 3 Oct, 09:30 AM", room: "Computer Lab 2" },
    schedule_days: ["Sat"],
    start: "09:30",
    end: "12:00",
  },
];

export interface PortalTraineeSeed {
  id: string;
  code: string;
  name: string;
  batch_id: string;
  att: number;
  lrn: number;
  asm: number;
  asg: number;
  skl: number;
  act: string;
  st: string;
  risks: string[];
}

const TRAINEE_SEEDS: PortalTraineeSeed[] = [
  { id: "tr-001", code: "NCCT-PUNE-0142", name: "Ashwini Pawar", batch_id: "b-2026-b", att: 96, lrn: 88, asm: 92, asg: 95, skl: 86, act: "2026-09-28T09:45:00Z", st: "on_track", risks: [] },
  { id: "tr-002", code: "NCCT-PUNE-0143", name: "Vikram Solanki", batch_id: "b-2026-b", att: 90, lrn: 82, asm: 85, asg: 88, skl: 80, act: "2026-09-28T08:30:00Z", st: "on_track", risks: [] },
  { id: "tr-003", code: "NCCT-PUNE-0144", name: "Deepak Chauhan", batch_id: "b-2026-b", att: 88, lrn: 76, asm: 78, asg: 80, skl: 74, act: "2026-09-27T17:10:00Z", st: "on_track", risks: [] },
  { id: "tr-004", code: "NCCT-PUNE-0145", name: "Suresh S. Mane", batch_id: "b-2026-b", att: 68, lrn: 52, asm: 48, asg: 50, skl: 45, act: "2026-09-24T14:30:00Z", st: "at_risk", risks: ["Attendance below 75%", "Missed Module 4 Quiz", "Late assignment submission"] },
  { id: "tr-005", code: "NCCT-PUNE-0146", name: "Pooja Sharma", batch_id: "b-2026-b", att: 94, lrn: 90, asm: 88, asg: 92, skl: 88, act: "2026-09-28T10:00:00Z", st: "on_track", risks: [] },
  { id: "tr-006", code: "NCCT-PUNE-0147", name: "Ramesh Kumar", batch_id: "b-2026-b", att: 82, lrn: 70, asm: 68, asg: 72, skl: 65, act: "2026-09-27T11:20:00Z", st: "needs_attention", risks: ["Practical score below 70%"] },
  { id: "tr-007", code: "NCCT-PUNE-0148", name: "Amit Gupta", batch_id: "b-2026-b", att: 92, lrn: 85, asm: 84, asg: 86, skl: 82, act: "2026-09-28T09:15:00Z", st: "on_track", risks: [] },
  { id: "tr-026", code: "NCCT-PUNE-0167", name: "Kiran Wagh", batch_id: "b-2026-b", att: 84, lrn: 74, asm: 72, asg: 76, skl: 70, act: "2026-09-26T10:00:00Z", st: "needs_attention", risks: ["Irregular submission trend"] },
  { id: "tr-027", code: "NCCT-PUNE-0168", name: "Jyoti Gholap", batch_id: "b-2026-b", att: 92, lrn: 86, asm: 84, asg: 88, skl: 82, act: "2026-09-28T09:20:00Z", st: "on_track", risks: [] },
  { id: "tr-028", code: "NCCT-PUNE-0169", name: "Vijay Gaware", batch_id: "b-2026-b", att: 90, lrn: 82, asm: 80, asg: 84, skl: 78, act: "2026-09-27T13:45:00Z", st: "on_track", risks: [] },
  { id: "tr-008", code: "NCCT-PUNE-0149", name: "Anjali Rathore", batch_id: "b-2026-c", att: 64, lrn: 58, asm: 55, asg: 60, skl: 50, act: "2026-09-22T09:15:00Z", st: "at_risk", risks: ["Low Attendance (64%)", "Incomplete bylaws assessment"] },
  { id: "tr-009", code: "NCCT-PUNE-0150", name: "Priya Nair", batch_id: "b-2026-c", att: 98, lrn: 94, asm: 95, asg: 96, skl: 92, act: "2026-09-28T08:00:00Z", st: "on_track", risks: [] },
  { id: "tr-010", code: "NCCT-PUNE-0151", name: "Rajesh Patil", batch_id: "b-2026-c", att: 86, lrn: 78, asm: 75, asg: 80, skl: 72, act: "2026-09-27T16:00:00Z", st: "on_track", risks: [] },
  { id: "tr-011", code: "NCCT-PUNE-0152", name: "Sneha Kadam", batch_id: "b-2026-c", att: 92, lrn: 86, asm: 82, asg: 85, skl: 80, act: "2026-09-28T07:45:00Z", st: "on_track", risks: [] },
  { id: "tr-012", code: "NCCT-PUNE-0153", name: "Mahesh Shinde", batch_id: "b-2026-c", att: 80, lrn: 68, asm: 65, asg: 68, skl: 62, act: "2026-09-26T14:30:00Z", st: "needs_attention", risks: ["Assessment average below 70%"] },
  { id: "tr-013", code: "NCCT-PUNE-0154", name: "Kavita More", batch_id: "b-2026-c", att: 94, lrn: 88, asm: 90, asg: 90, skl: 85, act: "2026-09-28T09:30:00Z", st: "on_track", risks: [] },
  { id: "tr-014", code: "NCCT-PUNE-0155", name: "Sandeep Jadhav", batch_id: "b-2026-c", att: 90, lrn: 84, asm: 80, asg: 82, skl: 78, act: "2026-09-27T18:00:00Z", st: "on_track", risks: [] },
  { id: "tr-015", code: "NCCT-PUNE-0156", name: "Priyanka Deshmukh", batch_id: "b-2026-a", att: 96, lrn: 92, asm: 90, asg: 94, skl: 88, act: "2026-09-28T09:00:00Z", st: "on_track", risks: [] },
  { id: "tr-016", code: "NCCT-PUNE-0157", name: "Sunil Gaikwad", batch_id: "b-2026-a", att: 94, lrn: 85, asm: 84, asg: 88, skl: 82, act: "2026-09-28T10:10:00Z", st: "on_track", risks: [] },
  { id: "tr-017", code: "NCCT-PUNE-0158", name: "Pallavi Chavan", batch_id: "b-2026-a", att: 90, lrn: 80, asm: 78, asg: 82, skl: 76, act: "2026-09-27T15:20:00Z", st: "on_track", risks: [] },
  { id: "tr-018", code: "NCCT-PUNE-0159", name: "Ganesh Bhosale", batch_id: "b-2026-a", att: 84, lrn: 72, asm: 70, asg: 74, skl: 68, act: "2026-09-26T12:00:00Z", st: "needs_attention", risks: ["Late MIS submission"] },
  { id: "tr-019", code: "NCCT-PUNE-0160", name: "Swati Sawant", batch_id: "b-2026-a", att: 96, lrn: 90, asm: 88, asg: 92, skl: 85, act: "2026-09-28T08:50:00Z", st: "on_track", risks: [] },
  { id: "tr-020", code: "NCCT-PUNE-0161", name: "Nitin Salunkhe", batch_id: "b-2026-a", att: 92, lrn: 84, asm: 82, asg: 86, skl: 80, act: "2026-09-27T14:40:00Z", st: "on_track", risks: [] },
  { id: "tr-021", code: "NCCT-PUNE-0162", name: "Rohini Jagtap", batch_id: "b-2025-c", att: 100, lrn: 96, asm: 95, asg: 98, skl: 94, act: "2026-09-28T09:10:00Z", st: "completed", risks: [] },
  { id: "tr-022", code: "NCCT-PUNE-0163", name: "Sachin Thorat", batch_id: "b-2025-c", att: 98, lrn: 92, asm: 90, asg: 94, skl: 88, act: "2026-09-27T16:50:00Z", st: "completed", risks: [] },
  { id: "tr-023", code: "NCCT-PUNE-0164", name: "Manisha Shirole", batch_id: "b-2025-c", att: 96, lrn: 90, asm: 88, asg: 92, skl: 86, act: "2026-09-28T10:05:00Z", st: "completed", risks: [] },
  { id: "tr-024", code: "NCCT-PUNE-0165", name: "Ajay Tambe", batch_id: "b-2025-c", att: 94, lrn: 88, asm: 86, asg: 90, skl: 84, act: "2026-09-27T11:00:00Z", st: "completed", risks: [] },
  { id: "tr-025", code: "NCCT-PUNE-0166", name: "Vaishali Mohite", batch_id: "b-2025-c", att: 98, lrn: 94, asm: 92, asg: 96, skl: 90, act: "2026-09-28T08:15:00Z", st: "completed", risks: [] },
];

export interface PortalTrainee {
  id: string;
  trainee_code: string;
  name: string;
  batch: string;
  batch_id: string;
  attendance: number;
  learning: number;
  assessment: number;
  assignment: number;
  skill_readiness: number;
  last_activity: string;
  inactive_days: number;
  status: string;
  status_label: string;
  risk_reasons: string[];
  course_progress: number;
}

const REFERENCE_INSTANT = Date.parse(`${TRAINER_TODAY}T12:00:00Z`);

export const portalTrainees: PortalTrainee[] = TRAINEE_SEEDS.map((t) => ({
  id: t.id,
  trainee_code: t.code,
  name: t.name,
  batch: batchName(t.batch_id),
  batch_id: t.batch_id,
  attendance: t.att,
  learning: t.lrn,
  assessment: t.asm,
  assignment: t.asg,
  skill_readiness: t.skl,
  last_activity: t.act,
  inactive_days: Math.max(
    0,
    Math.floor((REFERENCE_INSTANT - Date.parse(t.act)) / 86400000),
  ),
  status: t.st,
  status_label:
    t.st === "on_track"
      ? "On Track"
      : t.st === "at_risk"
        ? "At Risk"
        : t.st === "completed"
          ? "Completed"
          : "Needs Attention",
  risk_reasons: t.risks,
  course_progress: t.lrn,
}));

export const portalClasses: PortalClass[] = CLASS_ROWS.map((c) => {
  const course = portalCourses.find((x) => x.id === c.course_id)!;
  const roster = portalTrainees.filter((t) => t.batch_id === c.batch_id);
  return {
    ...c,
    course: course.title,
    category: course.category,
    batch_label: batchName(c.batch_id),
    trainees: roster.length,
    at_risk: roster.filter((t) => t.status === "at_risk").length,
  };
});

export interface PortalClassOption {
  batch_id: string;
  batch: string;
  course_id: string;
  course: string;
}

export const portalClassOptions: PortalClassOption[] = portalClasses.map((c) => ({
  batch_id: c.batch_id,
  batch: batchName(c.batch_id),
  course_id: c.course_id,
  course: c.course,
}));

export function batchName(batchId: string | null | undefined): string {
  return portalBatches.find((b) => b.id === batchId)?.name ?? "All Batches";
}

export function classById(id: string | null | undefined): PortalClass {
  return portalClasses.find((c) => c.id === id) ?? portalClasses[0];
}

export function courseById(id: string | null | undefined): PortalCourse | undefined {
  return portalCourses.find((c) => c.id === id);
}

export function traineeById(id: string | null | undefined): PortalTrainee {
  return portalTrainees.find((t) => t.id === id) ?? portalTrainees[0];
}

export function traineesOfBatch(batchId: string | null | undefined): PortalTrainee[] {
  if (!batchId) return portalTrainees;
  return portalTrainees.filter((t) => t.batch_id === batchId);
}

export function classesOfBatch(batchId: string | null | undefined): PortalClass[] {
  if (!batchId) return portalClasses;
  return portalClasses.filter((c) => c.batch_id === batchId);
}

/* -------------------------------------------------------------------------- */
/* Timetable, slots and calendar                                               */
/* -------------------------------------------------------------------------- */

export interface PortalSlot {
  slot_id: string;
  class_id: string;
  course_id: string;
  course: string;
  batch: string;
  batch_id: string;
  date: string;
  start: string;
  end: string;
  start_label: string;
  end_label: string;
  room: string | null;
  trainees: number;
}

function t12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function slotFor(klass: PortalClass, date: string, slotId: string): PortalSlot {
  return {
    slot_id: slotId,
    class_id: klass.id,
    course_id: klass.course_id,
    course: klass.course,
    batch: klass.batch_label,
    batch_id: klass.batch_id,
    date,
    start: klass.start,
    end: klass.end,
    start_label: t12(klass.start),
    end_label: t12(klass.end),
    room: klass.room,
    trainees: klass.trainees,
  };
}

const DOW_INDEX: Record<string, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};

export interface PortalCalendarEvent {
  id: string;
  type: "class" | "assessment" | "assignment";
  title: string;
  batch: string | null;
  date: string;
  start: string | null;
  end: string | null;
  room: string | null;
  link: string | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function portalCalendarEvents(startIso: string, endIso: string): PortalCalendarEvent[] {
  const from = new Date(`${startIso.slice(0, 10)}T00:00:00`);
  const to = new Date(`${endIso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return [];

  const events: PortalCalendarEvent[] = [];
  const cursor = new Date(from);
  let guard = 0;
  while (cursor <= to && guard < 800) {
    guard += 1;
    const date = ymd(cursor);
    const dow = (cursor.getDay() + 6) % 7;
    for (const klass of portalClasses) {
      if (!klass.schedule_days.some((d) => DOW_INDEX[d] === dow)) continue;
      events.push({
        id: `cal-${klass.id}-${date}`,
        type: "class",
        title: klass.course,
        batch: klass.batch_label,
        date,
        start: klass.start,
        end: klass.end,
        room: klass.room,
        link: `/trainer/classes/${klass.id}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const a of portalAssessments) {
    if (!a.scheduled_at) continue;
    const date = a.scheduled_at.slice(0, 10);
    if (date < startIso.slice(0, 10) || date > endIso.slice(0, 10)) continue;
    events.push({
      id: `cal-${a.id}`,
      type: "assessment",
      title: a.title,
      batch: batchName(a.batch_id),
      date,
      start: a.scheduled_at.slice(11, 16),
      end: null,
      room: a.scheduled_at.slice(11, 16) >= "12:00" ? "Hall B-112" : "Exam Hall 1",
      link: `/trainer/assessments/${a.id}`,
    });
  }

  for (const a of portalAssignments) {
    if (!a.deadline) continue;
    const date = a.deadline.slice(0, 10);
    if (date < startIso.slice(0, 10) || date > endIso.slice(0, 10)) continue;
    events.push({
      id: `cal-${a.id}`,
      type: "assignment",
      title: `${a.title} due`,
      batch: batchName(a.batch_id),
      date,
      start: a.deadline.slice(11, 16),
      end: null,
      room: null,
      link: "/trainer/assignments",
    });
  }

  return events.sort((x, y) => (x.date + (x.start ?? "")).localeCompare(y.date + (y.start ?? "")));
}

/* -------------------------------------------------------------------------- */
/* Assessments                                                                 */
/* -------------------------------------------------------------------------- */

export interface PortalAssessment {
  id: string;
  title: string;
  course: string;
  course_id: string;
  module: string;
  batch_id: string;
  description: string;
  instructions: string;
  questions: number;
  duration_minutes: number;
  passing_score: number;
  scheduled_at: string | null;
  status: "draft" | "published" | "completed";
  group: "upcoming" | "drafts" | "published" | "completed";
  submitted: number;
  needs_review: number;
  avg_score: number | null;
}

export const portalAssessments: PortalAssessment[] = [
  {
    id: "asm-1",
    title: "Statutory Audit & Annual General Meetings",
    course: "Cooperative Management Fundamentals",
    course_id: "c-cmf",
    module: "Module 4",
    batch_id: "b-2026-b",
    description:
      "Evaluation on AGM statutory compliance, quorum computation, notice circulation, and audit report presentation.",
    instructions:
      "Attempt all questions. The short-answer and practical items are evaluated manually after submission.",
    questions: 5,
    duration_minutes: 45,
    passing_score: 50,
    scheduled_at: "2026-09-30T04:30:00Z",
    status: "published",
    group: "upcoming",
    submitted: 8,
    needs_review: 2,
    avg_score: 82,
  },
  {
    id: "asm-2",
    title: "Board Resolution Drafting & Compliance",
    course: "Leadership for Cooperative Board Members",
    course_id: "c-lcb",
    module: "Module 2",
    batch_id: "b-2026-c",
    description:
      "Drafting ordinary and special board resolutions, recording dissent, and tracking action-taken reports.",
    instructions: "Answer in the space provided. Cite the governing rule for each resolution.",
    questions: 5,
    duration_minutes: 30,
    passing_score: 50,
    scheduled_at: "2026-10-02T08:30:00Z",
    status: "published",
    group: "upcoming",
    submitted: 5,
    needs_review: 1,
    avg_score: 84,
  },
  {
    id: "asm-3",
    title: "Cooperative Bylaws Interpretation Test",
    course: "Cooperative Management Fundamentals",
    course_id: "c-cmf",
    module: "Module 2",
    batch_id: "b-2026-b",
    description:
      "Interpretation of mandatory and model bylaws clauses for primary agricultural credit societies.",
    instructions: "Choose the most appropriate answer for each clause-level question.",
    questions: 5,
    duration_minutes: 60,
    passing_score: 50,
    scheduled_at: "2026-09-20T04:30:00Z",
    status: "completed",
    group: "completed",
    submitted: 10,
    needs_review: 0,
    avg_score: 85,
  },
  {
    id: "asm-4",
    title: "PACS Balance Sheet Reconciliation Practical",
    course: "Credit Society Data & MIS",
    course_id: "c-mis",
    module: "Module 3",
    batch_id: "b-2026-a",
    description:
      "Practical reconciliation of passbook ledger balances against the cash-in-hand register and reserve fund schedule.",
    instructions: "Attach your reconciliation statement. Practical items are graded manually.",
    questions: 5,
    duration_minutes: 45,
    passing_score: 50,
    scheduled_at: "2026-09-24T05:30:00Z",
    status: "published",
    group: "published",
    submitted: 6,
    needs_review: 0,
    avg_score: 88,
  },
  {
    id: "asm-5",
    title: "MSCS Act 2002 Quorum & Elections Quiz",
    course: "Leadership for Cooperative Board Members",
    course_id: "c-lcb",
    module: "Module 3",
    batch_id: "b-2026-c",
    description:
      "Quiz on statutory quorum thresholds, board election cycles and cooperative election disputes.",
    instructions: "Draft only. Publish when the item bank is reviewed by the department.",
    questions: 5,
    duration_minutes: 30,
    passing_score: 50,
    scheduled_at: null,
    status: "draft",
    group: "drafts",
    submitted: 0,
    needs_review: 0,
    avg_score: null,
  },
  {
    id: "asm-7",
    title: "Board Practicum Viva — Capital Investment Decision",
    course: "Board Leadership Weekend Lab",
    course_id: "c-bwl",
    module: "Module 4",
    batch_id: "b-2025-c",
    description:
      "Oral viva on the cold-storage investment decision argued by each board panel in the weekend lab.",
    instructions: "Answer the viva questions and attach the panel's signed resolution.",
    questions: 5,
    duration_minutes: 40,
    passing_score: 50,
    scheduled_at: "2026-09-12T04:00:00Z",
    status: "completed",
    group: "completed",
    submitted: 5,
    needs_review: 0,
    avg_score: 90,
  },
  {
    id: "asm-6",
    title: "Member Grievance Handling Case Simulation",
    course: "Cooperative Management Fundamentals",
    course_id: "c-cmf",
    module: "Module 3",
    batch_id: "b-2026-b",
    description:
      "Simulated redressal of a member grievance over short-paid patronage dividend, including the reply draft.",
    instructions: "Work in pairs. Submit one written response per pair.",
    questions: 5,
    duration_minutes: 40,
    passing_score: 50,
    scheduled_at: "2026-09-15T04:30:00Z",
    status: "completed",
    group: "completed",
    submitted: 10,
    needs_review: 0,
    avg_score: 80,
  },
];

export function assessmentById(id: string | null | undefined): PortalAssessment {
  return portalAssessments.find((a) => a.id === id) ?? portalAssessments[0];
}

const OPT = {
  a: "a", b: "b", c: "c", d: "d",
};

const QUESTION_BANKS: Record<string, DetailQuestion[]> = {
  "asm-7": [
    {
      id: "asm-7-q1",
      type: "mcq_single",
      prompt: "Which body must approve a capital expenditure above the board's delegated limit?",
      options: [
        { id: OPT.a, text: "The general body by special resolution" },
        { id: OPT.b, text: "The audit committee alone" },
        { id: OPT.c, text: "The district administration" },
        { id: OPT.d, text: "The society's nominee members only" },
      ],
      correct: ["a"],
      explanation: "Capital expenditure beyond the delegated limit is a general body function.",
      marks: 5,
    },
    {
      id: "asm-7-q2",
      type: "true_false",
      prompt: "A cold-storage unit can be leased from a member society on a depreciation basis under the model bylaws.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["true"],
      explanation: "Leasing from a member society is permitted with Registrar approval.",
      marks: 5,
    },
    {
      id: "asm-7-q3",
      type: "mcq_multi",
      prompt: "Which risks must the appraisal note cover before the board recommends the investment?",
      options: [
        { id: OPT.a, text: "Off-season utilisation of the capacity" },
        { id: OPT.b, text: "Debt servicing coverage from the proposed loan" },
        { id: OPT.c, text: "The promoter's personal shareholding" },
        { id: OPT.d, text: "Power tariff escalation at the project site" },
      ],
      correct: ["a", "b", "d"],
      explanation: "Utilisation, repayment capacity and input cost escalation are the appraisal pillars.",
      marks: 10,
    },
    {
      id: "asm-7-q4",
      type: "short_answer",
      prompt: "Summarise the panel's recommendation on the cold-storage proposal.",
      options: null,
      correct: [
        "Proceed with a 500 MT unit financed by a term loan, with utilisation reviewed after the first season",
        "Defer the decision until the patronage statement for the year is circulated",
      ],
      explanation: "A recommendation must state the decision, the financing and a review trigger.",
      marks: 10,
    },
    {
      id: "asm-7-q5",
      type: "practical",
      prompt: "Draft the special resolution authorising the cold-storage purchase at Rs 48 lakh.",
      options: null,
      correct: [
        "Resolved that the society purchase the 500 MT cold-storage unit at Rs 48,00,000",
        "Passed with not less than two-thirds of the members present and voting",
      ],
      explanation: "The resolution must state the asset, the value and the majority threshold.",
      marks: 10,
    },
  ],
  "asm-1": [
    {
      id: "asm-1-q1",
      type: "mcq_single",
      prompt:
        "Under the Multi-State Cooperative Societies Act, 2002, what is the minimum notice period for convening an Annual General Meeting?",
      options: [
        { id: OPT.a, text: "7 days" },
        { id: OPT.b, text: "14 clear days" },
        { id: OPT.c, text: "21 clear days" },
        { id: OPT.d, text: "30 days" },
      ],
      correct: ["b"],
      explanation: "The model bylaws require at least 14 clear days notice for an AGM.",
      marks: 5,
    },
    {
      id: "asm-1-q2",
      type: "true_false",
      prompt:
        "The statutory auditor of a cooperative society may be elected as a voting director of the same society.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["false"],
      explanation:
        "Auditor independence prohibits holding elective office in the society whose accounts are audited.",
      marks: 5,
    },
    {
      id: "asm-1-q3",
      type: "mcq_multi",
      prompt: "Which documents must be tabled at every AGM of a primary agricultural credit society?",
      options: [
        { id: OPT.a, text: "Audited balance sheet and profit and loss account" },
        { id: OPT.b, text: "Annual report of the board" },
        { id: OPT.c, text: "Shareholder register of a public limited company" },
        { id: OPT.d, text: "Reserve fund and patronage statement" },
      ],
      correct: ["a", "b", "d"],
      explanation:
        "The annual report must include the audited accounts, the board report and the reserve/patronage disclosures.",
      marks: 10,
    },
    {
      id: "asm-1-q4",
      type: "short_answer",
      prompt:
        "Explain the procedure when the required quorum is not present within thirty minutes of the appointed AGM start time.",
      options: null,
      correct: [
        "Adjourn the meeting to the same day in the following week at the same time and place",
        "At the adjourned meeting the members present themselves constitute the quorum",
      ],
      explanation:
        "The model bylaws provide for one adjournment of seven days, after which the members present form the quorum.",
      marks: 10,
    },
    {
      id: "asm-1-q5",
      type: "practical",
      prompt:
        "A society with 480 members has 96 members present at the AGM. Compute the shortfall against the statutory quorum and draft the notice for the adjourned meeting.",
      options: null,
      correct: [
        "Statutory quorum for a general body meeting is one-fourth of the total members",
        "One-fourth of 480 members is 120, so 96 present leaves a shortfall of 24 members",
        "Draft the notice as a single line for the same day next week at the same time and place",
      ],
      explanation:
        "Candidates should state the one-fourth rule, the arithmetic and a compliant adjournment notice.",
      marks: 15,
    },
  ],
  "asm-2": [
    {
      id: "asm-2-q1",
      type: "mcq_single",
      prompt: "Which resolution type is required to amend the mandatory provisions of a society's bylaws?",
      options: [
        { id: OPT.a, text: "Ordinary resolution" },
        { id: OPT.b, text: "Special resolution" },
        { id: OPT.c, text: "Resolution by the board" },
        { id: OPT.d, text: "Administrative circular" },
      ],
      correct: ["b"],
      explanation:
        "Amendments to mandatory bylaws clauses require a special resolution passed by a two-thirds majority.",
      marks: 5,
    },
    {
      id: "asm-2-q2",
      type: "true_false",
      prompt:
        "The chairperson of a cooperative board has an automatic second or casting vote when the board is evenly divided.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["true"],
      explanation: "The presiding officer holds a casting vote in the event of an equality of votes.",
      marks: 5,
    },
    {
      id: "asm-2-q3",
      type: "mcq_multi",
      prompt: "What must a compliant board minutes record for every resolution passed?",
      options: [
        { id: OPT.a, text: "Names of directors who voted in favour and against" },
        { id: OPT.b, text: "Any dissent recorded by a director" },
        { id: OPT.c, text: "Attendance of the statutory auditor" },
        { id: OPT.d, text: "The action-taken responsibility and target date" },
      ],
      correct: ["a", "b", "d"],
      explanation:
        "Minutes must capture the voting split, recorded dissent and the action-taken follow-up.",
      marks: 10,
    },
    {
      id: "asm-2-q4",
      type: "short_answer",
      prompt: "Draft the wording of a special resolution for the purchase of a cold-storage unit.",
      options: null,
      correct: [
        "Resolved that the society purchase a 500 MT cold storage unit at the quoted cost",
        "Passed with a majority of not less than two-thirds of the members present and voting",
      ],
      explanation:
        "A special resolution must state the resolution, the amount involved and the two-thirds threshold.",
      marks: 10,
    },
    {
      id: "asm-2-q5",
      type: "practical",
      prompt:
        "A board resolution on sanctioning a loan of Rs 2,50,000 is challenged for want of quorum. Advise the chair on the corrective record.",
      options: null,
      correct: [
        "Confirm quorum at the time of the resolution and record the number of directors present",
        "Ratify the resolution at the next board meeting with the quorum requirement satisfied",
      ],
      explanation:
        "The chair must ensure the minutes evidence quorum and, if defective, obtain ratification.",
      marks: 10,
    },
  ],
  "asm-3": [
    {
      id: "asm-3-q1",
      type: "mcq_single",
      prompt: "Which of the following is a mandatory clause in the model bylaws of a primary cooperative society?",
      options: [
        { id: OPT.a, text: "The maximum value of a member's share subscription" },
        { id: OPT.b, text: "The procedure for dissolution and amalgamation" },
        { id: OPT.c, text: "The brand colour of the society" },
        { id: OPT.d, text: "The annual fee charged to associate members" },
      ],
      correct: ["b"],
      explanation: "Dissolution and amalgamation must be covered by a mandatory clause.",
      marks: 5,
    },
    {
      id: "asm-3-q2",
      type: "true_false",
      prompt:
        "The Registrar may amend a society's bylaws to remove any clause that is contrary to the Act.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["true"],
      explanation:
        "The Registrar has the power to amend bylaws so as to remove inconsistency with the Act.",
      marks: 5,
    },
    {
      id: "asm-3-q3",
      type: "mcq_single",
      prompt:
        "The reserve fund clause of a state cooperative society must provide for transfer of at least what share of net profit?",
      options: [
        { id: OPT.a, text: "10%" },
        { id: OPT.b, text: "15%" },
        { id: OPT.c, text: "25%" },
        { id: OPT.d, text: "40%" },
      ],
      correct: ["c"],
      explanation: "A minimum of 25% of net profit must be transferred to the reserve fund.",
      marks: 10,
    },
    {
      id: "asm-3-q4",
      type: "short_answer",
      prompt: "State the membership qualification clauses normally adopted in model bylaws.",
      options: null,
      correct: [
        "Minimum age of 18 years and mental capacity to contract",
        "Membership restricted to the notified service area of the society",
      ],
      explanation: "Age, capacity to contract and the service-area restriction are standard qualifications.",
      marks: 10,
    },
    {
      id: "asm-3-q5",
      type: "practical",
      prompt:
        "A society's bylaws permit the board to admit associate members without a general body resolution. Assess the compliance position.",
      options: null,
      correct: [
        "Associate membership requires a general body resolution under the model bylaws",
        "The board must place the admission before the next general body for ratification",
      ],
      explanation:
        "Creation of new membership categories is a general body function, not a board delegation.",
      marks: 10,
    },
  ],
  "asm-4": [
    {
      id: "asm-4-q1",
      type: "mcq_single",
      prompt:
        "In PACS reconciliation, which ledger is treated as the primary record for cash and bank balances?",
      options: [
        { id: OPT.a, text: "The passbook ledger" },
        { id: OPT.b, text: "The share register" },
        { id: OPT.c, text: "The loan sanction register" },
        { id: OPT.d, text: "The dividend warrant register" },
      ],
      correct: ["a"],
      explanation: "The passbook ledger is the primary record for cash and bank balances.",
      marks: 5,
    },
    {
      id: "asm-4-q2",
      type: "true_false",
      prompt:
        "A shortage in the cash-in-hand register must be recovered from the cash-in-charge before the books are closed.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["true"],
      explanation: "Physical cash shortages are personal liabilities of the cash-in-charge.",
      marks: 5,
    },
    {
      id: "asm-4-q3",
      type: "mcq_multi",
      prompt: "Which reconciliations are part of the monthly PACS computerisation checklist?",
      options: [
        { id: OPT.a, text: "Passbook ledger against cash book" },
        { id: OPT.b, text: "Loan sub-ledger against member-wise statement of account" },
        { id: OPT.c, text: "Share register against admission register" },
        { id: OPT.d, text: "Reserve fund schedule against profit appropriation account" },
      ],
      correct: ["a", "b", "d"],
      explanation: "These three reconciliations feed the monthly PACS returns.",
      marks: 10,
    },
    {
      id: "asm-4-q4",
      type: "short_answer",
      prompt:
        "Explain why a trial balance can be balanced while the passbook ledger disagrees with the cash book.",
      options: null,
      correct: [
        "A wrong cash book entry can be posted to matching suspense accounts",
        "Balancing the trial balance only proves arithmetic equality, not correctness",
      ],
      explanation:
        "A trial balance proves arithmetic equality; compensating errors pass unnoticed without ledger reconciliation.",
      marks: 10,
    },
    {
      id: "asm-4-q5",
      type: "practical",
      prompt:
        "Prepare a reconciliation statement for a week in which the passbook ledger shows Rs 4,82,500 and the cash book shows Rs 4,76,200, with a bank transit delay of Rs 6,300.",
      options: null,
      correct: [
        "Start from the passbook ledger balance of Rs 4,82,500",
        "Add the unpresented cheque or transit item of Rs 6,300 as an appropriate reconciling difference",
        "Arrive at an adjusted balance of Rs 4,76,200 pending confirmation from the bank",
      ],
      explanation:
        "The transit item is the reconciling difference; candidates should show both sides of the statement.",
      marks: 15,
    },
  ],
  "asm-5": [
    {
      id: "asm-5-q1",
      type: "mcq_single",
      prompt: "What proportion of members constitutes the quorum for a general body meeting?",
      options: [
        { id: OPT.a, text: "One-tenth" },
        { id: OPT.b, text: "One-fourth" },
        { id: OPT.c, text: "One-third" },
        { id: OPT.d, text: "One-half" },
      ],
      correct: ["b"],
      explanation: "The statutory quorum for a general body meeting is one-fourth of the members.",
      marks: 5,
    },
    {
      id: "asm-5-q2",
      type: "true_false",
      prompt: "Associate members have voting rights in a general body meeting.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["false"],
      explanation: "Associate members do not carry voting rights and are not counted for quorum.",
      marks: 5,
    },
    {
      id: "asm-5-q3",
      type: "mcq_multi",
      prompt: "Which grounds can the Cooperative Registrar use to remove a board member?",
      options: [
        { id: OPT.a, text: "Persistent breach of the cooperative rules" },
        { id: OPT.b, text: "Non-attendance at three consecutive board meetings" },
        { id: OPT.c, text: "Dissatisfaction of the local political leadership" },
        { id: OPT.d, text: "Misappropriation of society funds" },
      ],
      correct: ["a", "b", "d"],
      explanation: "Removal must rest on recorded, rule-based grounds.",
      marks: 10,
    },
    {
      id: "asm-5-q4",
      type: "short_answer",
      prompt: "Describe the procedure for a cooperative election dispute.",
      options: null,
      correct: [
        "The dispute is referred to the Cooperative Commissioner within the prescribed period",
        "Awards of the Commissioner are appealable to the Registrar",
      ],
      explanation: "Disputes move from the society to the Cooperative Commissioner and then to the Registrar.",
      marks: 10,
    },
    {
      id: "asm-5-q5",
      type: "practical",
      prompt:
        "Four of eleven board seats fall vacant mid-term. Advise on the legal requirement for filling them.",
      options: null,
      correct: [
        "Vacant seats must be filled within three months by the remaining directors",
        "If not filled, the Registrar may appoint the nominees",
      ],
      explanation: "Co-operative law sets a three-month window before the Registrar may step in.",
      marks: 10,
    },
  ],
  "asm-6": [
    {
      id: "asm-6-q1",
      type: "mcq_single",
      prompt: "Who may file a grievance under a typical cooperative redressal clause?",
      options: [
        { id: OPT.a, text: "Any member of the society" },
        { id: OPT.b, text: "Only office bearers" },
        { id: OPT.c, text: "Only the Registrar" },
        { id: OPT.d, text: "Only the auditor" },
      ],
      correct: ["a"],
      explanation: "Every member is entitled to raise a grievance in writing.",
      marks: 5,
    },
    {
      id: "asm-6-q2",
      type: "true_false",
      prompt: "A grievance must be disposed of within the period prescribed by the society's bylaws.",
      options: [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ],
      correct: ["true"],
      explanation: "Bylaws fix a disposal period, commonly fifteen days.",
      marks: 5,
    },
    {
      id: "asm-6-q3",
      type: "mcq_multi",
      prompt: "What must the redressal committee record in its report?",
      options: [
        { id: OPT.a, text: "The date of receipt of the grievance" },
        { id: OPT.b, text: "The hearing summary and evidence relied on" },
        { id: OPT.c, text: "The order passed and the date of communication" },
        { id: OPT.d, text: "The member's annual shareholding value" },
      ],
      correct: ["a", "b", "c"],
      explanation: "The report documents receipt, hearing and order for audit purposes.",
      marks: 10,
    },
    {
      id: "asm-6-q4",
      type: "short_answer",
      prompt:
        "A member is short paid the patronage dividend for Rs 1,840. Draft the opening lines of the reply.",
      options: null,
      correct: [
        "Acknowledge the grievance and quote the date of receipt",
        "State that the patronage statement for the year has been verified and the shortfall confirmed",
      ],
      explanation: "A reply must acknowledge, verify and confirm before stating the remedy.",
      marks: 10,
    },
    {
      id: "asm-6-q5",
      type: "practical",
      prompt:
        "Draft a three-step redressal process for a society receiving forty grievances in a quarter.",
      options: null,
      correct: [
        "Acknowledge in writing within three working days of receipt",
        "Hold an oral hearing within fifteen days with a written order",
        "Report disposed cases in the annual return and escalate unresolved matters to the Commissioner",
      ],
      explanation: "A three-step process with timelines keeps disposal within the bylaw period.",
      marks: 10,
    },
  ],
};

export const portalQuestionBanks = QUESTION_BANKS;

export function questionBankFor(assessmentId: string): DetailQuestion[] {
  return QUESTION_BANKS[assessmentId] ?? QUESTION_BANKS["asm-1"];
}

export function assessmentFilters(filter: {
  batchId?: string | null;
  courseId?: string | null;
}): PortalAssessment[] {
  return portalAssessments.filter(
    (a) =>
      (!filter.batchId || a.batch_id === filter.batchId) &&
      (!filter.courseId || a.course_id === filter.courseId),
  );
}

const MANUAL_TRAINEE_ANSWERS: Record<string, string[]> = {
  short_answer: [
    "The meeting is adjourned to the same day in the following week at the same time and place. At the adjourned meeting the members present form the quorum.",
    "The board resolution must record the resolution, the amount and the two-thirds majority of members present and voting.",
    "Age of 18 years, capacity to contract, and residence or occupation within the notified service area.",
    "A trial balance only proves arithmetic equality, so a compensating error in the cash book can pass unnoticed.",
    "Disputes go to the Cooperative Commissioner first and are appealable to the Registrar.",
    "The grievance is acknowledged, the patronage statement is verified and the shortfall is confirmed in writing.",
  ],
  practical: [
    "Quorum is one-fourth of 480 members, so 120 members are required and the shortfall is 24. The adjournment notice is drafted for the same day next week at the same time and place.",
    "The minutes must evidence the number of directors present; if quorum was defective the resolution is ratified at the next meeting.",
    "The admission of associate members must be placed before the general body because membership creation is not a board delegation.",
    "Passbook ledger Rs 4,82,500 less transit item Rs 6,300 gives Rs 4,76,200, pending bank confirmation.",
    "Vacant seats must be filled within three months by the remaining directors, failing which the Registrar may nominate.",
    "Acknowledge in three days, hold the hearing within fifteen days, and report disposed cases in the annual return.",
  ],
};

function manualAnswerFor(type: string, seedIndex: number): string {
  const table = MANUAL_TRAINEE_ANSWERS[type];
  if (!table || table.length === 0) return "No answer recorded for this item.";
  return table[Math.abs(seedIndex) % table.length];
}

/** Deterministic attempt detail for any assessment id + attempt id pair. */
export function buildAttemptDetail(assessmentId: string, attemptId: string): AttemptDetail {
  const assessment = assessmentById(assessmentId);
  const roster = traineesOfBatch(assessment.batch_id);
  const matched =
    portalTrainees.find((t) => attemptId === t.id || attemptId.endsWith(t.id)) ??
    portalTrainees.find((t) => attemptId.includes(t.id));
  const trainee = matched ?? roster[0] ?? portalTrainees[0];
  const bank = questionBankFor(assessment.id);
  const seed = portalTrainees.findIndex((t) => t.id === trainee.id);
  const competence = trainee.assessment;

  let earned = 0;
  let available = 0;
  const questions = bank.map((q, i) => {
    const position = i + 1;
    const autoGraded = q.type === "mcq_single" || q.type === "mcq_multi" || q.type === "true_false";
    const misses = (seed + i) % 5 === 0;
    const correctAnswer = q.correct;
    let traineeAnswer: unknown;
    let autoMarks: number | null = null;

    if (autoGraded) {
      const right = !misses && competence >= 50;
      if (right) {
        traineeAnswer = Array.isArray(q.correct) && q.correct.length > 1 ? [...q.correct] : (q.correct[0] ?? "");
        autoMarks = q.marks;
      } else if (q.type === "true_false") {
        const flip = q.correct[0] === "true" ? "false" : "true";
        traineeAnswer = flip;
        autoMarks = 0;
      } else if (q.type === "mcq_multi") {
        traineeAnswer = [q.correct[0] ?? OPT.a];
        autoMarks = Math.round(q.marks / 2);
      } else {
        const wrong = (q.options ?? []).map((o) => o.id).find((oid) => !q.correct.includes(oid)) ?? OPT.a;
        traineeAnswer = wrong;
        autoMarks = 0;
      }
      earned += autoMarks ?? 0;
      available += q.marks;
      return {
        id: q.id,
        position,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        trainee_answer: traineeAnswer,
        expected: [...correctAnswer],
        explanation: q.explanation,
        max_marks: q.marks,
        auto_graded: true,
        auto_marks: autoMarks,
        manual_grade: null,
      };
    }

    const ratio = Math.max(0.35, Math.min(1, competence / 100));
    const marks = Math.round(q.marks * ratio);
    earned += marks;
    available += q.marks;
    return {
      id: q.id,
      position,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      trainee_answer: manualAnswerFor(q.type, seed + i),
      expected: [...q.correct],
      explanation: q.explanation,
      max_marks: q.marks,
      auto_graded: false,
      auto_marks: null,
      manual_grade:
        (seed + i) % 4 === 0
          ? null
          : {
              marks,
              feedback:
                marks >= q.marks * 0.8
                  ? "Clear reasoning with the correct statutory reference."
                  : "Right direction, but cite the governing rule and the arithmetic explicitly.",
              graded_at: "2026-09-28T11:10:00Z",
            },
    };
  });

  const rawScore = available ? (earned / available) * 100 : 0;
  const score = Math.round(Math.min(97, Math.max(38, rawScore)));
  const passed = score >= assessment.passing_score;
  const needsReview = questions.some((q) => !q.auto_graded && q.manual_grade === null);
  const attemptNo = (seed % 2) + 1;

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      passing_score: assessment.passing_score,
    },
    attempt: {
      id: attemptId,
      attempt_no: attemptNo,
      status: "submitted",
      score,
      passed,
      submitted_at: `2026-09-28T${String(6 + (seed % 3)).padStart(2, "0")}:${String(10 + ((seed * 7) % 45)).padStart(2, "0")}:00Z`,
      result: needsReview ? "Needs Review" : passed ? "Passed" : "Failed",
    },
    trainee: { id: trainee.id, name: trainee.name },
    overall_feedback: needsReview
      ? "Strong grasp of the statutory position. Finish the remaining manual items so the Skill Passport can be updated."
      : passed
        ? "Consistent and well-referenced answers. Keep the same structure for the module viva."
        : "Review the notice-period and quorum rules from Module 2 before the re-attempt.",
    questions,
  };
}

/* -------------------------------------------------------------------------- */
/* Assignments                                                                 */
/* -------------------------------------------------------------------------- */

export interface PortalAssignment {
  id: string;
  title: string;
  description: string;
  batch_id: string;
  course_id: string;
  deadline: string | null;
  overdue: boolean;
  max_marks: number;
  status: "draft" | "published";
  assigned: number;
  submitted: number;
  graded: number;
  resources: { title: string; url: string }[];
}

export const portalAssignments: PortalAssignment[] = [
  {
    id: "asg-1",
    title: "PACS Audit Checklist Formulation",
    description:
      "Formulate a ten-point audit verification checklist for primary credit societies, covering cash, loans and statutory reserve computation.",
    batch_id: "b-2026-b",
    course_id: "c-cmf",
    deadline: "2026-10-01T18:29:00Z",
    overdue: false,
    max_marks: 100,
    status: "published",
    assigned: 10,
    submitted: 8,
    graded: 6,
    resources: [
      { title: "PACS Audit Manual (NCCT)", url: "https://ncct.ac.in/resources/audit-manual" },
      { title: "Standard Balance Sheet Proforma", url: "https://nurvex.gov.in/proforma.pdf" },
    ],
  },
  {
    id: "asg-2",
    title: "Credit Appraisal Case Study & Risk Report",
    description:
      "Analyse seasonal agricultural loan defaults from sample farmer records and submit a risk grading report.",
    batch_id: "b-2026-a",
    course_id: "c-mis",
    deadline: "2026-10-05T13:30:00Z",
    overdue: false,
    max_marks: 50,
    status: "published",
    assigned: 6,
    submitted: 4,
    graded: 3,
    resources: [
      { title: "Credit Appraisal Manual, Chapter 4", url: "https://ncct.ac.in/resources/credit-appraisal" },
    ],
  },
  {
    id: "asg-3",
    title: "Election Code Compliance Documentation",
    description:
      "Draft a returning officer checklist in line with the Maharashtra Cooperative Societies Rules.",
    batch_id: "b-2026-c",
    course_id: "c-lcb",
    deadline: "2026-10-10T11:30:00Z",
    overdue: false,
    max_marks: 100,
    status: "draft",
    assigned: 7,
    submitted: 0,
    graded: 0,
    resources: [
      { title: "Model Election Code", url: "https://cooperation.gov.in/election-code" },
    ],
  },
  {
    id: "asg-4",
    title: "Society Balance Sheet Reconciliation Exercise",
    description:
      "Match passbook ledger balances with cash-in-hand register entries for a sample month and note the reconciling items.",
    batch_id: "b-2025-c",
    course_id: "c-bwl",
    deadline: "2026-09-24T18:29:00Z",
    overdue: true,
    max_marks: 100,
    status: "published",
    assigned: 5,
    submitted: 5,
    graded: 5,
    resources: [
      { title: "Reconciliation Proforma", url: "https://nurvex.gov.in/docs/reconciliation-proforma.pdf" },
    ],
  },
];

export function assignmentById(id: string | null | undefined): PortalAssignment {
  return portalAssignments.find((a) => a.id === id) ?? portalAssignments[0];
}

/* -------------------------------------------------------------------------- */
/* Learning content                                                            */
/* -------------------------------------------------------------------------- */

export interface PortalContentItem {
  id: string;
  number: number;
  title: string;
  course_id: string;
  course: string;
  module_id: string;
  module: string;
  kind: "video" | "pdf" | "presentation" | "link";
  type_label: string;
  duration_min: number | null;
  published: boolean;
  language: string;
  visibility: string;
  description: string;
  url: string;
}

export interface PortalModule {
  id: string;
  title: string;
  course_id: string;
}

export const portalModules: PortalModule[] = [
  { id: "mod-cmf-1", title: "Foundations of the Cooperative Movement", course_id: "c-cmf" },
  { id: "mod-cmf-2", title: "Governance, Boards & Bylaws", course_id: "c-cmf" },
  { id: "mod-cmf-3", title: "Community Enterprise Planning", course_id: "c-cmf" },
  { id: "mod-lead-1", title: "Board Roles & Statutory Duties", course_id: "c-lcb" },
  { id: "mod-lead-2", title: "Conflict Resolution & Collective Decisions", course_id: "c-lcb" },
  { id: "mod-mis-1", title: "Core Banking Systems", course_id: "c-mis" },
  { id: "mod-mis-2", title: "Reconciliation & Statutory Returns", course_id: "c-mis" },
  { id: "mod-bwl-1", title: "Simulation Practicum", course_id: "c-bwl" },
];

const CONTENT_SEEDS: Omit<PortalContentItem, "course" | "module">[] = [
  {
    id: "cnt-1",
    number: 1,
    title: "Why Cooperatives Exist: The Rochdale Principles",
    course_id: "c-cmf",
    module_id: "mod-cmf-1",
    kind: "video",
    type_label: "Video Lesson",
    duration_min: 22,
    published: true,
    language: "en, hi, mr",
    visibility: "batch",
    description:
      "Historical origin of the Rochdale Pioneers and its mapping to modern Indian PACS legislation.",
    url: "https://www.youtube.com/watch?v=nurvex-rochdale",
  },
  {
    id: "cnt-2",
    number: 2,
    title: "Model Bylaws for Primary Cooperatives (Annotated Guide)",
    course_id: "c-cmf",
    module_id: "mod-cmf-2",
    kind: "pdf",
    type_label: "PDF Document",
    duration_min: 15,
    published: true,
    language: "en, mr",
    visibility: "batch",
    description:
      "Clause-by-clause walkthrough for adopting the mandatory bylaws under the Cooperative Societies Act.",
    url: "https://nurvex.gov.in/docs/model-bylaws.pdf",
  },
  {
    id: "cnt-3",
    number: 3,
    title: "Board Composition and Reserved Seat Allocation",
    course_id: "c-cmf",
    module_id: "mod-cmf-2",
    kind: "presentation",
    type_label: "Slide Deck",
    duration_min: 30,
    published: true,
    language: "en, hi",
    visibility: "batch",
    description:
      "Visual slides on representation for women, SC/ST and smallholder farmers on cooperative boards.",
    url: "https://nurvex.gov.in/slides/board-composition.pptx",
  },
  {
    id: "cnt-4",
    number: 4,
    title: "Patronage Dividend Formulation Worksheet",
    course_id: "c-cmf",
    module_id: "mod-cmf-3",
    kind: "pdf",
    type_label: "PDF Document",
    duration_min: 18,
    published: false,
    language: "en, mr",
    visibility: "batch",
    description:
      "Draft spreadsheet guide for computing the patronage bonus from member trade volume.",
    url: "https://nurvex.gov.in/docs/patronage-worksheet.pdf",
  },
  {
    id: "cnt-5",
    number: 5,
    title: "Statutory Duties of Office Bearers",
    course_id: "c-lcb",
    module_id: "mod-lead-1",
    kind: "video",
    type_label: "Video Lesson",
    duration_min: 26,
    published: true,
    language: "en, hi, mr",
    visibility: "batch",
    description:
      "Fiduciary duties, disqualification triggers and the record a director must be able to produce.",
    url: "https://www.youtube.com/watch?v=nurvex-office-bearers",
  },
  {
    id: "cnt-6",
    number: 6,
    title: "Facilitating a Divided Board Meeting",
    course_id: "c-lcb",
    module_id: "mod-lead-2",
    kind: "video",
    type_label: "Video Lesson",
    duration_min: 28,
    published: true,
    language: "en, mr",
    visibility: "batch",
    description:
      "Simulation on mediation techniques when board factions disagree on capital investments.",
    url: "https://www.youtube.com/watch?v=nurvex-board-meeting",
  },
  {
    id: "cnt-7",
    number: 7,
    title: "Consensus Voting Mechanics & Protocol Sheet",
    course_id: "c-lcb",
    module_id: "mod-lead-2",
    kind: "pdf",
    type_label: "PDF Document",
    duration_min: 12,
    published: true,
    language: "en",
    visibility: "batch",
    description:
      "Standard ballot templates, secret vote protocols and casting vote guidelines.",
    url: "https://nurvex.gov.in/docs/voting-protocols.pdf",
  },
  {
    id: "cnt-8",
    number: 8,
    title: "PACS Core Banking & MIS Dashboard Walkthrough",
    course_id: "c-mis",
    module_id: "mod-mis-1",
    kind: "video",
    type_label: "Video Lesson",
    duration_min: 25,
    published: true,
    language: "en, hi",
    visibility: "batch",
    description:
      "Step-by-step navigation of the national PACS digital computerisation portal.",
    url: "https://www.youtube.com/watch?v=nurvex-pacs-mis",
  },
  {
    id: "cnt-9",
    number: 9,
    title: "Monthly MIS Return Walkthrough with Sample Dataset",
    course_id: "c-mis",
    module_id: "mod-mis-2",
    kind: "presentation",
    type_label: "Slide Deck",
    duration_min: 32,
    published: true,
    language: "en",
    visibility: "batch",
    description:
      "Working through a full month of loan sanction, disbursement and recovery entries in the MIS sheet.",
    url: "https://nurvex.gov.in/slides/mis-return-walkthrough.pptx",
  },
  {
    id: "cnt-10",
    number: 10,
    title: "Ministry of Cooperation Model Bylaws Portal",
    course_id: "c-cmf",
    module_id: "mod-cmf-1",
    kind: "link",
    type_label: "External Link",
    duration_min: null,
    published: true,
    language: "en",
    visibility: "batch",
    description:
      "Official web portal for circulars, notifications and standard operating procedures.",
    url: "https://cooperation.gov.in",
  },
  {
    id: "cnt-11",
    number: 11,
    title: "Board Practicum Brief: Cold Storage Investment Decision",
    course_id: "c-bwl",
    module_id: "mod-bwl-1",
    kind: "pdf",
    type_label: "PDF Document",
    duration_min: 20,
    published: true,
    language: "en, mr",
    visibility: "batch",
    description:
      "Case pack used in the weekend lab where three board panels argue the cold-storage proposal.",
    url: "https://nurvex.gov.in/docs/cold-storage-brief.pdf",
  },
];

export const portalContentItems: PortalContentItem[] = CONTENT_SEEDS.map((c) => ({
  ...c,
  course: courseById(c.course_id)?.title ?? "",
  module: portalModules.find((m) => m.id === c.module_id)?.title ?? "",
}));

/* -------------------------------------------------------------------------- */
/* Attendance                                                                  */
/* -------------------------------------------------------------------------- */

export interface PortalHistorySession {
  session_id: string;
  class_id: string;
  date: string;
  time: string;
  name: string;
  course: string;
  course_id: string;
  batch: string;
  batch_id: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
  roster: number;
  opens_at: string;
  closes_at: string;
  is_open: boolean;
  live: boolean;
}

interface HistorySeed {
  session_id: string;
  class_id: string;
  date: string;
  name: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
}

const HISTORY_SEEDS: HistorySeed[] = [
  { session_id: "att-0928", class_id: "cls-cmf-b", date: "2026-09-28", name: "Session 14 - Governance Bylaws", present: 8, late: 1, excused: 1, absent: 0 },
  { session_id: "att-0926", class_id: "cls-lcb-c", date: "2026-09-24", name: "Session 11 - Board Quorum Protocols", present: 7, late: 0, excused: 0, absent: 0 },
  { session_id: "att-0925", class_id: "cls-bwl-c", date: "2026-09-26", name: "Session 8 - Board Leadership Simulation", present: 5, late: 0, excused: 0, absent: 0 },
  { session_id: "att-0924", class_id: "cls-cmf-b", date: "2026-09-23", name: "Session 13 - AGM Resolution Drafting", present: 8, late: 1, excused: 1, absent: 0 },
  { session_id: "att-0923", class_id: "cls-mis-a", date: "2026-09-18", name: "Session 6 - Loan Voucher Audits", present: 5, late: 1, excused: 0, absent: 0 },
  { session_id: "att-0922", class_id: "cls-lcb-c", date: "2026-09-22", name: "Session 10 - Board Election Rules", present: 6, late: 1, excused: 0, absent: 0 },
  { session_id: "att-0921", class_id: "cls-cmf-b", date: "2026-09-21", name: "Session 12 - Notice & Quorum", present: 9, late: 0, excused: 0, absent: 1 },
  { session_id: "att-0920", class_id: "cls-bwl-c", date: "2026-09-19", name: "Session 7 - Mediation Roleplays", present: 4, late: 1, excused: 0, absent: 0 },
  { session_id: "att-0919", class_id: "cls-mis-a", date: "2026-09-25", name: "Session 7 - MIS Return Walkthrough", present: 6, late: 0, excused: 0, absent: 0 },
  { session_id: "att-0918", class_id: "cls-cmf-b", date: "2026-09-16", name: "Session 11 - Model Bylaws Workshop", present: 9, late: 1, excused: 0, absent: 0 },
  { session_id: "att-0917", class_id: "cls-lcb-c", date: "2026-09-15", name: "Session 9 - Fiduciary Duties", present: 7, late: 0, excused: 0, absent: 0 },
  { session_id: "att-0916", class_id: "cls-bwl-c", date: "2026-09-12", name: "Session 6 - Capital Investment Debate", present: 5, late: 0, excused: 0, absent: 0 },
];

export const portalAttendanceHistory: PortalHistorySession[] = HISTORY_SEEDS.map((h) => {
  const klass = classById(h.class_id);
  const startMinutes =
    Number(klass.start.slice(0, 2)) * 60 + Number(klass.start.slice(3, 5));
  const endMinutes = Number(klass.end.slice(0, 2)) * 60 + Number(klass.end.slice(3, 5));
  const pad = (n: number) => String(n).padStart(2, "0");
  const opensAt = `${h.date}T${pad(Math.floor(startMinutes / 60))}:${pad(startMinutes % 60)}:00Z`;
  const closesAt = `${h.date}T${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}:00Z`;
  const isOpen = h.session_id === "att-0928";
  return {
    session_id: h.session_id,
    class_id: klass.id,
    date: h.date,
    time: `${t12(klass.start)} - ${t12(klass.end)}`,
    name: h.name,
    course: klass.course,
    course_id: klass.course_id,
    batch: klass.batch_label,
    batch_id: klass.batch_id,
    present: h.present,
    late: h.late,
    excused: h.excused,
    absent: h.absent,
    roster: klass.trainees,
    opens_at: isOpen ? "2026-09-28T04:30:00Z" : opensAt,
    closes_at: isOpen ? "2026-09-28T06:00:00Z" : closesAt,
    is_open: isOpen,
    live: isOpen,
  };
}).sort((a, b) => b.date.localeCompare(a.date));

export const LIVE_SESSION_ID = "att-0928";

export function sessionById(id: string | null | undefined): PortalHistorySession {
  return (
    portalAttendanceHistory.find((s) => s.session_id === id) ?? portalAttendanceHistory[0]
  );
}

/* -------------------------------------------------------------------------- */
/* Messages, announcements and recipients                                      */
/* -------------------------------------------------------------------------- */

export interface PortalConversation {
  user_id: string;
  name: string;
  role: string | null;
  batch: string | null;
  batch_id: string | null;
  last_message: string;
  last_subject: string | null;
  last_at: string;
  last_from_me: boolean;
  unread: number;
}

export interface PortalThreadMessage {
  id: string;
  from_me: boolean;
  subject: string | null;
  body: string;
  created_at: string;
  read: boolean;
}

const FACULTY_CONTACTS = [
  { id: "fac-1", name: "Prof. Arvind Joshi", role: "Dean of Academic Affairs" },
  { id: "fac-2", name: "Dr. Sunita Deshmukh", role: "Head of Cooperative Banking" },
  { id: "fac-3", name: "Hostel Warden Office", role: "Campus Administration" },
];

export const portalConversations: PortalConversation[] = [
  {
    user_id: "tr-004",
    name: "Suresh S. Mane",
    role: "Trainee",
    batch: "Batch 2026-B",
    batch_id: "b-2026-b",
    last_message:
      "Madam, I have uploaded the medical certificate for my absence on 24th Sep.",
    last_subject: "Leave justification & assignment submission",
    last_at: "2026-09-28T08:15:00Z",
    last_from_me: false,
    unread: 1,
  },
  {
    user_id: "fac-1",
    name: "Prof. Arvind Joshi",
    role: "Dean of Academic Affairs",
    batch: null,
    batch_id: null,
    last_message: "Faculty meeting scheduled for Thursday 4:00 PM in Conference Room A.",
    last_subject: "Mid-Term Academic Review Meeting",
    last_at: "2026-09-28T09:00:00Z",
    last_from_me: false,
    unread: 1,
  },
  {
    user_id: "tr-001",
    name: "Ashwini Pawar",
    role: "Trainee",
    batch: "Batch 2026-B",
    batch_id: "b-2026-b",
    last_message: "Thank you for the quick clarification! We have updated our slides.",
    last_subject: "Re: Question regarding Module 4 Quorum",
    last_at: "2026-09-27T15:20:00Z",
    last_from_me: false,
    unread: 0,
  },
  {
    user_id: "tr-008",
    name: "Anjali Rathore",
    role: "Trainee",
    batch: "Batch 2026-C",
    batch_id: "b-2026-c",
    last_message: "Can I get an extension of 2 days for the bylaws assignment?",
    last_subject: "Assignment extension request",
    last_at: "2026-09-26T17:30:00Z",
    last_from_me: false,
    unread: 0,
  },
  {
    user_id: "tr-014",
    name: "Sandeep Jadhav",
    role: "Trainee",
    batch: "Batch 2026-C",
    batch_id: "b-2026-c",
    last_message: "I have attached the signed attendance sheet for the field visit.",
    last_subject: "Field visit attendance sheet",
    last_at: "2026-09-26T12:05:00Z",
    last_from_me: true,
    unread: 0,
  },
  {
    user_id: "fac-2",
    name: "Dr. Sunita Deshmukh",
    role: "Head of Cooperative Banking",
    batch: null,
    batch_id: null,
    last_message:
      "Please share the MIS dataset for the reconciliation lab before Friday.",
    last_subject: "Analytics Lab 3 dataset",
    last_at: "2026-09-25T10:40:00Z",
    last_from_me: false,
    unread: 0,
  },
];

export const portalThreads: Record<string, PortalThreadMessage[]> = {
  "tr-001": [
    {
      id: "m-101",
      from_me: false,
      subject: "Question regarding Module 4 Quorum",
      body: "Respected Madam, in our PACS study group we had a doubt whether associate members are counted for the statutory quorum during an AGM.",
      created_at: "2026-09-27T14:15:00Z",
      read: true,
    },
    {
      id: "m-102",
      from_me: true,
      subject: "Re: Question regarding Module 4 Quorum",
      body: "Hello Ashwini, associate members do not carry voting rights and are therefore not counted towards the quorum. Refer to slide 8 of the Module 2 deck.",
      created_at: "2026-09-27T15:00:00Z",
      read: true,
    },
    {
      id: "m-103",
      from_me: false,
      subject: "Thank you Madam",
      body: "Thank you for the quick clarification! We have updated our group presentation slides accordingly.",
      created_at: "2026-09-27T15:20:00Z",
      read: true,
    },
  ],
  "tr-004": [
    {
      id: "m-201",
      from_me: false,
      subject: "Leave justification & assignment submission",
      body: "Respected Madam, I was absent on 24th September due to a viral fever. I have uploaded the medical certificate and my draft audit checklist. Kindly consider my submission.",
      created_at: "2026-09-28T08:15:00Z",
      read: false,
    },
  ],
  "tr-008": [
    {
      id: "m-301",
      from_me: false,
      subject: "Assignment extension request",
      body: "Can I get an extension of 2 days for the bylaws assignment? I have already completed six of the ten checklist items.",
      created_at: "2026-09-26T17:30:00Z",
      read: true,
    },
    {
      id: "m-302",
      from_me: true,
      subject: "Re: Assignment extension request",
      body: "An extension to 3 October is granted for the remaining four items. Please attach the revised draft before the cut-off.",
      created_at: "2026-09-26T18:05:00Z",
      read: true,
    },
  ],
  "fac-1": [
    {
      id: "m-401",
      from_me: false,
      subject: "Mid-Term Academic Review Meeting",
      body: "Dr. Kulkarni, the mid-term academic review is scheduled for Thursday at 4:00 PM in Conference Room A. Please bring the cohort progress sheet and two learner dossiers.",
      created_at: "2026-09-28T09:00:00Z",
      read: false,
    },
  ],
  "fac-2": [
    {
      id: "m-501",
      from_me: false,
      subject: "Analytics Lab 3 dataset",
      body: "Please share the MIS dataset for the reconciliation lab before Friday so that the machines can be loaded.",
      created_at: "2026-09-25T10:40:00Z",
      read: true,
    },
    {
      id: "m-502",
      from_me: true,
      subject: "Re: Analytics Lab 3 dataset",
      body: "The September dataset is uploaded to the shared drive. Rollback files are in the second folder.",
      created_at: "2026-09-25T11:15:00Z",
      read: true,
    },
  ],
  "tr-014": [
    {
      id: "m-601",
      from_me: false,
      subject: "Field visit attendance sheet",
      body: "I have attached the signed attendance sheet for the Warana dairy field visit.",
      created_at: "2026-09-26T11:50:00Z",
      read: true,
    },
    {
      id: "m-602",
      from_me: true,
      subject: "Re: Field visit attendance sheet",
      body: "Received and recorded. Thank you for bringing the original register as well.",
      created_at: "2026-09-26T12:05:00Z",
      read: true,
    },
  ],
};

export function threadFor(userId: string): PortalThreadMessage[] {
  return (
    portalThreads[userId] ??
    portalThreads["tr-001"].map((m, i) => ({
      ...m,
      id: `m-${userId}-${i + 1}`,
      subject: m.subject ? `Re: ${m.subject}` : null,
    }))
  );
}

export interface PortalAnnouncement {
  id: string;
  title: string;
  message: string;
  audience_type: string;
  audience: string;
  status: string;
  created_at: string;
}

export const portalAnnouncements: PortalAnnouncement[] = [
  {
    id: "ann-1",
    title: "Field Visit to Warana Dairy Cooperative",
    message:
      "The bus departs at 7:30 AM from the main institute porch on Friday. Carry your institute ID badge; attendance is compulsory and will be marked.",
    audience_type: "batch",
    audience: "Batch 2026-B",
    status: "published",
    created_at: "2026-09-26T11:00:00Z",
  },
  {
    id: "ann-2",
    title: "Model Bylaws Study Material Uploaded",
    message:
      "The annotated guide for the model bylaws is now available in your content repository under Governance, Boards & Bylaws.",
    audience_type: "all",
    audience: "All Batches",
    status: "published",
    created_at: "2026-09-24T09:30:00Z",
  },
  {
    id: "ann-3",
    title: "Analytics Lab 3 Maintenance Window",
    message:
      "Analytics Lab 3 will be closed for system updates on Saturday between 2:00 PM and 6:00 PM. The MIS practical will shift to Computer Lab 2.",
    audience_type: "batch",
    audience: "Cohort 2026-A",
    status: "published",
    created_at: "2026-09-23T16:00:00Z",
  },
  {
    id: "ann-4",
    title: "Skill Passport Evaluations Due This Week",
    message:
      "Faculty evaluations for the governance and accounting dimensions close on 30 September. Log the ratings from the Skills workspace.",
    audience_type: "all",
    audience: "All Batches",
    status: "published",
    created_at: "2026-09-22T10:15:00Z",
  },
];

export function recipientsList(): {
  id: string;
  name: string;
  role: string;
  batch: string | null;
  batch_id: string | null;
}[] {
  return [
    ...portalTrainees.map((t) => ({
      id: t.id,
      name: t.name,
      role: "Trainee",
      batch: t.batch,
      batch_id: t.batch_id,
    })),
    ...FACULTY_CONTACTS.map((f) => ({ ...f, batch: null, batch_id: null })),
  ];
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                      */
/* -------------------------------------------------------------------------- */

export interface PortalSkill {
  skill_id: string;
  name: string;
  category: string;
  average: number;
  level: string;
  evidence_count: number;
  below_threshold: number;
  trend: { direction: "up" | "down" | "flat"; delta: number };
}

export const portalSkillDimensions = [
  {
    key: "governance",
    label: "Cooperative Governance & Bylaws",
    hint: "Application of Rochdale principles and statutory compliance",
  },
  {
    key: "accounting",
    label: "PACS Accounting & Ledger Verification",
    hint: "Balance sheets, cash daybook and audit trails",
  },
  {
    key: "leadership",
    label: "Meeting Facilitation & Quorum Management",
    hint: "Conducting orderly AGMs and drafting consensus resolutions",
  },
  {
    key: "dispute",
    label: "Member Dispute Resolution",
    hint: "Fair mediation between society members and office bearers",
  },
];

export const portalSkills: PortalSkill[] = [
  {
    skill_id: "skl-gov",
    name: "Cooperative Governance & Bylaws",
    category: "Legal & Regulatory",
    average: 84,
    level: "Proficient",
    evidence_count: 56,
    below_threshold: 2,
    trend: { direction: "up", delta: 4 },
  },
  {
    skill_id: "skl-acc",
    name: "PACS Accounting & Balance Sheet Reconciliation",
    category: "Financial Management",
    average: 78,
    level: "Proficient",
    evidence_count: 52,
    below_threshold: 4,
    trend: { direction: "up", delta: 3 },
  },
  {
    skill_id: "skl-lead",
    name: "Meeting Facilitation & Quorum Management",
    category: "Leadership & Administration",
    average: 88,
    level: "Advanced",
    evidence_count: 68,
    below_threshold: 0,
    trend: { direction: "flat", delta: 0 },
  },
  {
    skill_id: "skl-audit",
    name: "Statutory Audit Verification & Reporting",
    category: "Audit & Oversight",
    average: 76,
    level: "Proficient",
    evidence_count: 44,
    below_threshold: 3,
    trend: { direction: "up", delta: 5 },
  },
  {
    skill_id: "skl-disp",
    name: "Member Dispute & Grievance Redressal",
    category: "Member Relations",
    average: 82,
    level: "Proficient",
    evidence_count: 48,
    below_threshold: 1,
    trend: { direction: "up", delta: 2 },
  },
];
