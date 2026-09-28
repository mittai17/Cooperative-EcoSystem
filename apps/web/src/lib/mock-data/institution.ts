// Seed data for the institution workspace: programme nominations, batches,
// LMS course links, hostel inventory, training logistics and assessments.
//
// Everything in this file is illustrative demo data for the CoopSetu AI
// frontend-first build (SIH 2026, problem statement PS 26087). Nothing here is
// fetched from a backend yet, so the client islands in each institution page
// keep a mutable copy in `useState` and apply edits locally only. Treat every
// export as read-only: pages should spread/derive rather than mutate.

/**
 * Reference "today" for the demo dataset. Overdue checks, approval-time maths
 * and check-in/check-out comparisons resolve against this date so the numbers
 * stay stable regardless of when the build is rendered.
 */
export const INSTITUTION_DEMO_TODAY = "2026-09-27";

/** Calendar month the demo dataset is "currently" in, for month-to-date counts. */
export const INSTITUTION_DEMO_MONTH = "2026-09";

/** Programmes this institution runs, reused by selects and by table columns. */
export const institutionProgrammes = [
  { code: "CMF", title: "Cooperative Management Fundamentals" },
  { code: "CBK", title: "Cooperative Bookkeeping & Statutory Audit Readiness" },
  { code: "DCO", title: "Dairy Cooperative Operations" },
  { code: "ACC", title: "Agricultural Credit Cooperative Management" },
  { code: "HCE", title: "Handloom & Handicraft Cooperative Enterprise" },
] as const;

export type ProgrammeCode = (typeof institutionProgrammes)[number]["code"];

/* -------------------------------------------------------------------------- */
/* Programme nominations                                                       */
/* -------------------------------------------------------------------------- */

export type NominationStatus = "Pending" | "Approved" | "Rejected";

export interface Nomination {
  id: string;
  trainee: string;
  programme: string;
  programmeCode: ProgrammeCode;
  /** ISO date (YYYY-MM-DD) the nominating society submitted the form. */
  submittedOn: string;
  /** ISO date the institution recorded a decision, null while still pending. */
  decidedOn: string | null;
  /** Calendar days between submission and decision. */
  daysToDecide: number | null;
  state: string;
  district: string;
  society: string;
  status: NominationStatus;
  /** Batch the approved trainee was placed in, null until enrolment happens. */
  batchCode: string | null;
}

/** The five-step institutional nomination workflow, rendered as a stepper. */
export const nominationWorkflow: { label: string; description: string }[] = [
  {
    label: "Registered",
    description: "Trainee creates a CoopSetu account and uploads Aadhaar plus bank proof.",
  },
  {
    label: "Nominated",
    description: "A cooperative society submits the nomination form for a seat.",
  },
  {
    label: "Under Review",
    description: "Institution verifies eligibility against society dues and seat availability.",
  },
  {
    label: "Approved",
    description: "Seat is sanctioned and a joining intimation goes to the trainee.",
  },
  {
    label: "Enrolled in Batch",
    description: "Trainee accepts the seat, pays, and is added to a live batch roster.",
  },
];

