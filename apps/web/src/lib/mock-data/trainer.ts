/**
 * Trainer workspace demo data.
 *
 * Every value in this file is synthetic sample data written for the CoopSetu AI
 * frontend-first build (SIH 2026, problem statement PS 26087). Names, batches,
 * marks and scan logs are illustrative and are not linked to any real
 * institution, trainer or learner record. Pages surface this with the
 * `.demo-data-tag` class from `globals.css`.
 *
 * The demo "today" is fixed to 28 September 2026 (a Monday) so that every page
 * renders deterministically on the server and the client.
 */

import type { ProgrammeLevel, SkillLevel } from "@/lib/types";

/** Fixed reference day used by every trainer page (Monday, 28 September 2026). */
export const TRAINER_TODAY = "2026-09-28";

export const TRAINER_TODAY_LABEL = "Monday, 28 September 2026";

export const trainerProfile = {
  name: "Dr. Meenal Kulkarni",
  designation: "Faculty - Cooperative Governance & Management",
  institution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
  employeeId: "NCCT-PUNE-4471",
} as const;

/* -------------------------------------------------------------------------- */
/* Classes + weekly timetable                                                  */
/* -------------------------------------------------------------------------- */

export type SessionStatus = "Upcoming" | "In session" | "Completed";

export interface TrainerClass {
  id: string;
  title: string;
  programme: string;
  batch: string;
  level: ProgrammeLevel;
  /** Short weekday codes, e.g. ["Mon", "Wed"]. */
  scheduleDays: string[];
  startTime: string;
  endTime: string;
  room: string;
  enrolled: number;
  capacity: number;
  /** Percentage of the published syllabus already covered. */
  syllabusCovered: number;
  todayStatus: SessionStatus;
  nextSession: string;
}

export const trainerClasses: TrainerClass[] = [
  {
    id: "cls-cmf-b",
    title: "Cooperative Management Fundamentals - Batch B",
    programme: "Cooperative Management Fundamentals",
    batch: "2026-B",
    level: "Foundation",
    scheduleDays: ["Mon", "Wed"],
    startTime: "10:00",
    endTime: "11:30",
    room: "Hall A-204",
    enrolled: 10,
    capacity: 12,
    syllabusCovered: 62,
    todayStatus: "In session",
    nextSession: "Today, 10:00-11:30",
  },
  {
    id: "cls-lcb-c",
    title: "Leadership for Cooperative Board Members - Batch C",
    programme: "Cooperative Management Fundamentals",
    batch: "2026-C",
    level: "Intermediate",
    scheduleDays: ["Tue", "Thu"],
    startTime: "14:00",
    endTime: "15:30",
    room: "Hall B-112",
    enrolled: 7,
    capacity: 10,
    syllabusCovered: 78,
    todayStatus: "Upcoming",
    nextSession: "Tue 29 Sep, 14:00",
  },
  {
    id: "cls-mis-a",
    title: "Credit Society Data & MIS - Cohort 2",
    programme: "Agricultural Credit Cooperative Management",
    batch: "2026-A",
    level: "Advanced",
    scheduleDays: ["Fri"],
    startTime: "11:00",
    endTime: "13:00",
    room: "Analytics Lab 3",
    enrolled: 6,
    capacity: 8,
    syllabusCovered: 41,
    todayStatus: "Upcoming",
    nextSession: "Fri 2 Oct, 11:00",
  },
  {
    id: "cls-bwl-c",
    title: "Board Leadership Weekend Lab",
    programme: "Cooperative Management Fundamentals",
    batch: "2025-C",
    level: "Intermediate",
    scheduleDays: ["Sat"],
    startTime: "09:30",
    endTime: "12:00",
    room: "Computer Lab 2",
    enrolled: 5,
    capacity: 5,
    syllabusCovered: 100,
    todayStatus: "Completed",
    nextSession: "Sat 3 Oct, 09:30",
  },
];

export interface WeeklySession {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  batch: string;
  room: string;
}

export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const weeklySchedule: WeeklySession[] = [
  {
    id: "ws-1",
    day: "Mon",
    startTime: "10:00",
    endTime: "11:30",
    classId: "cls-cmf-b",
    className: "Coop Management Fundamentals",
    batch: "2026-B",
    room: "Hall A-204",
  },
  {
    id: "ws-2",
    day: "Tue",
    startTime: "14:00",
    endTime: "15:30",
    classId: "cls-lcb-c",
    className: "Board Member Leadership",
    batch: "2026-C",
    room: "Hall B-112",
  },
  {
    id: "ws-3",
    day: "Wed",
    startTime: "10:00",
    endTime: "11:30",
    classId: "cls-cmf-b",
    className: "Coop Management Fundamentals",
    batch: "2026-B",
    room: "Hall A-204",
  },
  {
    id: "ws-4",
    day: "Thu",
    startTime: "14:00",
    endTime: "15:30",
    classId: "cls-lcb-c",
    className: "Board Member Leadership",
    batch: "2026-C",
    room: "Hall B-112",
  },
  {
    id: "ws-5",
    day: "Fri",
    startTime: "11:00",
    endTime: "13:00",
    classId: "cls-mis-a",
    className: "Credit Society Data & MIS",
    batch: "2026-A",
    room: "Analytics Lab 3",
  },
  {
    id: "ws-6",
    day: "Sat",
    startTime: "09:30",
    endTime: "12:00",
    classId: "cls-bwl-c",
    className: "Board Leadership Weekend Lab",
    batch: "2025-C",
    room: "Computer Lab 2",
  },
];

