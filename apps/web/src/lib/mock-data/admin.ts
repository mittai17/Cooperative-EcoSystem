import type { ProgrammeLevel, ProgrammeMode } from "@/lib/types";

/**
 * NCCT oversight dataset for the admin console.
 *
 * Every record here is synthetic and created for the Smart India Hackathon
 * prototype. Nothing in this file is sourced from a real trainee, institution,
 * trainer, employer or government scheme, and no figure on an admin screen may
 * be presented as an official statistic.
 */
export const ADMIN_DEMO_TODAY = "2026-09-27";

/* -------------------------------------------------------------------------- */
/* Programme oversight                                                          */
/* -------------------------------------------------------------------------- */

export type ProgrammeHealth = "On track" | "Needs attention" | "At risk";

export interface AdminProgramme {
  id: string;
  name: string;
  sector: string;
  level: ProgrammeLevel;
  mode: ProgrammeMode;
  state: string;
  partnerInstitution: string;
  leadTrainerId: string;
  trainerCount: number;
  cohorts: number;
  durationWeeks: number;
  seats: number;
  enrolled: number;
  completed: number;
  certified: number;
  placed: number;
  attendancePct: number;
  assessmentPct: number;
  budgetLakh: number;
  spentLakh: number;
  health: ProgrammeHealth;
  startedOn: string;
  endsOn: string;
  nextReview: string;
  /** One line the admin can act on, or an empty string when nothing is pending. */
  actionNeeded: string;
}

export const adminProgrammesSeed: AdminProgramme[] = [
  {
    id: "ncct-prog-dairy-ops",
    name: "Dairy Cooperative Operations",
    sector: "Dairy & Agri-processing",
    level: "Intermediate",
    mode: "In-person",
    state: "Gujarat",
    partnerInstitution: "Institute of Rural Management, Anand",
    leadTrainerId: "trn-anita-rathod",
    trainerCount: 4,
    cohorts: 3,
    durationWeeks: 10,
    seats: 120,
    enrolled: 118,
    completed: 104,
    certified: 96,
    placed: 71,
    attendancePct: 91,
    assessmentPct: 78,
    budgetLakh: 96,
    spentLakh: 81,
    health: "On track",
    startedOn: "2026-04-06",
    endsOn: "2026-12-18",
    nextReview: "2026-10-14",
    actionNeeded: "",
  },
  {
    id: "ncct-prog-bookkeeping",
    name: "Cooperative Bookkeeping & Audit Readiness",
    sector: "Finance & Accounts",
    level: "Foundation",
    mode: "Blended",
    state: "Delhi",
    partnerInstitution: "National Cooperative Union of India Training Centre, Delhi",
    leadTrainerId: "trn-rajesh-iyer",
    trainerCount: 5,
    cohorts: 4,
    durationWeeks: 8,
    seats: 200,
    enrolled: 164,
    completed: 138,
    certified: 121,
    placed: 62,
    attendancePct: 84,
    assessmentPct: 71,
    budgetLakh: 74,
    spentLakh: 66,
    health: "Needs attention",
    startedOn: "2026-02-09",
    endsOn: "2026-11-27",
    nextReview: "2026-10-02",
    actionNeeded: "Two trainer contracts expire before the next cohort starts.",
  },
  {
    id: "ncct-prog-digital-marketing",
    name: "Digital Marketing for Cooperatives",
    sector: "Marketing & Sales",
    level: "Intermediate",
    mode: "Online",
    state: "Gujarat",
    partnerInstitution: "Laxmanrao Inamdar National Academy for Cooperative Research, Gandhinagar",
    leadTrainerId: "trn-meera-deshpande",
    trainerCount: 3,
    cohorts: 5,
    durationWeeks: 6,
    seats: 300,
    enrolled: 271,
    completed: 232,
    certified: 214,
    placed: 128,
    attendancePct: 87,
    assessmentPct: 74,
    budgetLakh: 58,
    spentLakh: 51,
    health: "On track",
    startedOn: "2026-01-12",
    endsOn: "2026-12-20",
    nextReview: "2026-10-28",
    actionNeeded: "",
  },
  {
    id: "ncct-prog-fpo-value-chain",
    name: "FPO Value Chain Management",
    sector: "Agri Value Chains",
    level: "Advanced",
    mode: "Blended",
    state: "Maharashtra",
    partnerInstitution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    leadTrainerId: "trn-suresh-kamble",
    trainerCount: 2,
    cohorts: 2,
    durationWeeks: 12,
    seats: 60,
    enrolled: 54,
    completed: 41,
    certified: 33,
    placed: 19,
    attendancePct: 76,
    assessmentPct: 69,
    budgetLakh: 112,
    spentLakh: 98,
    health: "At risk",
    startedOn: "2026-03-02",
    endsOn: "2026-10-30",
    nextReview: "2026-09-30",
    actionNeeded: "Attendance is 14 points below the scheme floor; escalate to the partner institute.",
  },
  {
    id: "ncct-prog-fisheries",
    name: "Fisheries Cooperative Society Management",
    sector: "Fisheries & Aquaculture",
    level: "Intermediate",
    mode: "In-person",
    state: "Maharashtra",
    partnerInstitution: "Central Institute of Fisheries Education Extension Cell, Mumbai",
    leadTrainerId: "trn-anita-rathod",
    trainerCount: 3,
    cohorts: 2,
    durationWeeks: 9,
    seats: 90,
    enrolled: 86,
    completed: 63,
    certified: 55,
    placed: 24,
    attendancePct: 82,
    assessmentPct: 72,
    budgetLakh: 88,
    spentLakh: 74,
    health: "Needs attention",
    startedOn: "2026-05-11",
    endsOn: "2027-01-15",
    nextReview: "2026-10-09",
    actionNeeded: "Cold-chain equipment procurement is pending for the Ratnagiri centre.",
  },
  {
    id: "ncct-prog-handloom",
    name: "Handloom & Handicraft Cooperative Enterprise",
    sector: "Handloom & Handicrafts",
    level: "Foundation",
    mode: "In-person",
    state: "West Bengal",
    partnerInstitution: "National Institute of Fashion Technology, Cooperative Cell, Kolkata",
    leadTrainerId: "trn-indira-sen",
    trainerCount: 3,
    cohorts: 3,
    durationWeeks: 6,
    seats: 150,
    enrolled: 119,
    completed: 97,
    certified: 88,
    placed: 41,
    attendancePct: 88,
    assessmentPct: 70,
    budgetLakh: 64,
    spentLakh: 52,
    health: "On track",
    startedOn: "2026-02-23",
    endsOn: "2026-12-05",
    nextReview: "2026-11-05",
    actionNeeded: "",
  },
  {
    id: "ncct-prog-agri-credit",
    name: "Agricultural Credit Cooperative Management",
    sector: "Rural Finance",
    level: "Advanced",
    mode: "Blended",
    state: "Maharashtra",
    partnerInstitution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    leadTrainerId: "trn-rajesh-iyer",
    trainerCount: 2,
    cohorts: 2,
    durationWeeks: 12,
    seats: 70,
    enrolled: 47,
    completed: 34,
    certified: 26,
    placed: 11,
    attendancePct: 80,
    assessmentPct: 75,
    budgetLakh: 104,
    spentLakh: 71,
    health: "Needs attention",
    startedOn: "2026-06-15",
    endsOn: "2027-02-26",
    nextReview: "2026-10-21",
    actionNeeded: "Placement rate trails the cohort target by 9 points; add two industry partners.",
  },
  {
    id: "ncct-prog-coop-governance",
    name: "Cooperative Management Fundamentals",
    sector: "Cooperative Governance",
    level: "Foundation",
    mode: "Blended",
    state: "Delhi",
    partnerInstitution: "National Cooperative Union of India Training Centre, Delhi",
    leadTrainerId: "trn-indira-sen",
    trainerCount: 4,
    cohorts: 4,
    durationWeeks: 8,
    seats: 240,
    enrolled: 198,
    completed: 171,
    certified: 152,
    placed: 74,
    attendancePct: 86,
    assessmentPct: 73,
    budgetLakh: 70,
    spentLakh: 61,
    health: "On track",
    startedOn: "2026-01-05",
    endsOn: "2026-12-12",
    nextReview: "2026-10-30",
    actionNeeded: "",
  },
  {
    id: "ncct-prog-quality-testing",
    name: "Quality Testing & Lab Compliance for Cooperatives",
    sector: "Quality & Compliance",
    level: "Intermediate",
    mode: "In-person",
    state: "Karnataka",
    partnerInstitution: "National Dairy Development Board Training Centre, Bengaluru",
    leadTrainerId: "trn-vikram-nair",
    trainerCount: 3,
    cohorts: 2,
    durationWeeks: 10,
    seats: 90,
    enrolled: 88,
    completed: 51,
    certified: 44,
    placed: 27,
    attendancePct: 85,
    assessmentPct: 77,
    budgetLakh: 92,
    spentLakh: 61,
    health: "On track",
    startedOn: "2026-04-20",
    endsOn: "2027-01-08",
    nextReview: "2026-10-16",
    actionNeeded: "",
  },
  {
    id: "ncct-prog-logistics",
    name: "Rural Logistics & Route Planning",
    sector: "Logistics & Supply Chain",
    level: "Intermediate",
    mode: "Blended",
    state: "Madhya Pradesh",
    partnerInstitution: "Central Institute of Transport, Cooperative Wing, Bhopal",
    leadTrainerId: "trn-suresh-kamble",
    trainerCount: 2,
    cohorts: 2,
    durationWeeks: 9,
    seats: 80,
    enrolled: 62,
    completed: 38,
    certified: 30,
    placed: 14,
    attendancePct: 74,
    assessmentPct: 66,
    budgetLakh: 78,
    spentLakh: 69,
    health: "At risk",
    startedOn: "2026-07-06",
    endsOn: "2027-03-12",
    nextReview: "2026-10-01",
    actionNeeded: "Only 74% of seats are filled and the assessment average is below 70%.",
  },
  {
    id: "ncct-prog-retail-ops",
    name: "Retail Store Operations for Cooperative Brands",
    sector: "Marketing & Sales",
    level: "Foundation",
    mode: "In-person",
    state: "Gujarat",
    partnerInstitution: "Laxmanrao Inamdar National Academy for Cooperative Research, Gandhinagar",
    leadTrainerId: "trn-meera-deshpande",
    trainerCount: 3,
    cohorts: 3,
    durationWeeks: 6,
    seats: 180,
    enrolled: 141,
    completed: 112,
    certified: 99,
    placed: 57,
    attendancePct: 83,
    assessmentPct: 68,
    budgetLakh: 54,
    spentLakh: 43,
    health: "On track",
    startedOn: "2026-03-16",
    endsOn: "2026-12-19",
    nextReview: "2026-11-19",
    actionNeeded: "",
  },
  {
    id: "ncct-prog-mis-analytics",
    name: "MIS & Cooperative Data Analytics",
    sector: "Data & Analytics",
    level: "Advanced",
    mode: "Online",
    state: "Delhi",
    partnerInstitution: "National Cooperative Union of India Training Centre, Delhi",
    leadTrainerId: "trn-vikram-nair",
    trainerCount: 2,
    cohorts: 1,
    durationWeeks: 14,
    seats: 60,
    enrolled: 38,
    completed: 0,
    certified: 0,
    placed: 0,
    attendancePct: 79,
    assessmentPct: 73,
    budgetLakh: 46,
    spentLakh: 21,
    health: "On track",
    startedOn: "2026-08-03",
    endsOn: "2027-04-16",
    nextReview: "2026-10-23",
    actionNeeded: "",
  },
];