export const institutionNominationsSeed: Nomination[] = [
  {
    id: "nom-001",
    trainee: "Anjali Rathore",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    submittedOn: "2026-09-20",
    decidedOn: null,
    daysToDecide: null,
    state: "Gujarat",
    district: "Anand",
    society: "Anand Taluka Kisan Sahakari Mandali",
    status: "Pending",
    batchCode: null,
  },
  {
    id: "nom-002",
    trainee: "Vikram Solanki",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    submittedOn: "2026-09-22",
    decidedOn: null,
    daysToDecide: null,
    state: "Gujarat",
    district: "Kheda",
    society: "Kheda District Progressive Dairy Union",
    status: "Pending",
    batchCode: null,
  },
  {
    id: "nom-003",
    trainee: "Farida Khatoon",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    submittedOn: "2026-09-18",
    decidedOn: "2026-09-19",
    daysToDecide: 1,
    state: "Gujarat",
    district: "Panchmahal",
    society: "Halol Cooperative Credit Society",
    status: "Approved",
    batchCode: "IRMA/CMF/2026-B1",
  },
  {
    id: "nom-004",
    trainee: "Deepak Chauhan",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    submittedOn: "2026-09-15",
    decidedOn: "2026-09-16",
    daysToDecide: 1,
    state: "Maharashtra",
    district: "Ahmednagar",
    society: "Ahmednagar District Milk Producers Union",
    status: "Rejected",
    batchCode: null,
  },
  {
    id: "nom-005",
    trainee: "Suresh Prasad Yadav",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    submittedOn: "2026-09-23",
    decidedOn: null,
    daysToDecide: null,
    state: "Uttar Pradesh",
    district: "Varanasi",
    society: "Purvanchal Kisan Credit Cooperative",
    status: "Pending",
    batchCode: null,
  },
  {
    id: "nom-006",
    trainee: "Manisha Bhosale",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    submittedOn: "2026-09-17",
    decidedOn: "2026-09-18",
    daysToDecide: 1,
    state: "Maharashtra",
    district: "Nagpur",
    society: "Nagpur Handloom Weavers Cooperative",
    status: "Approved",
    batchCode: "IRMA/HCE/2026-B1",
  },
  {
    id: "nom-007",
    trainee: "Ramesh Chandra Meena",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    submittedOn: "2026-08-25",
    decidedOn: "2026-08-28",
    daysToDecide: 3,
    state: "Rajasthan",
    district: "Tonk",
    society: "Tonk Consumer Cooperative Society",
    status: "Approved",
    batchCode: "IRMA/CMF/2026-B2",
  },
  {
    id: "nom-008",
    trainee: "Kiran Bai Sahu",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    submittedOn: "2026-09-24",
    decidedOn: null,
    daysToDecide: null,
    state: "Madhya Pradesh",
    district: "Indore",
    society: "Malwa Region Dairy Cooperative",
    status: "Pending",
    batchCode: null,
  },
  {
    id: "nom-009",
    trainee: "Arun Kumar Nayak",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    submittedOn: "2026-08-27",
    decidedOn: "2026-09-01",
    daysToDecide: 5,
    state: "Odisha",
    district: "Cuttack",
    society: "Cuttack Central Cooperative Bank",
    status: "Approved",
    batchCode: "IRMA/CBK/2026-B2",
  },
  {
    id: "nom-010",
    trainee: "Sneha Ashok Pawar",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    submittedOn: "2026-09-19",
    decidedOn: null,
    daysToDecide: null,
    state: "Karnataka",
    district: "Belagavi",
    society: "Belagavi District Primary Agricultural Credit Society",
    status: "Pending",
    batchCode: null,
  },
  {
    id: "nom-011",
    trainee: "Imtiaz Khan",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    submittedOn: "2026-08-29",
    decidedOn: "2026-09-01",
    daysToDecide: 3,
    state: "Uttar Pradesh",
    district: "Bareilly",
    society: "Bareilly District Cooperative Dairy Union",
    status: "Rejected",
    batchCode: null,
  },
  {
    id: "nom-012",
    trainee: "Lakshmi Prasanna",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    submittedOn: "2026-09-25",
    decidedOn: null,
    daysToDecide: null,
    state: "Tamil Nadu",
    district: "Erode",
    society: "Erode Handloom Producers Cooperative",
    status: "Pending",
    batchCode: null,
  },
  {
    id: "nom-013",
    trainee: "Harish Patel",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    submittedOn: "2026-09-21",
    decidedOn: "2026-09-22",
    daysToDecide: 1,
    state: "Gujarat",
    district: "Banaskantha",
    society: "Banaskantha District Sahakari Bank",
    status: "Approved",
    batchCode: null,
  },
  {
    id: "nom-014",
    trainee: "Zubia Sultana",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    submittedOn: "2026-09-26",
    decidedOn: null,
    daysToDecide: null,
    state: "West Bengal",
    district: "Nadia",
    society: "Nadia District Artisans Cooperative",
    status: "Pending",
    batchCode: null,
  },
];

/* -------------------------------------------------------------------------- */
/* Batches                                                                     */
/* -------------------------------------------------------------------------- */

export type BatchStatus = "Upcoming" | "Running" | "Completed";

export interface Batch {
  id: string;
  code: string;
  programme: string;
  programmeCode: ProgrammeCode;
  trainer: string;
  schedule: string;
  venue: string;
  mode: "In-person" | "Blended" | "Online";
  seats: number;
  enrolled: number;
  startDate: string;
  endDate: string;
  status: BatchStatus;
  /** Null until the batch has run at least one session. */
  avgAttendance: number | null;
  avgScore: number | null;
}

export const institutionBatchesSeed: Batch[] = [
  {
    id: "bat-cmf-b1",
    code: "IRMA/CMF/2026-B1",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    trainer: "Dr. Rajesh Sharma",
    schedule: "Mon, Wed, Fri · 10:00 AM – 01:00 PM",
    venue: "Hall A, IRMA Campus",
    mode: "Blended",
    seats: 50,
    enrolled: 47,
    startDate: "2026-07-06",
    endDate: "2026-10-30",
    status: "Running",
    avgAttendance: 92,
    avgScore: 81,
  },
  {
    id: "bat-cbk-b2",
    code: "IRMA/CBK/2026-B2",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    trainer: "Mr. Amit Patel",
    schedule: "Tue, Thu · 02:00 PM – 05:00 PM",
    venue: "Lab 2, Commerce Block",
    mode: "Blended",
    seats: 45,
    enrolled: 45,
    startDate: "2026-08-03",
    endDate: "2026-11-27",
    status: "Running",
    avgAttendance: 88,
    avgScore: 76,
  },
  {
    id: "bat-dco-b1",
    code: "IRMA/DCO/2026-B1",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    trainer: "Ms. Kavita Desai",
    schedule: "Mon – Sat · 09:00 AM – 12:00 PM",
    venue: "Dairy Plant Annexe, Anand",
    mode: "In-person",
    seats: 40,
    enrolled: 40,
    startDate: "2026-09-01",
    endDate: "2026-12-19",
    status: "Running",
    avgAttendance: 95,
    avgScore: 88,
  },
  {
    id: "bat-hce-b1",
    code: "IRMA/HCE/2026-B1",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    trainer: "Dr. Nisha Bhatt",
    schedule: "Sat, Sun · 09:30 AM – 01:30 PM",
    venue: "Weavers' Training Shed, Bhavnagar Road",
    mode: "In-person",
    seats: 35,
    enrolled: 28,
    startDate: "2026-10-12",
    endDate: "2026-12-20",
    status: "Upcoming",
    avgAttendance: null,
    avgScore: null,
  },
  {
    id: "bat-acc-b1",
    code: "IRMA/ACC/2026-B1",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    trainer: "Mr. Sanjay Kulkarni",
    schedule: "Mon – Fri · 11:00 AM – 01:00 PM",
    venue: "Seminar Hall, PACS Wing",
    mode: "Blended",
    seats: 30,
    enrolled: 12,
    startDate: "2026-11-02",
    endDate: "2027-01-30",
    status: "Upcoming",
    avgAttendance: null,
    avgScore: null,
  },
  {
    id: "bat-cmf-b4",
    code: "IRMA/CMF/2025-B4",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    trainer: "Dr. Rajesh Sharma",
    schedule: "Mon, Wed · 10:00 AM – 01:00 PM",
    venue: "Hall B, IRMA Campus",
    mode: "Blended",
    seats: 50,
    enrolled: 50,
    startDate: "2025-11-03",
    endDate: "2026-02-27",
    status: "Completed",
    avgAttendance: 88,
    avgScore: 79,
  },
];