/* -------------------------------------------------------------------------- */
/* Attendance                                                                  */
/* -------------------------------------------------------------------------- */

export type AttendanceMethod = "QR" | "Face" | "Manual";
export type SyncStatus = "Synced" | "Queued" | "Pending review";

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  classTitle: string;
  present: number;
  late: number;
  total: number;
  method: AttendanceMethod;
  sync: SyncStatus;
}

export const attendanceHistory: AttendanceRecord[] = [
  {
    id: "att-0928",
    date: "2026-09-28",
    classId: "cls-cmf-b",
    classTitle: "Cooperative Management Fundamentals - Batch B",
    present: 9,
    late: 1,
    total: 10,
    method: "QR",
    sync: "Queued",
  },
  {
    id: "att-0925",
    date: "2026-09-25",
    classId: "cls-bwl-c",
    classTitle: "Board Leadership Weekend Lab",
    present: 5,
    late: 0,
    total: 5,
    method: "Face",
    sync: "Synced",
  },
  {
    id: "att-0924",
    date: "2026-09-24",
    classId: "cls-cmf-b",
    classTitle: "Cooperative Management Fundamentals - Batch B",
    present: 8,
    late: 1,
    total: 10,
    method: "QR",
    sync: "Synced",
  },
  {
    id: "att-0923",
    date: "2026-09-23",
    classId: "cls-mis-a",
    classTitle: "Credit Society Data & MIS - Cohort 2",
    present: 5,
    late: 0,
    total: 6,
    method: "QR",
    sync: "Synced",
  },
  {
    id: "att-0922",
    date: "2026-09-22",
    classId: "cls-lcb-c",
    classTitle: "Leadership for Cooperative Board Members - Batch C",
    present: 6,
    late: 1,
    total: 7,
    method: "Manual",
    sync: "Pending review",
  },
  {
    id: "att-0919",
    date: "2026-09-19",
    classId: "cls-bwl-c",
    classTitle: "Board Leadership Weekend Lab",
    present: 4,
    late: 1,
    total: 5,
    method: "Face",
    sync: "Synced",
  },
  {
    id: "att-0916",
    date: "2026-09-16",
    classId: "cls-cmf-b",
    classTitle: "Cooperative Management Fundamentals - Batch B",
    present: 10,
    late: 0,
    total: 10,
    method: "QR",
    sync: "Synced",
  },
  {
    id: "att-0914",
    date: "2026-09-14",
    classId: "cls-mis-a",
    classTitle: "Credit Society Data & MIS - Cohort 2",
    present: 4,
    late: 1,
    total: 6,
    method: "QR",
    sync: "Synced",
  },
];

/** Aggregate figures for the September 2026 attendance summary cards. */
export const monthAttendanceSummary = {
  monthLabel: "September 2026",
  sessionsHeld: 8,
  sessionsMarked: 8,
  qrSessions: 6,
  faceSessions: 1,
  manualSessions: 1,
  presentHeadcount: 51,
  expectedHeadcount: 54,
  lateArrivals: 5,
} as const;

/* -------------------------------------------------------------------------- */
/* Trainees                                                                    */
/* -------------------------------------------------------------------------- */

export interface TraineeSkill {
  name: string;
  level: SkillLevel;
}

export interface TraineeScore {
  label: string;
  /** Percentage of marks obtained. */
  pct: number;
}

export interface TraineeRecord {
  id: string;
  name: string;
  enrolmentId: string;
  classId: string;
  batch: string;
  district: string;
  /** Attendance percentage over the current term. */
  attendancePct: number;
  /** Mean of all graded assessments, as a percentage. */
  avgScorePct: number;
  /** Last six weeks of attendance, oldest first. */
  attendanceTrend: number[];
  scores: TraineeScore[];
  skills: TraineeSkill[];
  /** Time of the trainee's last QR / face scan for the current session. */
  lastScanAt: string;
  scanMethod: "QR" | "Face" | null;
  /** Plain-language reason, set only when the trainee is flagged at risk. */
  atRiskReason: string | null;
}