/* -------------------------------------------------------------------------- */
/* Trainer registry                                                            */
/* -------------------------------------------------------------------------- */

export type TrainerStatus = "Active" | "On leave" | "Pending approval";

export interface AdminTrainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  specialisms: string[];
  programmeIds: string[];
  traineesAssigned: number;
  capacity: number;
  trainingsDelivered: number;
  averageAssessmentPct: number;
  rating: number;
  certifications: string[];
  status: TrainerStatus;
  lastActivity: string;
}

export const adminTrainersSeed: AdminTrainer[] = [
  {
    id: "trn-anita-rathod",
    name: "Anita Rathod",
    email: "anita.rathod@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Gujarat",
    district: "Anand",
    specialisms: ["Dairy Operations", "Quality Testing", "Cold Chain"],
    programmeIds: ["ncct-prog-dairy-ops", "ncct-prog-fisheries"],
    traineesAssigned: 96,
    capacity: 110,
    trainingsDelivered: 184,
    averageAssessmentPct: 82,
    rating: 4.7,
    certifications: ["NCCT Trainer Level II", "Dairy Plant Hygiene Auditor"],
    status: "Active",
    lastActivity: "2026-09-25",
  },
  {
    id: "trn-rajesh-iyer",
    name: "Rajesh Iyer",
    email: "rajesh.iyer@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Delhi",
    district: "South Delhi",
    specialisms: ["Bookkeeping", "Tally", "Statutory Compliance", "NABARD Compliance"],
    programmeIds: ["ncct-prog-bookkeeping", "ncct-prog-agri-credit"],
    traineesAssigned: 88,
    capacity: 90,
    trainingsDelivered: 231,
    averageAssessmentPct: 79,
    rating: 4.5,
    certifications: ["NCCT Trainer Level I", "Chartered Accountant (Audit)"],
    status: "Active",
    lastActivity: "2026-09-26",
  },
  {
    id: "trn-meera-deshpande",
    name: "Meera Deshpande",
    email: "meera.deshpande@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Maharashtra",
    district: "Pune",
    specialisms: ["Digital Marketing", "Retail Operations", "E-commerce"],
    programmeIds: ["ncct-prog-digital-marketing", "ncct-prog-retail-ops"],
    traineesAssigned: 74,
    capacity: 120,
    trainingsDelivered: 156,
    averageAssessmentPct: 74,
    rating: 4.3,
    certifications: ["NCCT Trainer Level II", "Digital Marketing Fellowship"],
    status: "Active",
    lastActivity: "2026-09-24",
  },
  {
    id: "trn-suresh-kamble",
    name: "Suresh Kamble",
    email: "suresh.kamble@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Maharashtra",
    district: "Pune",
    specialisms: ["FPO Value Chains", "Logistics Planning", "Route Economics"],
    programmeIds: ["ncct-prog-fpo-value-chain", "ncct-prog-logistics"],
    traineesAssigned: 71,
    capacity: 75,
    trainingsDelivered: 143,
    averageAssessmentPct: 71,
    rating: 4.1,
    certifications: ["NCCT Trainer Level I", "Supply Chain Analytics"],
    status: "On leave",
    lastActivity: "2026-09-11",
  },
  {
    id: "trn-indira-sen",
    name: "Indira Sen",
    email: "indira.sen@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "West Bengal",
    district: "Kolkata",
    specialisms: ["Cooperative Governance", "Handloom Operations", "Member Relations"],
    programmeIds: ["ncct-prog-coop-governance", "ncct-prog-handloom"],
    traineesAssigned: 82,
    capacity: 95,
    trainingsDelivered: 198,
    averageAssessmentPct: 76,
    rating: 4.6,
    certifications: ["NCCT Trainer Level II", "Cooperative Governance Fellow"],
    status: "Active",
    lastActivity: "2026-09-26",
  },
  {
    id: "trn-vikram-nair",
    name: "Vikram Nair",
    email: "vikram.nair@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Karnataka",
    district: "Bengaluru Urban",
    specialisms: ["Quality Testing", "Data Analysis", "Dashboarding", "Spreadsheets"],
    programmeIds: ["ncct-prog-quality-testing", "ncct-prog-mis-analytics"],
    traineesAssigned: 58,
    capacity: 80,
    trainingsDelivered: 87,
    averageAssessmentPct: 83,
    rating: 4.4,
    certifications: ["NCCT Trainer Level I", "Six Sigma Green Belt", "Lab Quality Auditor"],
    status: "Active",
    lastActivity: "2026-09-25",
  },
  {
    id: "trn-harpreet-singh",
    name: "Harpreet Singh",
    email: "harpreet.singh@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Punjab",
    district: "Ludhiana",
    specialisms: ["Dairy Operations", "Retail Operations"],
    programmeIds: [],
    traineesAssigned: 0,
    capacity: 40,
    trainingsDelivered: 12,
    averageAssessmentPct: 69,
    rating: 3.9,
    certifications: ["NCCT Trainer Level I"],
    status: "Pending approval",
    lastActivity: "2026-09-19",
  },
  {
    id: "trn-lata-bhattacharya",
    name: "Lata Bhattacharya",
    email: "lata.bhattacharya@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "West Bengal",
    district: "Kolkata",
    specialisms: ["Bookkeeping", "Statutory Compliance"],
    programmeIds: [],
    traineesAssigned: 0,
    capacity: 35,
    trainingsDelivered: 5,
    averageAssessmentPct: 72,
    rating: 0,
    certifications: ["NCCT Trainer Level I"],
    status: "Pending approval",
    lastActivity: "2026-09-22",
  },
  {
    id: "trn-imran-qureshi",
    name: "Imran Qureshi",
    email: "imran.qureshi@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Uttar Pradesh",
    district: "Lucknow",
    specialisms: ["Fisheries & Aquaculture", "Cold Chain"],
    programmeIds: [],
    traineesAssigned: 0,
    capacity: 45,
    trainingsDelivered: 21,
    averageAssessmentPct: 68,
    rating: 3.8,
    certifications: ["NCCT Trainer Level I", "Aquaculture Extension"],
    status: "On leave",
    lastActivity: "2026-08-30",
  },
  {
    id: "trn-kavya-reddy",
    name: "Kavya Reddy",
    email: "kavya.reddy@example.invalid",
    phone: "+91 98xxx xxxxx",
    state: "Telangana",
    district: "Hyderabad",
    specialisms: ["Data Analysis", "Dashboarding"],
    programmeIds: [],
    traineesAssigned: 0,
    capacity: 30,
    trainingsDelivered: 9,
    averageAssessmentPct: 78,
    rating: 4,
    certifications: ["NCCT Trainer Level I", "Power BI Certified"],
    status: "Active",
    lastActivity: "2026-09-23",
  },
];