/* -------------------------------------------------------------------------- */
/* LMS course links (Moodle)                                                   */
/* -------------------------------------------------------------------------- */

export type CourseSyncStatus = "Synced" | "Pending sync" | "Sync failed";

export interface LmsCourse {
  id: string;
  title: string;
  mappedProgramme: string;
  programmeCode: ProgrammeCode;
  /** Identifier used by the Moodle web service, not a CoopSetu id. */
  lmsCourseId: string;
  syncStatus: CourseSyncStatus;
  /** ISO date-time of the last successful or attempted pull from Moodle. */
  lastSyncedAt: string | null;
  completionPct: number;
  /** Null until at least one learner has been graded. */
  avgScore: number | null;
  enrolled: number;
  modules: number;
  lessons: number;
  offlineAvailable: boolean;
  offlineSizeMb: number;
}

export const institutionCoursesSeed: LmsCourse[] = [
  {
    id: "crs-gov",
    title: "Cooperative Governance Essentials",
    mappedProgramme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    lmsCourseId: "MOODLE-IRM-1042",
    syncStatus: "Synced",
    lastSyncedAt: "2026-09-26T06:15:00Z",
    completionPct: 71,
    avgScore: 78,
    enrolled: 47,
    modules: 6,
    lessons: 38,
    offlineAvailable: true,
    offlineSizeMb: 142,
  },
  {
    id: "crs-tally",
    title: "Bookkeeping with Tally — Society Ledger",
    mappedProgramme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    lmsCourseId: "MOODLE-IRM-1078",
    syncStatus: "Synced",
    lastSyncedAt: "2026-09-26T06:15:00Z",
    completionPct: 64,
    avgScore: 74,
    enrolled: 45,
    modules: 8,
    lessons: 52,
    offlineAvailable: true,
    offlineSizeMb: 198,
  },
  {
    id: "crs-dairy",
    title: "Dairy Procurement & Cold Chain Basics",
    mappedProgramme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    lmsCourseId: "MOODLE-IRM-1103",
    syncStatus: "Pending sync",
    lastSyncedAt: null,
    completionPct: 58,
    avgScore: 81,
    enrolled: 40,
    modules: 5,
    lessons: 29,
    offlineAvailable: true,
    offlineSizeMb: 96,
  },
  {
    id: "crs-pacs",
    title: "PACS Digitisation & NABARD Compliance",
    mappedProgramme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    lmsCourseId: "MOODLE-IRM-1119",
    syncStatus: "Sync failed",
    lastSyncedAt: "2026-09-20T22:40:00Z",
    completionPct: 12,
    avgScore: null,
    enrolled: 12,
    modules: 7,
    lessons: 44,
    offlineAvailable: false,
    offlineSizeMb: 0,
  },
  {
    id: "crs-handloom",
    title: "Handloom Design & Market Linkages",
    mappedProgramme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    lmsCourseId: "MOODLE-IRM-1126",
    syncStatus: "Synced",
    lastSyncedAt: "2026-09-25T18:05:00Z",
    completionPct: 44,
    avgScore: 69,
    enrolled: 28,
    modules: 4,
    lessons: 21,
    offlineAvailable: true,
    offlineSizeMb: 74,
  },
  {
    id: "crs-icas",
    title: "Cooperative Accounting Standards (ICA 2011)",
    mappedProgramme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    lmsCourseId: "MOODLE-IRM-1131",
    syncStatus: "Pending sync",
    lastSyncedAt: null,
    completionPct: 0,
    avgScore: null,
    enrolled: 0,
    modules: 9,
    lessons: 61,
    offlineAvailable: false,
    offlineSizeMb: 0,
  },
  {
    id: "crs-credit",
    title: "Rural Credit Appraisal Case Studies",
    mappedProgramme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    lmsCourseId: "MOODLE-IRM-1140",
    syncStatus: "Synced",
    lastSyncedAt: "2026-09-24T07:30:00Z",
    completionPct: 33,
    avgScore: 72,
    enrolled: 12,
    modules: 5,
    lessons: 26,
    offlineAvailable: true,
    offlineSizeMb: 88,
  },
];

/* -------------------------------------------------------------------------- */
/* Hostel inventory                                                            */
/* -------------------------------------------------------------------------- */

export type RoomStatus = "Occupied" | "Vacant" | "Maintenance";