export const trainees: TraineeRecord[] = [
  {
    id: "tr-001",
    name: "Ashwini Pawar",
    enrolmentId: "NCCT/2026/B/0142",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Pune",
    attendancePct: 96,
    avgScorePct: 88,
    attendanceTrend: [92, 96, 100, 92, 96, 100],
    scores: [
      { label: "Governance & Bylaws Test", pct: 92 },
      { label: "Member Default-Risk Dashboard", pct: 84 },
    ],
    skills: [
      { name: "Bylaws drafting", level: "Proficient" },
      { name: "Board minute drafting", level: "Intermediate" },
      { name: "Spreadsheets", level: "Foundational" },
    ],
    lastScanAt: "09:57",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-002",
    name: "Rohit Deshmukh",
    enrolmentId: "NCCT/2026/B/0147",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Satara",
    attendancePct: 62,
    avgScorePct: 71,
    attendanceTrend: [78, 71, 64, 58, 54, 46],
    scores: [
      { label: "Governance & Bylaws Test", pct: 68 },
      { label: "Member Default-Risk Dashboard", pct: 74 },
    ],
    skills: [
      { name: "Bylaws drafting", level: "Foundational" },
      { name: "Spreadsheets", level: "Intermediate" },
    ],
    lastScanAt: "10:09",
    scanMethod: "QR",
    atRiskReason:
      "Attendance fell below the 75% attendance requirement in weeks 5 and 6 after two shop-floor job shifts.",
  },
  {
    id: "tr-003",
    name: "Sneha Bhosale",
    enrolmentId: "NCCT/2026/B/0151",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Kolhapur",
    attendancePct: 91,
    avgScorePct: 79,
    attendanceTrend: [88, 92, 86, 94, 90, 92],
    scores: [
      { label: "Governance & Bylaws Test", pct: 84 },
      { label: "Member Default-Risk Dashboard", pct: 74 },
    ],
    skills: [
      { name: "Board minute drafting", level: "Proficient" },
      { name: "Spreadsheets", level: "Intermediate" },
    ],
    lastScanAt: "09:59",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-004",
    name: "Imran Shaikh",
    enrolmentId: "NCCT/2026/B/0155",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Aurangabad",
    attendancePct: 88,
    avgScorePct: 66,
    attendanceTrend: [84, 90, 88, 82, 90, 86],
    scores: [
      { label: "Governance & Bylaws Test", pct: 68 },
      { label: "Member Default-Risk Dashboard", pct: 64 },
    ],
    skills: [
      { name: "Bylaws drafting", level: "Intermediate" },
      { name: "Spreadsheets", level: "Foundational" },
    ],
    lastScanAt: "10:01",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-005",
    name: "Pooja Jadhav",
    enrolmentId: "NCCT/2026/B/0158",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Solapur",
    attendancePct: 84,
    avgScorePct: 73,
    attendanceTrend: [80, 86, 82, 88, 84, 86],
    scores: [
      { label: "Governance & Bylaws Test", pct: 72 },
      { label: "Member Default-Risk Dashboard", pct: 74 },
    ],
    skills: [
      { name: "Board minute drafting", level: "Intermediate" },
      { name: "Spreadsheets", level: "Intermediate" },
    ],
    lastScanAt: "10:04",
    scanMethod: "Face",
    atRiskReason: null,
  },
  {
    id: "tr-006",
    name: "Nikhil Chavan",
    enrolmentId: "NCCT/2026/B/0163",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Pune",
    attendancePct: 94,
    avgScorePct: 91,
    attendanceTrend: [90, 94, 92, 96, 92, 96],
    scores: [
      { label: "Governance & Bylaws Test", pct: 96 },
      { label: "Member Default-Risk Dashboard", pct: 86 },
    ],
    skills: [
      { name: "Bylaws drafting", level: "Expert" },
      { name: "Board minute drafting", level: "Proficient" },
      { name: "Spreadsheets", level: "Proficient" },
    ],
    lastScanAt: "09:58",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-007",
    name: "Divya Rane",
    enrolmentId: "NCCT/2026/B/0167",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Ratnagiri",
    attendancePct: 79,
    avgScorePct: 68,
    attendanceTrend: [86, 82, 80, 78, 74, 72],
    scores: [
      { label: "Governance & Bylaws Test", pct: 68 },
      { label: "Member Default-Risk Dashboard", pct: 68 },
    ],
    skills: [
      { name: "Bylaws drafting", level: "Foundational" },
      { name: "Board minute drafting", level: "Foundational" },
    ],
    lastScanAt: "10:12",
    scanMethod: null,
    atRiskReason: null,
  },
  {
    id: "tr-008",
    name: "Sagar Kadam",
    enrolmentId: "NCCT/2026/B/0171",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Sangli",
    attendancePct: 78,
    avgScorePct: 38,
    attendanceTrend: [82, 84, 78, 80, 76, 72],
    scores: [
      { label: "Governance & Bylaws Test", pct: 44 },
      { label: "Member Default-Risk Dashboard", pct: 32 },
    ],
    skills: [
      { name: "Spreadsheets", level: "Foundational" },
    ],
    lastScanAt: "10:03",
    scanMethod: "QR",
    atRiskReason:
      "Failed the Member Default-Risk module (32%). Re-submission of the project is due with the viva.",
  },
  {
    id: "tr-009",
    name: "Farhan Qureshi",
    enrolmentId: "NCCT/2026/B/0174",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Pune",
    attendancePct: 86,
    avgScorePct: 61,
    attendanceTrend: [80, 88, 84, 90, 86, 88],
    scores: [
      { label: "Governance & Bylaws Test", pct: 64 },
      { label: "Member Default-Risk Dashboard", pct: 58 },
    ],
    skills: [
      { name: "Bylaws drafting", level: "Foundational" },
      { name: "Spreadsheets", level: "Intermediate" },
    ],
    lastScanAt: "10:07",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-010",
    name: "Vaishali Nimbalkar",
    enrolmentId: "NCCT/2026/B/0180",
    classId: "cls-cmf-b",
    batch: "2026-B",
    district: "Ahmednagar",
    attendancePct: 92,
    avgScorePct: 84,
    attendanceTrend: [88, 90, 94, 92, 96, 90],
    scores: [
      { label: "Governance & Bylaws Test", pct: 88 },
      { label: "Member Default-Risk Dashboard", pct: 80 },
    ],
    skills: [
      { name: "Board minute drafting", level: "Proficient" },
      { name: "Spreadsheets", level: "Intermediate" },
    ],
    lastScanAt: "09:56",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-011",
    name: "Mahesh Lokhande",
    enrolmentId: "NCCT/2026/C/0204",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Solapur",
    attendancePct: 89,
    avgScorePct: 81,
    attendanceTrend: [84, 88, 90, 86, 92, 90],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 84 },
      { label: "Governance & Bylaws Test", pct: 78 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Proficient" },
      { name: "Conflict resolution", level: "Intermediate" },
    ],
    lastScanAt: "13:58",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-012",
    name: "Kiran Shinde",
    enrolmentId: "NCCT/2026/C/0208",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Pune",
    attendancePct: 74,
    avgScorePct: 69,
    attendanceTrend: [82, 80, 76, 74, 70, 68],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 72 },
      { label: "Governance & Bylaws Test", pct: 66 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Intermediate" },
      { name: "Conflict resolution", level: "Foundational" },
    ],
    lastScanAt: "14:05",
    scanMethod: "Face",
    atRiskReason: null,
  },
  {
    id: "tr-013",
    name: "Trupti Mahadik",
    enrolmentId: "NCCT/2026/C/0212",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Satara",
    attendancePct: 97,
    avgScorePct: 90,
    attendanceTrend: [94, 96, 100, 96, 98, 96],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 92 },
      { label: "Governance & Bylaws Test", pct: 88 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Expert" },
      { name: "Conflict resolution", level: "Proficient" },
    ],
    lastScanAt: "13:57",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-014",
    name: "Yusuf Ansari",
    enrolmentId: "NCCT/2026/C/0215",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Aurangabad",
    attendancePct: 83,
    avgScorePct: 74,
    attendanceTrend: [86, 84, 82, 80, 84, 82],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 76 },
      { label: "Governance & Bylaws Test", pct: 72 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Intermediate" },
      { name: "Conflict resolution", level: "Intermediate" },
    ],
    lastScanAt: "14:02",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-015",
    name: "Lata Gaikwad",
    enrolmentId: "NCCT/2026/C/0219",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Kolhapur",
    attendancePct: 68,
    avgScorePct: 47,
    attendanceTrend: [76, 72, 68, 64, 60, 56],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 52 },
      { label: "Governance & Bylaws Test", pct: 42 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Foundational" },
    ],
    lastScanAt: "14:11",
    scanMethod: null,
    atRiskReason:
      "Attendance dropped below 75% and the Facilitation Simulation was re-mapped for a re-sit after travel disruption.",
  },
  {
    id: "tr-016",
    name: "Santosh Waghmare",
    enrolmentId: "NCCT/2026/C/0224",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Beed",
    attendancePct: 71,
    avgScorePct: 44,
    attendanceTrend: [80, 78, 74, 70, 66, 62],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 48 },
      { label: "Governance & Bylaws Test", pct: 40 },
    ],
    skills: [
      { name: "Conflict resolution", level: "Foundational" },
    ],
    lastScanAt: "14:08",
    scanMethod: "QR",
    atRiskReason:
      "Below 75% attendance and a failed Governance module (40%). Mentorship pairing is requested.",
  },
  {
    id: "tr-017",
    name: "Aditya More",
    enrolmentId: "NCCT/2026/C/0230",
    classId: "cls-lcb-c",
    batch: "2026-C",
    district: "Pune",
    attendancePct: 85,
    avgScorePct: 78,
    attendanceTrend: [82, 86, 84, 88, 84, 88],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 80 },
      { label: "Governance & Bylaws Test", pct: 76 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Proficient" },
      { name: "Conflict resolution", level: "Intermediate" },
    ],
    lastScanAt: "13:59",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-018",
    name: "Rutuja Sawant",
    enrolmentId: "NCCT/2026/A/0308",
    classId: "cls-mis-a",
    batch: "2026-A",
    district: "Pune",
    attendancePct: 93,
    avgScorePct: 87,
    attendanceTrend: [90, 92, 94, 90, 96, 92],
    scores: [
      { label: "Loan Portfolio Spreadsheet Practical", pct: 88 },
      { label: "Governance & Bylaws Test", pct: 86 },
    ],
    skills: [
      { name: "Spreadsheets", level: "Proficient" },
      { name: "Data analysis", level: "Intermediate" },
    ],
    lastScanAt: "10:58",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-019",
    name: "Harsh Patil",
    enrolmentId: "NCCT/2026/A/0311",
    classId: "cls-mis-a",
    batch: "2026-A",
    district: "Jalgaon",
    attendancePct: 81,
    avgScorePct: 72,
    attendanceTrend: [86, 84, 80, 78, 82, 76],
    scores: [
      { label: "Loan Portfolio Spreadsheet Practical", pct: 74 },
      { label: "Governance & Bylaws Test", pct: 70 },
    ],
    skills: [
      { name: "Spreadsheets", level: "Intermediate" },
      { name: "Data analysis", level: "Foundational" },
    ],
    lastScanAt: "11:03",
    scanMethod: "Face",
    atRiskReason: null,
  },
  {
    id: "tr-020",
    name: "Neha Kale",
    enrolmentId: "NCCT/2026/A/0315",
    classId: "cls-mis-a",
    batch: "2026-A",
    district: "Nashik",
    attendancePct: 76,
    avgScorePct: 65,
    attendanceTrend: [84, 82, 78, 80, 74, 70],
    scores: [
      { label: "Loan Portfolio Spreadsheet Practical", pct: 66 },
      { label: "Governance & Bylaws Test", pct: 64 },
    ],
    skills: [
      { name: "Spreadsheets", level: "Foundational" },
      { name: "Data analysis", level: "Foundational" },
    ],
    lastScanAt: "11:09",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-021",
    name: "Manish Thorat",
    enrolmentId: "NCCT/2026/A/0319",
    classId: "cls-mis-a",
    batch: "2026-A",
    district: "Pune",
    attendancePct: 88,
    avgScorePct: 75,
    attendanceTrend: [86, 90, 86, 88, 90, 88],
    scores: [
      { label: "Loan Portfolio Spreadsheet Practical", pct: 78 },
      { label: "Governance & Bylaws Test", pct: 72 },
    ],
    skills: [
      { name: "Spreadsheets", level: "Proficient" },
      { name: "Data analysis", level: "Intermediate" },
    ],
    lastScanAt: "10:57",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-022",
    name: "Shruti Hande",
    enrolmentId: "NCCT/2026/A/0324",
    classId: "cls-mis-a",
    batch: "2026-A",
    district: "Amravati",
    attendancePct: 90,
    avgScorePct: 82,
    attendanceTrend: [88, 92, 90, 92, 88, 92],
    scores: [
      { label: "Loan Portfolio Spreadsheet Practical", pct: 84 },
      { label: "Governance & Bylaws Test", pct: 80 },
    ],
    skills: [
      { name: "Data analysis", level: "Proficient" },
      { name: "Spreadsheets", level: "Intermediate" },
    ],
    lastScanAt: "10:59",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-023",
    name: "Irfan Sayyed",
    enrolmentId: "NCCT/2026/A/0327",
    classId: "cls-mis-a",
    batch: "2026-A",
    district: "Solapur",
    attendancePct: 72,
    avgScorePct: 41,
    attendanceTrend: [80, 78, 76, 72, 68, 62],
    scores: [
      { label: "Loan Portfolio Spreadsheet Practical", pct: 40 },
      { label: "Governance & Bylaws Test", pct: 42 },
    ],
    skills: [{ name: "Spreadsheets", level: "Foundational" }],
    lastScanAt: "11:14",
    scanMethod: null,
    atRiskReason:
      "Attendance below 75% and a failed Spreadsheet Practical (40%). Paired with a peer mentor for module 2.",
  },
  {
    id: "tr-024",
    name: "Ganesh Bhuse",
    enrolmentId: "NCCT/2025/C/0412",
    classId: "cls-bwl-c",
    batch: "2025-C",
    district: "Osmanabad",
    attendancePct: 68,
    avgScorePct: 35,
    attendanceTrend: [78, 76, 70, 68, 64, 56],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 38 },
      { label: "Governance & Bylaws Test", pct: 32 },
    ],
    skills: [{ name: "Meeting facilitation", level: "Foundational" }],
    lastScanAt: "09:41",
    scanMethod: "Face",
    atRiskReason:
      "Placement was deferred pending a re-sit of both graded modules after prolonged absence during the harvest season.",
  },
  {
    id: "tr-025",
    name: "Priya Salunkhe",
    enrolmentId: "NCCT/2025/C/0416",
    classId: "cls-bwl-c",
    batch: "2025-C",
    district: "Kolhapur",
    attendancePct: 95,
    avgScorePct: 86,
    attendanceTrend: [92, 94, 96, 94, 98, 92],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 88 },
      { label: "Governance & Bylaws Test", pct: 84 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Proficient" },
      { name: "Conflict resolution", level: "Proficient" },
    ],
    lastScanAt: "09:39",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-026",
    name: "Ramesh Yadav",
    enrolmentId: "NCCT/2025/C/0421",
    classId: "cls-bwl-c",
    batch: "2025-C",
    district: "Latur",
    attendancePct: 90,
    avgScorePct: 74,
    attendanceTrend: [88, 92, 86, 90, 92, 92],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 76 },
      { label: "Governance & Bylaws Test", pct: 72 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Intermediate" },
      { name: "Conflict resolution", level: "Intermediate" },
    ],
    lastScanAt: "09:44",
    scanMethod: "QR",
    atRiskReason: null,
  },
  {
    id: "tr-027",
    name: "Komal Phadke",
    enrolmentId: "NCCT/2025/C/0425",
    classId: "cls-bwl-c",
    batch: "2025-C",
    district: "Pune",
    attendancePct: 87,
    avgScorePct: 69,
    attendanceTrend: [84, 88, 86, 84, 90, 88],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 70 },
      { label: "Governance & Bylaws Test", pct: 68 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Intermediate" },
      { name: "Conflict resolution", level: "Foundational" },
    ],
    lastScanAt: "09:47",
    scanMethod: "Face",
    atRiskReason: null,
  },
  {
    id: "tr-028",
    name: "Abhijeet Tambe",
    enrolmentId: "NCCT/2025/C/0430",
    classId: "cls-bwl-c",
    batch: "2025-C",
    district: "Ahmednagar",
    attendancePct: 93,
    avgScorePct: 79,
    attendanceTrend: [90, 92, 94, 90, 96, 92],
    scores: [
      { label: "Meeting Facilitation Simulation", pct: 82 },
      { label: "Governance & Bylaws Test", pct: 76 },
    ],
    skills: [
      { name: "Meeting facilitation", level: "Proficient" },
      { name: "Conflict resolution", level: "Intermediate" },
    ],
    lastScanAt: "09:38",
    scanMethod: "QR",
    atRiskReason: null,
  },
];