/* -------------------------------------------------------------------------- */
/* National trainee registry                                                   */
/* -------------------------------------------------------------------------- */

export type TraineeStage =
  | "Enrolled"
  | "Training"
  | "Assessed"
  | "Certified"
  | "Job matched"
  | "Employed";

export const TRAINEE_STAGES: TraineeStage[] = [
  "Enrolled",
  "Training",
  "Assessed",
  "Certified",
  "Job matched",
  "Employed",
];

export type SocialCategory = "SC" | "ST" | "OBC" | "General";
export type TraineeRisk = "On track" | "Watch" | "Support needed";

export interface AdminTrainee {
  id: string;
  passportId: string;
  name: string;
  state: string;
  district: string;
  gender: "Female" | "Male" | "Other";
  age: number;
  category: SocialCategory;
  programmeId: string;
  institution: string;
  enrolledOn: string;
  attendancePct: number;
  coursesCompleted: number;
  assessmentPct: number;
  verifiedSkills: string[];
  stage: TraineeStage;
  placedWith: string | null;
  risk: TraineeRisk;
}

export const adminTraineesSeed: AdminTrainee[] = [
  {
    id: "trn-rec-001",
    passportId: "SP-GJ-2026-004821",
    name: "Ravindra Suresh Patil",
    state: "Gujarat",
    district: "Anand",
    gender: "Male",
    age: 29,
    category: "OBC",
    programmeId: "ncct-prog-dairy-ops",
    institution: "Institute of Rural Management, Anand",
    enrolledOn: "2026-04-13",
    attendancePct: 95,
    coursesCompleted: 11,
    assessmentPct: 88,
    verifiedSkills: ["Dairy Operations", "Quality Testing", "Logistics Planning", "Route Economics"],
    stage: "Employed",
    placedWith: "Anand District Milk Producers Cooperative Union",
    risk: "On track",
  },
  {
    id: "trn-rec-002",
    passportId: "SP-GJ-2026-005190",
    name: "Meenakshi Ramesh Deshmukh",
    state: "Gujarat",
    district: "Anand",
    gender: "Female",
    age: 24,
    category: "OBC",
    programmeId: "ncct-prog-dairy-ops",
    institution: "Institute of Rural Management, Anand",
    enrolledOn: "2026-04-13",
    attendancePct: 94,
    coursesCompleted: 12,
    assessmentPct: 85,
    verifiedSkills: ["Dairy Operations", "Quality Testing", "Documentation", "Six Sigma Basics"],
    stage: "Job matched",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-003",
    passportId: "SP-UP-2026-007733",
    name: "Sunita Devi Yadav",
    state: "Uttar Pradesh",
    district: "Lucknow",
    gender: "Female",
    age: 27,
    category: "SC",
    programmeId: "ncct-prog-quality-testing",
    institution: "Central Institute of Horticulture Extension Cell, Lucknow",
    enrolledOn: "2026-04-27",
    attendancePct: 92,
    coursesCompleted: 10,
    assessmentPct: 81,
    verifiedSkills: ["Quality Testing", "Documentation", "Data Analysis"],
    stage: "Certified",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-004",
    passportId: "SP-MH-2026-009014",
    name: "Imran Mohammad Sheikh",
    state: "Maharashtra",
    district: "Nagpur",
    gender: "Male",
    age: 31,
    category: "OBC",
    programmeId: "ncct-prog-fpo-value-chain",
    institution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    enrolledOn: "2026-03-09",
    attendancePct: 71,
    coursesCompleted: 7,
    assessmentPct: 62,
    verifiedSkills: ["FPO Operations", "Route Economics"],
    stage: "Training",
    placedWith: null,
    risk: "Support needed",
  },
  {
    id: "trn-rec-005",
    passportId: "SP-KA-2026-003388",
    name: "Farida Khatoon",
    state: "Karnataka",
    district: "Bengaluru Urban",
    gender: "Female",
    age: 22,
    category: "OBC",
    programmeId: "ncct-prog-mis-analytics",
    institution: "Janaki Tech Extension Centre, Bengaluru",
    enrolledOn: "2026-08-10",
    attendancePct: 88,
    coursesCompleted: 4,
    assessmentPct: 76,
    verifiedSkills: ["Spreadsheets", "Data Analysis", "Dashboarding"],
    stage: "Assessed",
    placedWith: null,
    risk: "Watch",
  },
  {
    id: "trn-rec-006",
    passportId: "SP-GJ-2026-002755",
    name: "Vikram Solanki",
    state: "Gujarat",
    district: "Vadodara",
    gender: "Male",
    age: 26,
    category: "SC",
    programmeId: "ncct-prog-retail-ops",
    institution: "Laxmanrao Inamdar National Academy for Cooperative Research, Gandhinagar",
    enrolledOn: "2026-03-23",
    attendancePct: 79,
    coursesCompleted: 6,
    assessmentPct: 64,
    verifiedSkills: ["Retail Operations", "Spreadsheets"],
    stage: "Training",
    placedWith: null,
    risk: "Watch",
  },
  {
    id: "trn-rec-007",
    passportId: "SP-WB-2026-006612",
    name: "Asima Khatun",
    state: "West Bengal",
    district: "Murshidabad",
    gender: "Female",
    age: 25,
    category: "OBC",
    programmeId: "ncct-prog-handloom",
    institution: "National Institute of Fashion Technology, Cooperative Cell, Kolkata",
    enrolledOn: "2026-02-27",
    attendancePct: 90,
    coursesCompleted: 9,
    assessmentPct: 74,
    verifiedSkills: ["Handloom Operations", "Digital Marketing", "E-commerce"],
    stage: "Employed",
    placedWith: "Bengal Handloom Weavers Cooperative Society",
    risk: "On track",
  },
  {
    id: "trn-rec-008",
    passportId: "SP-DL-2026-001148",
    name: "Prakash Verma",
    state: "Delhi",
    district: "East Delhi",
    gender: "Male",
    age: 34,
    category: "General",
    programmeId: "ncct-prog-bookkeeping",
    institution: "National Cooperative Union of India Training Centre, Delhi",
    enrolledOn: "2026-02-16",
    attendancePct: 83,
    coursesCompleted: 8,
    assessmentPct: 72,
    verifiedSkills: ["Bookkeeping", "Tally", "Statutory Compliance"],
    stage: "Employed",
    placedWith: "Delhi Central Cooperative Credit Society",
    risk: "On track",
  },
  {
    id: "trn-rec-009",
    passportId: "SP-MH-2026-008477",
    name: "Sonal Jagdish Pawar",
    state: "Maharashtra",
    district: "Nashik",
    gender: "Female",
    age: 23,
    category: "ST",
    programmeId: "ncct-prog-digital-marketing",
    institution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    enrolledOn: "2026-01-19",
    attendancePct: 86,
    coursesCompleted: 11,
    assessmentPct: 73,
    verifiedSkills: ["Digital Marketing", "E-commerce", "Customer Relations"],
    stage: "Job matched",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-010",
    passportId: "MP-2026-001129",
    name: "Devendra Chouhan",
    state: "Madhya Pradesh",
    district: "Indore",
    gender: "Male",
    age: 28,
    category: "OBC",
    programmeId: "ncct-prog-logistics",
    institution: "Central Institute of Transport, Cooperative Wing, Bhopal",
    enrolledOn: "2026-07-13",
    attendancePct: 69,
    coursesCompleted: 3,
    assessmentPct: 61,
    verifiedSkills: ["Logistics Planning"],
    stage: "Enrolled",
    placedWith: null,
    risk: "Support needed",
  },
  {
    id: "trn-rec-011",
    passportId: "SP-GJ-2026-007321",
    name: "Bhavesh Gohil",
    state: "Gujarat",
    district: "Rajkot",
    gender: "Male",
    age: 30,
    category: "OBC",
    programmeId: "ncct-prog-dairy-ops",
    institution: "Institute of Rural Management, Anand",
    enrolledOn: "2026-04-13",
    attendancePct: 89,
    coursesCompleted: 10,
    assessmentPct: 79,
    verifiedSkills: ["Dairy Operations", "Quality Testing", "Cold Chain"],
    stage: "Certified",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-012",
    passportId: "SP-KA-2026-010244",
    name: "Lakshmi Narayan Gowda",
    state: "Karnataka",
    district: "Mysuru",
    gender: "Male",
    age: 36,
    category: "General",
    programmeId: "ncct-prog-quality-testing",
    institution: "National Dairy Development Board Training Centre, Bengaluru",
    enrolledOn: "2026-04-27",
    attendancePct: 85,
    coursesCompleted: 8,
    assessmentPct: 80,
    verifiedSkills: ["Quality Testing", "Documentation", "Lab Safety"],
    stage: "Employed",
    placedWith: "Mysuru District Milk Producers Cooperative",
    risk: "On track",
  },
  {
    id: "trn-rec-013",
    passportId: "SP-WB-2026-004503",
    name: "Ruma Chatterjee",
    state: "West Bengal",
    district: "Howrah",
    gender: "Female",
    age: 27,
    category: "General",
    programmeId: "ncct-prog-coop-governance",
    institution: "National Institute of Fashion Technology, Cooperative Cell, Kolkata",
    enrolledOn: "2026-01-12",
    attendancePct: 87,
    coursesCompleted: 12,
    assessmentPct: 71,
    verifiedSkills: ["Cooperative Governance", "Member Relations", "Documentation"],
    stage: "Certified",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-014",
    passportId: "SP-MH-2026-011903",
    name: "Nitin Sitaram Jadhav",
    state: "Maharashtra",
    district: "Solapur",
    gender: "Male",
    age: 33,
    category: "SC",
    programmeId: "ncct-prog-fpo-value-chain",
    institution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    enrolledOn: "2026-03-09",
    attendancePct: 74,
    coursesCompleted: 6,
    assessmentPct: 66,
    verifiedSkills: ["FPO Operations", "Spreadsheets"],
    stage: "Training",
    placedWith: null,
    risk: "Watch",
  },
  {
    id: "trn-rec-015",
    passportId: "SP-GJ-2026-009655",
    name: "Kavita Ramesh Patel",
    state: "Gujarat",
    district: "Anand",
    gender: "Female",
    age: 26,
    category: "OBC",
    programmeId: "ncct-prog-digital-marketing",
    institution: "Laxmanrao Inamdar National Academy for Cooperative Research, Gandhinagar",
    enrolledOn: "2026-01-19",
    attendancePct: 91,
    coursesCompleted: 11,
    assessmentPct: 76,
    verifiedSkills: ["Digital Marketing", "Customer Relations", "E-commerce"],
    stage: "Employed",
    placedWith: "Sabarmati Consumer Cooperative Store, Ahmedabad",
    risk: "On track",
  },
  {
    id: "trn-rec-016",
    passportId: "SP-KA-2026-012240",
    name: "Ashwin Basavaraj Patil",
    state: "Karnataka",
    district: "Belagavi",
    gender: "Male",
    age: 21,
    category: "OBC",
    programmeId: "ncct-prog-mis-analytics",
    institution: "Janaki Tech Extension Centre, Bengaluru",
    enrolledOn: "2026-08-10",
    attendancePct: 82,
    coursesCompleted: 3,
    assessmentPct: 69,
    verifiedSkills: ["Spreadsheets"],
    stage: "Assessed",
    placedWith: null,
    risk: "Watch",
  },
  {
    id: "trn-rec-017",
    passportId: "SP-UP-2026-013876",
    name: "Salim Hasan Ansari",
    state: "Uttar Pradesh",
    district: "Gorakhpur",
    gender: "Male",
    age: 24,
    category: "OBC",
    programmeId: "ncct-prog-logistics",
    institution: "Central Institute of Transport, Cooperative Wing, Bhopal",
    enrolledOn: "2026-07-13",
    attendancePct: 66,
    coursesCompleted: 2,
    assessmentPct: 58,
    verifiedSkills: [],
    stage: "Enrolled",
    placedWith: null,
    risk: "Support needed",
  },
  {
    id: "trn-rec-018",
    passportId: "SP-GJ-2026-014301",
    name: "Harsh Dhirajlal Solanki",
    state: "Gujarat",
    district: "Surat",
    gender: "Male",
    age: 32,
    category: "General",
    programmeId: "ncct-prog-retail-ops",
    institution: "Laxmanrao Inamdar National Academy for Cooperative Research, Gandhinagar",
    enrolledOn: "2026-03-23",
    attendancePct: 77,
    coursesCompleted: 5,
    assessmentPct: 63,
    verifiedSkills: ["Retail Operations", "Spreadsheets"],
    stage: "Training",
    placedWith: null,
    risk: "Watch",
  },
  {
    id: "trn-rec-019",
    passportId: "SP-WB-2026-015588",
    name: "Rekha Barman",
    state: "West Bengal",
    district: "Cooch Behar",
    gender: "Female",
    age: 28,
    category: "ST",
    programmeId: "ncct-prog-handloom",
    institution: "National Institute of Fashion Technology, Cooperative Cell, Kolkata",
    enrolledOn: "2026-02-27",
    attendancePct: 88,
    coursesCompleted: 9,
    assessmentPct: 70,
    verifiedSkills: ["Handloom Operations", "E-commerce"],
    stage: "Job matched",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-020",
    passportId: "SP-DL-2026-016712",
    name: "Sameer Anil Kapoor",
    state: "Delhi",
    district: "North West Delhi",
    gender: "Male",
    age: 29,
    category: "General",
    programmeId: "ncct-prog-coop-governance",
    institution: "National Cooperative Union of India Training Centre, Delhi",
    enrolledOn: "2026-01-12",
    attendancePct: 84,
    coursesCompleted: 12,
    assessmentPct: 75,
    verifiedSkills: ["Cooperative Governance", "Member Relations", "Statutory Compliance"],
    stage: "Employed",
    placedWith: "Delhi Cooperative Handloom Marketing & Sales Federation",
    risk: "On track",
  },
  {
    id: "trn-rec-021",
    passportId: "SP-MH-2026-017845",
    name: "Farida Khatoon Ansari",
    state: "Maharashtra",
    district: "Aurangabad",
    gender: "Female",
    age: 23,
    category: "OBC",
    programmeId: "ncct-prog-agri-credit",
    institution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
    enrolledOn: "2026-06-22",
    attendancePct: 81,
    coursesCompleted: 5,
    assessmentPct: 72,
    verifiedSkills: ["Bookkeeping", "Spreadsheets"],
    stage: "Assessed",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-022",
    passportId: "SP-KA-2026-018963",
    name: "Girish Bhat Yellappa",
    state: "Karnataka",
    district: "Shivamogga",
    gender: "Male",
    age: 35,
    category: "SC",
    programmeId: "ncct-prog-dairy-ops",
    institution: "National Dairy Development Board Training Centre, Bengaluru",
    enrolledOn: "2026-05-04",
    attendancePct: 86,
    coursesCompleted: 10,
    assessmentPct: 77,
    verifiedSkills: ["Dairy Operations", "Quality Testing"],
    stage: "Certified",
    placedWith: null,
    risk: "On track",
  },
  {
    id: "trn-rec-023",
    passportId: "SP-GJ-2026-019071",
    name: "Meena Kanjibhai Solanki",
    state: "Gujarat",
    district: "Bhavnagar",
    gender: "Female",
    age: 25,
    category: "ST",
    programmeId: "ncct-prog-fisheries",
    institution: "Central Institute of Fisheries Education Extension Cell, Mumbai",
    enrolledOn: "2026-05-18",
    attendancePct: 79,
    coursesCompleted: 7,
    assessmentPct: 68,
    verifiedSkills: ["Cold Chain", "Documentation"],
    stage: "Training",
    placedWith: null,
    risk: "Watch",
  },
  {
    id: "trn-rec-024",
    passportId: "SP-UP-2026-020488",
    name: "Yashwant Ramnath Prajapati",
    state: "Uttar Pradesh",
    district: "Kanpur",
    gender: "Male",
    age: 30,
    category: "OBC",
    programmeId: "ncct-prog-quality-testing",
    institution: "Central Institute of Horticulture Extension Cell, Lucknow",
    enrolledOn: "2026-04-27",
    attendancePct: 72,
    coursesCompleted: 6,
    assessmentPct: 64,
    verifiedSkills: ["Quality Testing"],
    stage: "Training",
    placedWith: null,
    risk: "Support needed",
  },
];