export interface HostelRoom {
  id: string;
  /** Human room number, e.g. `A-104`. */
  code: string;
  blockId: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
  occupant: string | null;
  occupantProgramme: string | null;
  checkIn: string | null;
  checkOut: string | null;
  /** Caretaker note, only set for rooms under maintenance. */
  note: string | null;
}

export interface HostelBlock {
  id: string;
  name: string;
  kind: "Boys" | "Girls";
  floors: number[];
}

export interface WaitlistEntry {
  id: string;
  name: string;
  programme: string;
  appliedOn: string;
  daysWaiting: number;
  preference: string;
}

export const hostelBlocks: HostelBlock[] = [
  { id: "A", name: "Nilkanth Boys Hostel", kind: "Boys", floors: [1, 2] },
  { id: "B", name: "Saraswati Girls Hostel", kind: "Girls", floors: [1, 2] },
];

export const hostelRoomsSeed: HostelRoom[] = [
  {
    id: "rm-a-101",
    code: "A-101",
    blockId: "A",
    floor: 1,
    capacity: 3,
    status: "Occupied",
    occupant: "Jignesh Patel",
    occupantProgramme: "Cooperative Management Fundamentals",
    checkIn: "2026-07-05",
    checkOut: "2026-11-01",
    note: null,
  },
  {
    id: "rm-a-102",
    code: "A-102",
    blockId: "A",
    floor: 1,
    capacity: 2,
    status: "Occupied",
    occupant: "Farida Khatoon",
    occupantProgramme: "Cooperative Management Fundamentals",
    checkIn: "2026-07-05",
    checkOut: "2026-11-01",
    note: null,
  },
  {
    id: "rm-a-103",
    code: "A-103",
    blockId: "A",
    floor: 1,
    capacity: 3,
    status: "Occupied",
    occupant: "Rahul Bhatt",
    occupantProgramme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    checkIn: "2026-08-02",
    checkOut: "2026-11-28",
    note: null,
  },
  {
    id: "rm-a-104",
    code: "A-104",
    blockId: "A",
    floor: 1,
    capacity: 2,
    status: "Vacant",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: null,
  },
  {
    id: "rm-a-105",
    code: "A-105",
    blockId: "A",
    floor: 1,
    capacity: 3,
    status: "Occupied",
    occupant: "Nikhil Warrier",
    occupantProgramme: "Dairy Cooperative Operations",
    checkIn: "2026-08-29",
    checkOut: "2026-12-20",
    note: null,
  },
  {
    id: "rm-a-106",
    code: "A-106",
    blockId: "A",
    floor: 1,
    capacity: 2,
    status: "Maintenance",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: "Ceiling seepage — rewiring in progress",
  },
  {
    id: "rm-a-201",
    code: "A-201",
    blockId: "A",
    floor: 2,
    capacity: 2,
    status: "Occupied",
    occupant: "Sneha Ashok Pawar",
    occupantProgramme: "Dairy Cooperative Operations",
    checkIn: "2026-08-29",
    checkOut: "2026-12-20",
    note: null,
  },
  {
    id: "rm-a-202",
    code: "A-202",
    blockId: "A",
    floor: 2,
    capacity: 2,
    status: "Vacant",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: null,
  },
  {
    id: "rm-a-203",
    code: "A-203",
    blockId: "A",
    floor: 2,
    capacity: 3,
    status: "Occupied",
    occupant: "Kiran Bai Sahu",
    occupantProgramme: "Dairy Cooperative Operations",
    checkIn: "2026-08-29",
    checkOut: "2026-12-20",
    note: null,
  },
  {
    id: "rm-a-204",
    code: "A-204",
    blockId: "A",
    floor: 2,
    capacity: 2,
    status: "Occupied",
    occupant: "Manisha Bhosale",
    occupantProgramme: "Handloom & Handicraft Cooperative Enterprise",
    checkIn: "2026-08-30",
    checkOut: "2026-12-20",
    note: null,
  },
  {
    id: "rm-a-205",
    code: "A-205",
    blockId: "A",
    floor: 2,
    capacity: 3,
    status: "Vacant",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: null,
  },
  {
    id: "rm-a-206",
    code: "A-206",
    blockId: "A",
    floor: 2,
    capacity: 2,
    status: "Occupied",
    occupant: "Yashwant Kadam",
    occupantProgramme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    checkIn: "2026-08-02",
    checkOut: "2026-11-28",
    note: null,
  },
  {
    id: "rm-b-101",
    code: "B-101",
    blockId: "B",
    floor: 1,
    capacity: 2,
    status: "Occupied",
    occupant: "Lakshmi Prasanna",
    occupantProgramme: "Cooperative Management Fundamentals",
    checkIn: "2026-08-30",
    checkOut: "2027-01-15",
    note: null,
  },
  {
    id: "rm-b-102",
    code: "B-102",
    blockId: "B",
    floor: 1,
    capacity: 2,
    status: "Occupied",
    occupant: "Zubia Sultana",
    occupantProgramme: "Handloom & Handicraft Cooperative Enterprise",
    checkIn: "2026-08-30",
    checkOut: "2026-12-20",
    note: null,
  },
  {
    id: "rm-b-103",
    code: "B-103",
    blockId: "B",
    floor: 1,
    capacity: 3,
    status: "Vacant",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: null,
  },
  {
    id: "rm-b-104",
    code: "B-104",
    blockId: "B",
    floor: 1,
    capacity: 2,
    status: "Occupied",
    occupant: "Reema Chatterjee",
    occupantProgramme: "Agricultural Credit Cooperative Management",
    checkIn: "2026-08-30",
    checkOut: "2027-01-15",
    note: null,
  },
  {
    id: "rm-b-201",
    code: "B-201",
    blockId: "B",
    floor: 2,
    capacity: 2,
    status: "Occupied",
    occupant: "Ramesh Chandra Meena",
    occupantProgramme: "Cooperative Management Fundamentals",
    checkIn: "2026-08-30",
    checkOut: "2027-01-15",
    note: null,
  },
  {
    id: "rm-b-202",
    code: "B-202",
    blockId: "B",
    floor: 2,
    capacity: 2,
    status: "Occupied",
    occupant: "Arun Kumar Nayak",
    occupantProgramme: "Agricultural Credit Cooperative Management",
    checkIn: "2026-08-30",
    checkOut: "2027-01-15",
    note: null,
  },
  {
    id: "rm-b-203",
    code: "B-203",
    blockId: "B",
    floor: 2,
    capacity: 3,
    status: "Maintenance",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: "Washroom seepage — plumber engaged",
  },
  {
    id: "rm-b-204",
    code: "B-204",
    blockId: "B",
    floor: 2,
    capacity: 2,
    status: "Vacant",
    occupant: null,
    occupantProgramme: null,
    checkIn: null,
    checkOut: null,
    note: null,
  },
];