/** Attendance below this percentage is treated as a risk flag. */
export const ATTENDANCE_RISK_THRESHOLD = 75;

/** Average assessment score below this percentage counts as a failed module. */
export const SCORE_RISK_THRESHOLD = 40;

/* -------------------------------------------------------------------------- */
/* Assessments + grading queue                                                 */
/* -------------------------------------------------------------------------- */

export type AssessmentType = "Quiz" | "Practical" | "Project" | "Viva";

export type AssessmentStatus = "Published" | "Closed" | "Draft";

export interface AssessmentRecord {
  id: string;
  title: string;
  classId: string;
  classTitle: string;
  type: AssessmentType;
  maxMarks: number;
  passMarks: number;
  dueDate: string;
  status: AssessmentStatus;
  /** Criteria shown in the grading rubric, in rubric order. */
  rubricLabels: string[];
  /** Total expected submissions for the cohort. */
  submissions: number;
  /** Marks already awarded, one entry per graded submission. */
  gradedScores: number[];
}

export const assessmentTypes: AssessmentType[] = ["Quiz", "Practical", "Project", "Viva"];

export const assessments: AssessmentRecord[] = [
  {
    id: "asm-gov-101",
    title: "Governance & Bylaws Proficiency Test",
    classId: "cls-cmf-b",
    classTitle: "Cooperative Management Fundamentals - Batch B",
    type: "Quiz",
    maxMarks: 25,
    passMarks: 12,
    dueDate: "2026-09-24",
    status: "Closed",
    rubricLabels: ["Bylaw accuracy", "Committee quorum rules", "Reasoning"],
    submissions: 10,
    gradedScores: [23, 19, 24, 17, 18, 25, 13, 15, 21, 16],
  },
  {
    id: "asm-risk-proj",
    title: "Member Default-Risk Dashboard",
    classId: "cls-cmf-b",
    classTitle: "Cooperative Management Fundamentals - Batch B",
    type: "Project",
    maxMarks: 40,
    passMarks: 20,
    dueDate: "2026-10-06",
    status: "Published",
    rubricLabels: ["Risk model choice", "Data hygiene", "Board narrative"],
    submissions: 10,
    gradedScores: [34, 29, 37],
  },
  {
    id: "asm-facilitation",
    title: "Meeting Facilitation Simulation",
    classId: "cls-lcb-c",
    classTitle: "Leadership for Cooperative Board Members - Batch C",
    type: "Practical",
    maxMarks: 30,
    passMarks: 18,
    dueDate: "2026-09-18",
    status: "Closed",
    rubricLabels: ["Agenda control", "Handling dissent", "Decision log"],
    submissions: 7,
    gradedScores: [27, 24, 19, 26, 21, 28, 18],
  },
  {
    id: "asm-portfolio",
    title: "Loan Portfolio Spreadsheet Practical",
    classId: "cls-mis-a",
    classTitle: "Credit Society Data & MIS - Cohort 2",
    type: "Practical",
    maxMarks: 25,
    passMarks: 13,
    dueDate: "2026-10-10",
    status: "Published",
    rubricLabels: ["Formula accuracy", "Reconciliation", "Chart hygiene"],
    submissions: 6,
    gradedScores: [22, 17],
  },
  {
    id: "asm-principles-viva",
    title: "Cooperative Principles Viva",
    classId: "cls-cmf-b",
    classTitle: "Cooperative Management Fundamentals - Batch B",
    type: "Viva",
    maxMarks: 20,
    passMarks: 12,
    dueDate: "2026-10-16",
    status: "Published",
    rubricLabels: ["Concept depth", "Local application", "Clarity"],
    submissions: 10,
    gradedScores: [17, 15],
  },
  {
    id: "asm-tally-ledger",
    title: "Tally Double-Entry Ledger Practical",
    classId: "cls-bwl-c",
    classTitle: "Board Leadership Weekend Lab",
    type: "Practical",
    maxMarks: 30,
    passMarks: 15,
    dueDate: "2026-09-12",
    status: "Closed",
    rubricLabels: ["Ledger balance", "Narration quality", "Reconciliation"],
    submissions: 5,
    gradedScores: [28, 24, 19, 26, 17],
  },
];