/* -------------------------------------------------------------------------- */
/* Employer registry                                                           */
/* -------------------------------------------------------------------------- */

export type EmployerVerification = "Verified" | "Pending" | "Rejected";
export type EmployerType =
  | "Cooperative society"
  | "Primary marketing cooperative"
  | "Farmer producer organisation"
  | "Panchayat"
  | "Government body"
  | "MSME"
  | "NGO";

export interface AdminEmployer {
  id: string;
  name: string;
  type: EmployerType;
  state: string;
  district: string;
  sector: string;
  contactName: string;
  contactEmail: string;
  verification: EmployerVerification;
  verifiedOn: string | null;
  documentsOnFile: number;
  documentsRequired: number;
  openRoles: number;
  totalHires: number;
  averageTimeToHireDays: number;
  feedbackRatePct: number;
  lastEngagement: string;
  notes: string;
}

export const adminEmployersSeed: AdminEmployer[] = [
  {
    id: "emp-ad-guj-dairy-union",
    name: "Anand District Milk Producers Cooperative Union",
    type: "Cooperative society",
    state: "Gujarat",
    district: "Anand",
    sector: "Dairy & Agri-processing",
    contactName: "Dilipbhai Patel",
    contactEmail: "dilip.patel@example.invalid",
    verification: "Verified",
    verifiedOn: "2025-11-04",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 4,
    totalHires: 38,
    averageTimeToHireDays: 19,
    feedbackRatePct: 96,
    lastEngagement: "2026-09-26",
    notes: "Signatory authority verified against the society's registration certificate.",
  },
  {
    id: "emp-pune-central-credit",
    name: "Pune Central Cooperative Credit Society",
    type: "Cooperative society",
    state: "Maharashtra",
    district: "Pune",
    sector: "Rural Finance",
    contactName: "Sanjay Kulkarni",
    contactEmail: "sanjay.kulkarni@example.invalid",
    verification: "Verified",
    verifiedOn: "2025-09-18",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 2,
    totalHires: 24,
    averageTimeToHireDays: 27,
    feedbackRatePct: 88,
    lastEngagement: "2026-09-24",
    notes: "Requires every shortlisted candidate to hold a verified audit-readiness certificate.",
  },
  {
    id: "emp-vadodara-consumer-store",
    name: "Vadodara Consumer Cooperative Store",
    type: "Cooperative society",
    state: "Gujarat",
    district: "Vadodara",
    sector: "Marketing & Sales",
    contactName: "Nilesh Trivedi",
    contactEmail: "nilesh.trivedi@example.invalid",
    verification: "Verified",
    verifiedOn: "2026-01-22",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 1,
    totalHires: 12,
    averageTimeToHireDays: 22,
    feedbackRatePct: 91,
    lastEngagement: "2026-09-25",
    notes: "Fastest time to hire in the retail segment over the last two quarters.",
  },
  {
    id: "emp-bengal-handloom-federation",
    name: "Bengal Handloom Weavers Cooperative Federation",
    type: "Primary marketing cooperative",
    state: "West Bengal",
    district: "Kolkata",
    sector: "Handloom & Handicrafts",
    contactName: "Madhurima Roy",
    contactEmail: "madhurima.roy@example.invalid",
    verification: "Verified",
    verifiedOn: "2025-12-11",
    documentsOnFile: 3,
    documentsRequired: 4,
    openRoles: 3,
    totalHires: 41,
    averageTimeToHireDays: 31,
    feedbackRatePct: 84,
    lastEngagement: "2026-09-20",
    notes: "Membership audit due; the bye-laws document expires next quarter.",
  },
  {
    id: "emp-mysuru-milk-coop",
    name: "Mysuru District Milk Producers Cooperative",
    type: "Cooperative society",
    state: "Karnataka",
    district: "Mysuru",
    sector: "Dairy & Agri-processing",
    contactName: "Harish Gowda",
    contactEmail: "harish.gowda@example.invalid",
    verification: "Verified",
    verifiedOn: "2026-02-08",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 2,
    totalHires: 17,
    averageTimeToHireDays: 24,
    feedbackRatePct: 79,
    lastEngagement: "2026-09-23",
    notes: "Posted two quality-analyst roles after the Bengaluru lab cohort finished.",
  },
  {
    id: "emp-shivamogga-fpo",
    name: "Shivamogga District Apple Growers FPO",
    type: "Farmer producer organisation",
    state: "Karnataka",
    district: "Shivamogga",
    sector: "Agri Value Chains",
    contactName: "Prakash Hegde",
    contactEmail: "prakash.hegde@example.invalid",
    verification: "Pending",
    verifiedOn: null,
    documentsOnFile: 2,
    documentsRequired: 4,
    openRoles: 0,
    totalHires: 0,
    averageTimeToHireDays: 0,
    feedbackRatePct: 0,
    lastEngagement: "2026-09-12",
    notes: "Awaiting the FPO registration certificate and the bank account proof.",
  },
  {
    id: "emp-sangli-grape-fpo",
    name: "Sangli Grape Growers FPO Union",
    type: "Farmer producer organisation",
    state: "Maharashtra",
    district: "Sangli",
    sector: "Agri Value Chains",
    contactName: "Vitthalrao Pawar",
    contactEmail: "vitthal.pawar@example.invalid",
    verification: "Verified",
    verifiedOn: "2026-04-15",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 1,
    totalHires: 9,
    averageTimeToHireDays: 35,
    feedbackRatePct: 68,
    lastEngagement: "2026-09-09",
    notes: "Slowest feedback turnaround; two hires still have no post-hire review.",
  },
  {
    id: "emp-kolhapur-panchayat",
    name: "Kolhapur Zilla Parishad Skill Cell",
    type: "Panchayat",
    state: "Maharashtra",
    district: "Kolhapur",
    sector: "Cooperative Governance",
    contactName: "Sunita Jadhav",
    contactEmail: "sunita.jadhav@example.invalid",
    verification: "Verified",
    verifiedOn: "2025-10-30",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 2,
    totalHires: 15,
    averageTimeToHireDays: 29,
    feedbackRatePct: 73,
    lastEngagement: "2026-09-18",
    notes: "Employs trainees from the FPO value-chain cohort for field roles.",
  },
  {
    id: "emp-bhopal-logistics-pcs",
    name: "Bhopal Rural Transport Cooperative Society",
    type: "Cooperative society",
    state: "Madhya Pradesh",
    district: "Bhopal",
    sector: "Logistics & Supply Chain",
    contactName: "Ashok Verma",
    contactEmail: "ashok.verma@example.invalid",
    verification: "Pending",
    verifiedOn: null,
    documentsOnFile: 3,
    documentsRequired: 4,
    openRoles: 3,
    totalHires: 6,
    averageTimeToHireDays: 41,
    feedbackRatePct: 50,
    lastEngagement: "2026-09-15",
    notes: "Transport licence under renewal; verification is held until it is filed.",
  },
  {
    id: "emp-lucknow-ncert-cell",
    name: "Lucknow District Cooperative Extension Cell",
    type: "Government body",
    state: "Uttar Pradesh",
    district: "Lucknow",
    sector: "Quality & Compliance",
    contactName: "Ramesh Chandra",
    contactEmail: "ramesh.chandra@example.invalid",
    verification: "Verified",
    verifiedOn: "2026-03-12",
    documentsOnFile: 4,
    documentsRequired: 4,
    openRoles: 2,
    totalHires: 11,
    averageTimeToHireDays: 38,
    feedbackRatePct: 62,
    lastEngagement: "2026-08-30",
    notes: "Government body, so placement counts only after the joining letter is uploaded.",
  },
  {
    id: "emp-surat-textile-msme",
    name: "Surat Cooperative Textile Processing Unit",
    type: "MSME",
    state: "Gujarat",
    district: "Surat",
    sector: "Handloom & Handicrafts",
    contactName: "Bhavesh Mehta",
    contactEmail: "bhavesh.mehta@example.invalid",
    verification: "Rejected",
    verifiedOn: null,
    documentsOnFile: 1,
    documentsRequired: 4,
    openRoles: 0,
    totalHires: 0,
    averageTimeToHireDays: 0,
    feedbackRatePct: 0,
    lastEngagement: "2026-08-14",
    notes: "Rejected: the signatory did not match the GST registration on file.",
  },
  {
    id: "emp-kochi-fisheries-coop",
    name: "Kochi Marine Fisheries Cooperative Society",
    type: "Cooperative society",
    state: "Kerala",
    district: "Ernakulam",
    sector: "Fisheries & Aquaculture",
    contactName: "Anjali Menon",
    contactEmail: "anjali.menon@example.invalid",
    verification: "Pending",
    verifiedOn: null,
    documentsOnFile: 2,
    documentsRequired: 4,
    openRoles: 1,
    totalHires: 4,
    averageTimeToHireDays: 44,
    feedbackRatePct: 75,
    lastEngagement: "2026-09-16",
    notes: "New application from a fisheries cluster; both NCCT documents are outstanding.",
  },
];