export const hostelWaitlistSeed: WaitlistEntry[] = [
  {
    id: "wl-001",
    name: "Meenakshi Kumari",
    programme: "Dairy Cooperative Operations",
    appliedOn: "2026-09-18",
    daysWaiting: 9,
    preference: "Single occupancy, Block B only",
  },
  {
    id: "wl-002",
    name: "Suresh Chandra Barma",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    appliedOn: "2026-09-21",
    daysWaiting: 6,
    preference: "Any room, Block B preferred",
  },
  {
    id: "wl-003",
    name: "Anjali Deshmukh",
    programme: "Agricultural Credit Cooperative Management",
    appliedOn: "2026-09-25",
    daysWaiting: 2,
    preference: "Ground floor preferred",
  },
];

/* -------------------------------------------------------------------------- */
/* Training logistics                                                          */
/* -------------------------------------------------------------------------- */

export type LogisticsCategory = "Travel" | "Catering" | "Materials" | "Venue" | "Equipment";

export const logisticsCategories: LogisticsCategory[] = [
  "Travel",
  "Catering",
  "Materials",
  "Venue",
  "Equipment",
];

export interface LogisticsTask {
  id: string;
  title: string;
  category: LogisticsCategory;
  programme: string;
  programmeCode: ProgrammeCode;
  batchCode: string | null;
  dueDate: string;
  owner: string;
  done: boolean;
  /** Indicative cost in INR. Zero for internal, non-procurement tasks. */
  estimatedCost: number;
}

export interface VehicleAllocation {
  id: string;
  vehicleNo: string;
  type: "Mini Bus" | "Tempo Traveller" | "Car";
  seats: number;
  route: string;
  batchCode: string;
  pickUpPoint: string;
  departure: string;
  driver: string;
  driverPhone: string;
  status: "Confirmed" | "Awaiting confirmation";
}