export interface GradingSubmission {
  id: string;
  assessmentId: string;
  traineeId: string;
  traineeName: string;
  submittedAt: string;
  /** Marks awarded by the trainer; null until the submission is graded. */
  score: number | null;
}

export const gradingQueue: GradingSubmission[] = [
  {
    id: "sub-risk-1",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-001",
    traineeName: "Ashwini Pawar",
    submittedAt: "2026-09-25 18:12",
    score: null,
  },
  {
    id: "sub-risk-2",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-003",
    traineeName: "Sneha Bhosale",
    submittedAt: "2026-09-25 18:40",
    score: null,
  },
  {
    id: "sub-risk-3",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-004",
    traineeName: "Imran Shaikh",
    submittedAt: "2026-09-25 19:05",
    score: null,
  },
  {
    id: "sub-risk-4",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-005",
    traineeName: "Pooja Jadhav",
    submittedAt: "2026-09-26 08:20",
    score: null,
  },
  {
    id: "sub-risk-5",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-006",
    traineeName: "Nikhil Chavan",
    submittedAt: "2026-09-26 08:44",
    score: null,
  },
  {
    id: "sub-risk-6",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-007",
    traineeName: "Divya Rane",
    submittedAt: "2026-09-26 09:02",
    score: null,
  },
  {
    id: "sub-risk-7",
    assessmentId: "asm-risk-proj",
    traineeId: "tr-009",
    traineeName: "Farhan Qureshi",
    submittedAt: "2026-09-26 09:30",
    score: null,
  },
  {
    id: "sub-port-1",
    assessmentId: "asm-portfolio",
    traineeId: "tr-018",
    traineeName: "Rutuja Sawant",
    submittedAt: "2026-09-26 11:10",
    score: null,
  },
  {
    id: "sub-port-2",
    assessmentId: "asm-portfolio",
    traineeId: "tr-019",
    traineeName: "Harsh Patil",
    submittedAt: "2026-09-26 11:26",
    score: null,
  },
  {
    id: "sub-port-3",
    assessmentId: "asm-portfolio",
    traineeId: "tr-020",
    traineeName: "Neha Kale",
    submittedAt: "2026-09-26 12:02",
    score: null,
  },
  {
    id: "sub-port-4",
    assessmentId: "asm-portfolio",
    traineeId: "tr-023",
    traineeName: "Irfan Sayyed",
    submittedAt: "2026-09-26 12:35",
    score: null,
  },
  {
    id: "sub-viva-1",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-002",
    traineeName: "Rohit Deshmukh",
    submittedAt: "2026-09-27 10:15",
    score: null,
  },
  {
    id: "sub-viva-2",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-008",
    traineeName: "Sagar Kadam",
    submittedAt: "2026-09-27 10:32",
    score: null,
  },
  {
    id: "sub-viva-3",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-010",
    traineeName: "Vaishali Nimbalkar",
    submittedAt: "2026-09-27 10:48",
    score: null,
  },
  {
    id: "sub-viva-4",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-007",
    traineeName: "Divya Rane",
    submittedAt: "2026-09-27 11:20",
    score: null,
  },
  {
    id: "sub-viva-5",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-009",
    traineeName: "Farhan Qureshi",
    submittedAt: "2026-09-27 11:44",
    score: null,
  },
  {
    id: "sub-viva-6",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-005",
    traineeName: "Pooja Jadhav",
    submittedAt: "2026-09-27 12:02",
    score: null,
  },
  {
    id: "sub-viva-7",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-001",
    traineeName: "Aditi Sharma",
    submittedAt: "2026-09-27 12:18",
    score: null,
  },
  {
    id: "sub-viva-8",
    assessmentId: "asm-principles-viva",
    traineeId: "tr-003",
    traineeName: "Nikhil Pawar",
    submittedAt: "2026-09-27 12:41",
    score: null,
  },
];