/* -------------------------------------------------------------------------- */
/* Trends, funnel and settings                                                 */
/* -------------------------------------------------------------------------- */

export interface QualityTrendPoint {
  month: string;
  attendancePct: number;
  assessmentPct: number;
  placementPct: number;
  certifications: number;
}

export const QUALITY_TREND: QualityTrendPoint[] = [
  { month: "Jan", attendancePct: 78, assessmentPct: 68, placementPct: 41, certifications: 182 },
  { month: "Feb", attendancePct: 79, assessmentPct: 69, placementPct: 44, certifications: 194 },
  { month: "Mar", attendancePct: 81, assessmentPct: 70, placementPct: 46, certifications: 208 },
  { month: "Apr", attendancePct: 80, assessmentPct: 71, placementPct: 45, certifications: 221 },
  { month: "May", attendancePct: 82, assessmentPct: 72, placementPct: 49, certifications: 236 },
  { month: "Jun", attendancePct: 83, assessmentPct: 73, placementPct: 51, certifications: 248 },
  { month: "Jul", attendancePct: 84, assessmentPct: 74, placementPct: 53, certifications: 262 },
  { month: "Aug", attendancePct: 85, assessmentPct: 74, placementPct: 55, certifications: 271 },
  { month: "Sep", attendancePct: 86, assessmentPct: 75, placementPct: 57, certifications: 289 },
];