export const logisticsTasksSeed: LogisticsTask[] = [
  {
    id: "lg-01",
    title: "Book two mini buses for the Anand dairy procurement visit",
    category: "Travel",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    batchCode: "IRMA/DCO/2026-B1",
    dueDate: "2026-09-28",
    owner: "Mr. Sanjay Kulkarni",
    done: false,
    estimatedCost: 18000,
  },
  {
    id: "lg-02",
    title: "Arrange lunch for the bookkeeping practical session",
    category: "Catering",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    batchCode: "IRMA/CBK/2026-B2",
    dueDate: "2026-09-29",
    owner: "Ms. Kavita Desai",
    done: false,
    estimatedCost: 9500,
  },
  {
    id: "lg-03",
    title: "Print 200 bilingual trainee handbooks",
    category: "Materials",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    batchCode: "IRMA/CMF/2026-B1",
    dueDate: "2026-09-26",
    owner: "Dr. Nisha Bhatt",
    done: false,
    estimatedCost: 22000,
  },
  {
    id: "lg-04",
    title: "Confirm Hall A availability for the governance workshop",
    category: "Venue",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    batchCode: "IRMA/CMF/2026-B1",
    dueDate: "2026-09-25",
    owner: "Dr. Rajesh Sharma",
    done: true,
    estimatedCost: 4000,
  },
  {
    id: "lg-05",
    title: "Procure 12 milk testing kits for FAT and SNF analysis",
    category: "Equipment",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    batchCode: "IRMA/DCO/2026-B1",
    dueDate: "2026-10-01",
    owner: "Mr. Amit Patel",
    done: false,
    estimatedCost: 74000,
  },
  {
    id: "lg-06",
    title: "Activate 45 Tally Prime licences for the commerce lab",
    category: "Equipment",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    batchCode: "IRMA/CBK/2026-B2",
    dueDate: "2026-09-18",
    owner: "Mr. Amit Patel",
    done: true,
    estimatedCost: 36000,
  },
  {
    id: "lg-07",
    title: "Hire generator backup for the Bhavnagar Road campus",
    category: "Equipment",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    batchCode: "IRMA/HCE/2026-B1",
    dueDate: "2026-10-10",
    owner: "Mr. Sanjay Kulkarni",
    done: false,
    estimatedCost: 15500,
  },
  {
    id: "lg-08",
    title: "Reserve 40 dormitory beds for the rural credit cohort",
    category: "Venue",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    batchCode: "IRMA/ACC/2026-B1",
    dueDate: "2026-10-28",
    owner: "Ms. Kavita Desai",
    done: false,
    estimatedCost: 52000,
  },
  {
    id: "lg-09",
    title: "Run the daily shuttle from Anand railway station to campus",
    category: "Travel",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    batchCode: "IRMA/CMF/2026-B1",
    dueDate: "2026-09-20",
    owner: "Dr. Nisha Bhatt",
    done: true,
    estimatedCost: 12000,
  },
  {
    id: "lg-10",
    title: "Refreshments for the AGM case-study clinic",
    category: "Catering",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    batchCode: "IRMA/CMF/2026-B1",
    dueDate: "2026-09-24",
    owner: "Dr. Rajesh Sharma",
    done: false,
    estimatedCost: 6800,
  },
  {
    id: "lg-11",
    title: "Stationery kits for the rural credit appraisal module",
    category: "Materials",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    batchCode: "IRMA/ACC/2026-B1",
    dueDate: "2026-10-05",
    owner: "Mr. Sanjay Kulkarni",
    done: false,
    estimatedCost: 4300,
  },
  {
    id: "lg-12",
    title: "Pay the deposit for the weavers' training shed",
    category: "Venue",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    batchCode: "IRMA/HCE/2026-B1",
    dueDate: "2026-09-12",
    owner: "Dr. Nisha Bhatt",
    done: true,
    estimatedCost: 25000,
  },
  {
    id: "lg-13",
    title: "Install a projector in the PACS seminar hall",
    category: "Equipment",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    batchCode: "IRMA/ACC/2026-B1",
    dueDate: "2026-09-30",
    owner: "Mr. Amit Patel",
    done: false,
    estimatedCost: 31000,
  },
  {
    id: "lg-14",
    title: "Pull the QR kiosk attendance export for the CMF cohort",
    category: "Materials",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    batchCode: "IRMA/CMF/2026-B1",
    dueDate: "2026-09-27",
    owner: "Dr. Rajesh Sharma",
    done: true,
    estimatedCost: 0,
  },
];

/**
 * Unspent headroom held back from the sanctioned training logistics budget.
 * The page adds this to the sum of every task estimate to derive the total
 * allocation, so the budget cards are never hardcoded away from the rows.
 */
export const logisticsContingencyReserve = 60000;

export const vehicleAllocationsSeed: VehicleAllocation[] = [
  {
    id: "veh-01",
    vehicleNo: "GJ-04-KL-2287",
    type: "Mini Bus",
    seats: 26,
    route: "Anand Railway Station → IRMA Campus",
    batchCode: "IRMA/CMF/2026-B1",
    pickUpPoint: "Anand Railway Station, Platform 4",
    departure: "08:15",
    driver: "Ramesh Bhai Solanki",
    driverPhone: "9825014477",
    status: "Confirmed",
  },
  {
    id: "veh-02",
    vehicleNo: "GJ-18-FG-9012",
    type: "Tempo Traveller",
    seats: 12,
    route: "Kheda → Anand procurement cluster",
    batchCode: "IRMA/DCO/2026-B1",
    pickUpPoint: "Kheda District Dairy Union Gate",
    departure: "07:00",
    driver: "Hitesh Parmar",
    driverPhone: "9879551204",
    status: "Confirmed",
  },
  {
    id: "veh-03",
    vehicleNo: "GJ-01-HD-7734",
    type: "Car",
    seats: 4,
    route: "Pune → Anand (faculty arrival)",
    batchCode: "IRMA/CBK/2026-B2",
    pickUpPoint: "Pune Airport, Terminal 2",
    departure: "13:20",
    driver: "Suresh Jadhav",
    driverPhone: "9922880163",
    status: "Awaiting confirmation",
  },
  {
    id: "veh-04",
    vehicleNo: "GJ-22-BN-5540",
    type: "Mini Bus",
    seats: 26,
    route: "Bhavnagar Road Campus → weavers' cluster",
    batchCode: "IRMA/HCE/2026-B1",
    pickUpPoint: "Bhavnagar Road Campus, Gate 2",
    departure: "09:00",
    driver: "Dilipbhai Zala",
    driverPhone: "9662443091",
    status: "Confirmed",
  },
  {
    id: "veh-05",
    vehicleNo: "GJ-23-CX-1108",
    type: "Tempo Traveller",
    seats: 12,
    route: "Nashik → Anand (credit module cohort)",
    batchCode: "IRMA/ACC/2026-B1",
    pickUpPoint: "Nashik District Central Co-op Bank",
    departure: "06:30",
    driver: "Vijay Shinde",
    driverPhone: "9371226094",
    status: "Awaiting confirmation",
  },
];

/* -------------------------------------------------------------------------- */
/* Assessments                                                                 */
/* -------------------------------------------------------------------------- */

export type AssessmentType = "Quiz" | "Practical" | "Project" | "Viva";
export type AssessmentStatus = "Scheduled" | "Grading" | "Completed";