/* -------------------------------------------------------------------------- */
/* Learning content                                                            */
/* -------------------------------------------------------------------------- */

export type LessonType = "Video" | "Reading" | "Quiz" | "Practical" | "Download";
export type OfflinePackState = "ready" | "downloading" | "not-downloaded";
export type LanguageCode = "en" | "hi" | "mr" | "ta" | "gu";

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  /** Short code used in the compact translation matrix. */
  short: string;
}

export const supportedLanguages: LanguageMeta[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "mr", label: "मराठी", short: "MR" },
  { code: "ta", label: "தமிழ்", short: "TA" },
  { code: "gu", label: "ગુજરાતી", short: "GU" },
];

export type LessonLanguages = Record<LanguageCode, boolean>;

export interface ContentLesson {
  id: string;
  title: string;
  type: LessonType;
  durationMin: number;
  published: boolean;
  languages: LessonLanguages;
}

export interface ContentModule {
  id: string;
  title: string;
  summary: string;
  offline: OfflinePackState;
  /** Size of the offline pack in megabytes. */
  offlineSizeMb: number;
  lessons: ContentLesson[];
}

export interface ContentCourse {
  id: string;
  title: string;
  audience: string;
  modules: ContentModule[];
}

const en: LessonLanguages = { en: true, hi: true, mr: true, ta: false, gu: false };
const enMr: LessonLanguages = { en: true, hi: false, mr: true, ta: false, gu: false };
const enMrGu: LessonLanguages = { en: true, hi: false, mr: true, ta: false, gu: true };
const enHiMr: LessonLanguages = { en: true, hi: true, mr: true, ta: false, gu: false };
const enHiMrTa: LessonLanguages = { en: true, hi: true, mr: true, ta: true, gu: false };
const allLanguages: LessonLanguages = { en: true, hi: true, mr: true, ta: true, gu: true };
const enOnly: LessonLanguages = { en: true, hi: false, mr: false, ta: false, gu: false };