export interface PlacementSourcePoint {
  source: string;
  hires: number;
}

/** Where confirmed hires came from, counted from the platform's own records. */
export const PLACEMENT_SOURCES: PlacementSourcePoint[] = [
  { source: "AI match", hires: 168 },
  { source: "Direct apply", hires: 97 },
  { source: "Institution referral", hires: 74 },
  { source: "NURVEX job board", hires: 52 },
];

export interface MatchingWeightSetting {
  key: "mandatory" | "overlap" | "depth" | "evidence" | "vector";
  label: string;
  weight: number;
  description: string;
}

export interface PlatformSettings {
  matchingWeights: MatchingWeightSetting[];
  evidenceBudget: number;
  minimumPassportConfidence: number;
  autoShortlistScore: number;
  placementTargetPct: number;
  attendanceFloorPct: number;
  verificationSlaDays: number;
  interviewSlotsPerTrainer: number;
  dataRetentionMonths: number;
  aiAssistEnabled: boolean;
  maintenanceMode: boolean;
  alertEmail: string;
  lastPublishedOn: string;
  publishedBy: string;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  matchingWeights: [
    {
      key: "mandatory",
      label: "Mandatory requirements met",
      weight: 0.3,
      description: "Share of the posting's non-negotiable requirements already verified.",
    },
    {
      key: "overlap",
      label: "Skill overlap",
      weight: 0.25,
      description: "Verified posting skills as a share of every skill the posting asks for.",
    },
    {
      key: "depth",
      label: "Proficiency depth",
      weight: 0.15,
      description: "Mean proficiency of the matched skills on the four-step ladder.",
    },
    {
      key: "evidence",
      label: "Evidence strength",
      weight: 0.15,
      description: "Banked evidence points against the cap, so volume alone cannot buy a score.",
    },
    {
      key: "vector",
      label: "Semantic similarity",
      weight: 0.15,
      description: "Passport to posting vector similarity, capped so a weak posting cannot dominate.",
    },
  ],
  evidenceBudget: 126,
  minimumPassportConfidence: 70,
  autoShortlistScore: 70,
  placementTargetPct: 60,
  attendanceFloorPct: 80,
  verificationSlaDays: 7,
  interviewSlotsPerTrainer: 6,
  dataRetentionMonths: 36,
  aiAssistEnabled: true,
  maintenanceMode: false,
  alertEmail: "ncct.oversight@example.invalid",
  lastPublishedOn: "2026-09-20",
  publishedBy: "NCCT Oversight Desk",
};