export interface ScoreBand {
  band: string;
  count: number;
}

export interface AssessmentQuestion {
  id: string;
  label: string;
  maxMarks: number;
  /** Average marks awarded over graded scripts; null while nothing is graded. */
  avgMarks: number | null;
  /** Share of graded scripts clearing half the available marks, in percent. */
  passRatePct: number | null;
}

export interface Assessment {
  id: string;
  title: string;
  /** Linked LMS course title, as returned by the Moodle sync. */
  course: string;
  batchCode: string;
  programme: string;
  programmeCode: ProgrammeCode;
  type: AssessmentType;
  maxMarks: number;
  passMarks: number;
  submissions: number;
  graded: number;
  /** Percentage average over graded scripts, null while nothing is graded. */
  avgScorePct: number | null;
  passRatePct: number | null;
  status: AssessmentStatus;
  dueDate: string;
  /** Score bands in percent; counts cover graded scripts only. */
  bands: ScoreBand[];
  /** Full question set, in paper order. Per-question max marks sum to maxMarks. */
  questions: AssessmentQuestion[];
}

export const institutionAssessmentsSeed: Assessment[] = [
  {
    id: "as-01",
    title: "Governance & Bylaws Proficiency Test",
    course: "Cooperative Governance Essentials",
    batchCode: "IRMA/CMF/2026-B1",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    type: "Quiz",
    maxMarks: 40,
    passMarks: 16,
    submissions: 47,
    graded: 47,
    avgScorePct: 78,
    passRatePct: 92,
    status: "Completed",
    dueDate: "2026-09-05",
    bands: [
      { band: "0-39", count: 1 },
      { band: "40-59", count: 3 },
      { band: "60-74", count: 9 },
      { band: "75-89", count: 22 },
      { band: "90-100", count: 12 },
    ],
    questions: [
      { id: "as-01-q1", label: "Society constitution and its amendments", maxMarks: 10, avgMarks: 8.1, passRatePct: 96 },
      { id: "as-01-q2", label: "Board composition and eligibility norms", maxMarks: 10, avgMarks: 7.4, passRatePct: 91 },
      { id: "as-01-q3", label: "Special audit and surplus disposal rules", maxMarks: 10, avgMarks: 6.9, passRatePct: 83 },
      { id: "as-01-q4", label: "Case study: a 12-year-old society under audit", maxMarks: 10, avgMarks: 7.6, passRatePct: 89 },
    ],
  },
  {
    id: "as-02",
    title: "Meeting Facilitation Simulation",
    course: "Cooperative Governance Essentials",
    batchCode: "IRMA/CMF/2026-B1",
    programme: "Cooperative Management Fundamentals",
    programmeCode: "CMF",
    type: "Practical",
    maxMarks: 50,
    passMarks: 25,
    submissions: 44,
    graded: 30,
    avgScorePct: 69,
    passRatePct: 80,
    status: "Grading",
    dueDate: "2026-09-30",
    bands: [
      { band: "0-39", count: 2 },
      { band: "40-59", count: 4 },
      { band: "60-74", count: 8 },
      { band: "75-89", count: 11 },
      { band: "90-100", count: 5 },
    ],
    questions: [
      { id: "as-02-q1", label: "Opening the meeting and framing the agenda", maxMarks: 10, avgMarks: 7.0, passRatePct: 87 },
      { id: "as-02-q2", label: "Managing a dissenting member's intervention", maxMarks: 15, avgMarks: 9.4, passRatePct: 73 },
      { id: "as-02-q3", label: "Recording resolutions in statutory format", maxMarks: 15, avgMarks: 11.2, passRatePct: 83 },
      { id: "as-02-q4", label: "Closing with follow-up ownership", maxMarks: 10, avgMarks: 6.9, passRatePct: 70 },
    ],
  },
  {
    id: "as-03",
    title: "Society Ledger Practical (Tally)",
    course: "Bookkeeping with Tally — Society Ledger",
    batchCode: "IRMA/CBK/2026-B2",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    type: "Practical",
    maxMarks: 60,
    passMarks: 30,
    submissions: 45,
    graded: 12,
    avgScorePct: 66,
    passRatePct: 67,
    status: "Grading",
    dueDate: "2026-10-02",
    bands: [
      { band: "0-39", count: 1 },
      { band: "40-59", count: 2 },
      { band: "60-74", count: 4 },
      { band: "75-89", count: 4 },
      { band: "90-100", count: 1 },
    ],
    questions: [
      { id: "as-03-q1", label: "Society ledger creation with opening balances", maxMarks: 15, avgMarks: 10.5, passRatePct: 75 },
      { id: "as-03-q2", label: "Receipt, payment and contra vouchers", maxMarks: 15, avgMarks: 9.6, passRatePct: 67 },
      { id: "as-03-q3", label: "Bank reconciliation statement", maxMarks: 15, avgMarks: 9.0, passRatePct: 58 },
      { id: "as-03-q4", label: "Outstanding dues ageing report", maxMarks: 15, avgMarks: 10.5, passRatePct: 67 },
    ],
  },
  {
    id: "as-04",
    title: "Dairy Member Default-Risk Dashboard",
    course: "Dairy Procurement & Cold Chain Basics",
    batchCode: "IRMA/DCO/2026-B1",
    programme: "Dairy Cooperative Operations",
    programmeCode: "DCO",
    type: "Project",
    maxMarks: 100,
    passMarks: 50,
    submissions: 40,
    graded: 9,
    avgScorePct: 71,
    passRatePct: 78,
    status: "Grading",
    dueDate: "2026-10-10",
    bands: [
      { band: "0-39", count: 0 },
      { band: "40-59", count: 1 },
      { band: "60-74", count: 2 },
      { band: "75-89", count: 4 },
      { band: "90-100", count: 2 },
    ],
    questions: [
      { id: "as-04-q1", label: "Data quality of the member default register", maxMarks: 20, avgMarks: 13.2, passRatePct: 78 },
      { id: "as-04-q2", label: "Default probability model and its validation", maxMarks: 25, avgMarks: 16.4, passRatePct: 67 },
      { id: "as-04-q3", label: "Recovery action plan with cost per recovery", maxMarks: 25, avgMarks: 18.1, passRatePct: 78 },
      { id: "as-04-q4", label: "Presentation and stakeholder defence", maxMarks: 30, avgMarks: 23.3, passRatePct: 89 },
    ],
  },
  {
    id: "as-05",
    title: "PACS Compliance Case Viva",
    course: "PACS Digitisation & NABARD Compliance",
    batchCode: "IRMA/ACC/2026-B1",
    programme: "Agricultural Credit Cooperative Management",
    programmeCode: "ACC",
    type: "Viva",
    maxMarks: 30,
    passMarks: 15,
    submissions: 0,
    graded: 0,
    avgScorePct: null,
    passRatePct: null,
    status: "Scheduled",
    dueDate: "2026-11-20",
    bands: [
      { band: "0-39", count: 0 },
      { band: "40-59", count: 0 },
      { band: "60-74", count: 0 },
      { band: "75-89", count: 0 },
      { band: "90-100", count: 0 },
    ],
    questions: [
      { id: "as-05-q1", label: "Regulatory grounding: PACS and model bye-laws", maxMarks: 10, avgMarks: null, passRatePct: null },
      { id: "as-05-q2", label: "Case narration of a live compliance finding", maxMarks: 10, avgMarks: null, passRatePct: null },
      { id: "as-05-q3", label: "Corrective advice and follow-up commitment", maxMarks: 10, avgMarks: null, passRatePct: null },
    ],
  },
  {
    id: "as-06",
    title: "Weavers' Market Linkage Plan",
    course: "Handloom Design & Market Linkages",
    batchCode: "IRMA/HCE/2026-B1",
    programme: "Handloom & Handicraft Cooperative Enterprise",
    programmeCode: "HCE",
    type: "Project",
    maxMarks: 75,
    passMarks: 38,
    submissions: 0,
    graded: 0,
    avgScorePct: null,
    passRatePct: null,
    status: "Scheduled",
    dueDate: "2026-11-28",
    bands: [
      { band: "0-39", count: 0 },
      { band: "40-59", count: 0 },
      { band: "60-74", count: 0 },
      { band: "75-89", count: 0 },
      { band: "90-100", count: 0 },
    ],
    questions: [
      { id: "as-06-q1", label: "Market study and demand estimate", maxMarks: 20, avgMarks: null, passRatePct: null },
      { id: "as-06-q2", label: "Design and costing of the product line", maxMarks: 20, avgMarks: null, passRatePct: null },
      { id: "as-06-q3", label: "Buyer linkage and order-book evidence", maxMarks: 20, avgMarks: null, passRatePct: null },
      { id: "as-06-q4", label: "Cooperative operating plan for the weavers", maxMarks: 15, avgMarks: null, passRatePct: null },
    ],
  },
  {
    id: "as-07",
    title: "Cooperative Accounting Standards Quiz",
    course: "Cooperative Accounting Standards (ICA 2011)",
    batchCode: "IRMA/CBK/2026-B2",
    programme: "Cooperative Bookkeeping & Statutory Audit Readiness",
    programmeCode: "CBK",
    type: "Quiz",
    maxMarks: 25,
    passMarks: 10,
    submissions: 0,
    graded: 0,
    avgScorePct: null,
    passRatePct: null,
    status: "Scheduled",
    dueDate: "2026-10-18",
    bands: [
      { band: "0-39", count: 0 },
      { band: "40-59", count: 0 },
      { band: "60-74", count: 0 },
      { band: "75-89", count: 0 },
      { band: "90-100", count: 0 },
    ],
    questions: [
      { id: "as-07-q1", label: "ICA 2011 provisions applied to a society", maxMarks: 9, avgMarks: null, passRatePct: null },
      { id: "as-07-q2", label: "Classifying member dues and provisions", maxMarks: 8, avgMarks: null, passRatePct: null },
      { id: "as-07-q3", label: "Numerical: depreciation and reserve treatment", maxMarks: 8, avgMarks: null, passRatePct: null },
    ],
  },
];

/**
 * Thresholds a trainee must clear before the certification flow will issue a
 * certificate. Surfaced verbatim on the assessments page so the institution
 * staff know grading is only one of the gates.
 */
export const certificationThresholds: { label: string; rule: string }[] = [
  { label: "Attendance", rule: "Minimum 75% across every mapped session" },
  { label: "Course completion", rule: "Minimum 80% completion on all mapped LMS courses" },
  { label: "Assessment", rule: "At least the pass mark in every graded assessment" },
  { label: "Verification", rule: "Aadhaar, bank proof and society dues check cleared" },
];