export const contentCourses: ContentCourse[] = [
  {
    id: "course-cmf",
    title: "Cooperative Management Fundamentals",
    audience: "Society secretaries and board members, batches 2026-B and 2025-C",
    modules: [
      {
        id: "mod-cmf-1",
        title: "Foundations of the Cooperative Movement",
        summary:
          "Rochdale principles, the 1867 origin story and how Indian societies map to the ICA principles.",
        offline: "ready",
        offlineSizeMb: 84,
        lessons: [
          {
            id: "les-cmf-1-1",
            title: "Why cooperatives exist: the Rochdale principles",
            type: "Video",
            durationMin: 22,
            published: true,
            languages: allLanguages,
          },
          {
            id: "les-cmf-1-2",
            title: "From Rochdale to the Indian cooperative movement",
            type: "Reading",
            durationMin: 15,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-cmf-1-3",
            title: "The seven principles: quick check",
            type: "Quiz",
            durationMin: 10,
            published: true,
            languages: en,
          },
          {
            id: "les-cmf-1-4",
            title: "Case pack: a primary marketing society at work",
            type: "Download",
            durationMin: 8,
            published: true,
            languages: enMrGu,
          },
        ],
      },
      {
        id: "mod-cmf-2",
        title: "Governance, Boards & Bylaws",
        summary: "Board composition, quorum, elections and a clause-by-clause bylaws drafting workshop.",
        offline: "not-downloaded",
        offlineSizeMb: 112,
        lessons: [
          {
            id: "les-cmf-2-1",
            title: "Board composition and reserved matters",
            type: "Video",
            durationMin: 26,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-cmf-2-2",
            title: "Drafting bylaws: clause-by-clause",
            type: "Practical",
            durationMin: 45,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-cmf-2-3",
            title: "Quorum, agenda and minutes",
            type: "Reading",
            durationMin: 18,
            published: true,
            languages: enMr,
          },
          {
            id: "les-cmf-2-4",
            title: "Governance compliance audit walkthrough",
            type: "Download",
            durationMin: 12,
            published: false,
            languages: enOnly,
          },
        ],
      },
      {
        id: "mod-cmf-3",
        title: "Community Enterprise Planning",
        summary: "Feasibility, member capital, and a project note that a society board can actually approve.",
        offline: "not-downloaded",
        offlineSizeMb: 96,
        lessons: [
          {
            id: "les-cmf-3-1",
            title: "Demand assessment in a village cluster",
            type: "Video",
            durationMin: 24,
            published: true,
            languages: enHiMrTa,
          },
          {
            id: "les-cmf-3-2",
            title: "Project note template for the board",
            type: "Download",
            durationMin: 14,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-cmf-3-3",
            title: "Member capital and patronage discipline",
            type: "Quiz",
            durationMin: 12,
            published: false,
            languages: enMr,
          },
        ],
      },
    ],
  },
  {
    id: "course-leadership",
    title: "Leadership for Cooperative Board Members",
    audience: "Elected office bearers, batch 2026-C",
    modules: [
      {
        id: "mod-lead-1",
        title: "Roles, Elections & Succession",
        summary: "What the chair, secretary and treasurer actually own, and how elections stay clean.",
        offline: "ready",
        offlineSizeMb: 68,
        lessons: [
          {
            id: "les-lead-1-1",
            title: "Roles of the office bearers",
            type: "Video",
            durationMin: 20,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-lead-1-2",
            title: "Running a clean election cycle",
            type: "Practical",
            durationMin: 38,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-lead-1-3",
            title: "Succession planning worksheet",
            type: "Download",
            durationMin: 16,
            published: true,
            languages: enHiMrTa,
          },
        ],
      },
      {
        id: "mod-lead-2",
        title: "Conflict Resolution & Collective Decisions",
        summary: "Facilitation practice, dissent handling and consensus voting in a divided boardroom.",
        offline: "not-downloaded",
        offlineSizeMb: 74,
        lessons: [
          {
            id: "les-lead-2-1",
            title: "Facilitating a divided board meeting",
            type: "Video",
            durationMin: 28,
            published: true,
            languages: enHiMr,
          },
          {
            id: "les-lead-2-2",
            title: "Consensus voting mechanics",
            type: "Reading",
            durationMin: 17,
            published: true,
            languages: enMr,
          },
          {
            id: "les-lead-2-3",
            title: "Facilitation simulation rubric",
            type: "Quiz",
            durationMin: 20,
            published: true,
            languages: enHiMr,
          },
        ],
      },
    ],
  },
];