/* -------------------------------------------------------------------------- */
/* Derived roll-ups, computed from the seeds so screens cannot disagree         */
/* -------------------------------------------------------------------------- */

export interface NationalTotals {
  programmeCount: number;
  institutionCount: number;
  stateCount: number;
  seats: number;
  enrolled: number;
  completed: number;
  certified: number;
  placed: number;
  trainers: number;
  activeTrainers: number;
  employers: number;
  verifiedEmployers: number;
  pendingEmployers: number;
  averageAttendancePct: number;
  averageAssessmentPct: number;
  placementRatePct: number;
  budgetLakh: number;
  spentLakh: number;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function nationalTotals(
  programmes: AdminProgramme[],
  trainees: AdminTrainee[],
  trainers: AdminTrainer[],
  employers: AdminEmployer[],
): NationalTotals {
  const certified = programmes.reduce((sum, programme) => sum + programme.certified, 0);
  const placed = programmes.reduce((sum, programme) => sum + programme.placed, 0);
  return {
    programmeCount: programmes.length,
    institutionCount: new Set(programmes.map((programme) => programme.partnerInstitution)).size,
    stateCount: new Set(programmes.map((programme) => programme.state)).size,
    seats: programmes.reduce((sum, programme) => sum + programme.seats, 0),
    enrolled: programmes.reduce((sum, programme) => sum + programme.enrolled, 0),
    completed: programmes.reduce((sum, programme) => sum + programme.completed, 0),
    certified,
    placed,
    trainers: trainers.length,
    activeTrainers: trainers.filter((trainer) => trainer.status === "Active").length,
    employers: employers.length,
    verifiedEmployers: employers.filter((employer) => employer.verification === "Verified").length,
    pendingEmployers: employers.filter((employer) => employer.verification === "Pending").length,
    averageAttendancePct: round1(mean(programmes.map((programme) => programme.attendancePct))),
    averageAssessmentPct: round1(mean(programmes.map((programme) => programme.assessmentPct))),
    placementRatePct: certified === 0 ? 0 : round1((placed / certified) * 100),
    budgetLakh: programmes.reduce((sum, programme) => sum + programme.budgetLakh, 0),
    spentLakh: programmes.reduce((sum, programme) => sum + programme.spentLakh, 0),
  };
}

export interface ClosedLoopStage {
  stage: TraineeStage;
  count: number;
  /** Share of the cohort that has reached this stage or beyond. */
  reachedPct: number;
}

/**
 * The training-to-employment funnel, derived from the trainee registry. Because
 * stages are ordered, a trainee counted at a stage is also counted at every
 * earlier stage, which is what makes the percentages meaningful.
 */
export function closedLoopStages(trainees: AdminTrainee[]): ClosedLoopStage[] {
  const total = trainees.length;
  const atOrBeyond = (stage: TraineeStage) =>
    trainees.filter(
      (trainee) => TRAINEE_STAGES.indexOf(trainee.stage) >= TRAINEE_STAGES.indexOf(stage),
    ).length;
  return TRAINEE_STAGES.map((stage) => {
    const count = atOrBeyond(stage);
    return { stage, count, reachedPct: total === 0 ? 0 : round1((count / total) * 100) };
  });
}

export interface StateRollup {
  state: string;
  programmes: number;
  enrolled: number;
  certified: number;
  placed: number;
  placementRatePct: number;
}

/** Programme roll-up by state, ordered by the number of people placed. */
export function stateRollup(programmes: AdminProgramme[]): StateRollup[] {
  const byState = new Map<string, StateRollup>();
  for (const programme of programmes) {
    const existing = byState.get(programme.state) ?? {
      state: programme.state,
      programmes: 0,
      enrolled: 0,
      certified: 0,
      placed: 0,
      placementRatePct: 0,
    };
    existing.programmes += 1;
    existing.enrolled += programme.enrolled;
    existing.certified += programme.certified;
    existing.placed += programme.placed;
    byState.set(programme.state, existing);
  }
  return [...byState.values()]
    .map((row) => ({
      ...row,
      placementRatePct: row.certified === 0 ? 0 : round1((row.placed / row.certified) * 100),
    }))
    .sort((a, b) => b.placed - a.placed);
}

export interface SectorRollup {
  sector: string;
  programmes: number;
  enrolled: number;
  placed: number;
  averageAttendancePct: number;
}

export function sectorRollup(programmes: AdminProgramme[]): SectorRollup[] {
  const groups = new Map<string, AdminProgramme[]>();
  for (const programme of programmes) {
    const bucket = groups.get(programme.sector) ?? [];
    bucket.push(programme);
    groups.set(programme.sector, bucket);
  }
  return [...groups.entries()]
    .map(([sector, rows]) => ({
      sector,
      programmes: rows.length,
      enrolled: rows.reduce((sum, row) => sum + row.enrolled, 0),
      placed: rows.reduce((sum, row) => sum + row.placed, 0),
      averageAttendancePct: round1(mean(rows.map((row) => row.attendancePct))),
    }))
    .sort((a, b) => b.placed - a.placed);
}

/** Trainer lookup shared by the programme and trainer screens. */
export function trainerById(trainers: AdminTrainer[], id: string): AdminTrainer | undefined {
  return trainers.find((trainer) => trainer.id === id);
}

/** Programme lookup shared by the trainee and programme screens. */
export function programmeById(
  programmes: AdminProgramme[],
  id: string,
): AdminProgramme | undefined {
  return programmes.find((programme) => programme.id === id);
}
