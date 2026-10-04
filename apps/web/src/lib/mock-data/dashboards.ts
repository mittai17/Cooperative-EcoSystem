// Mock widget data for role-based dashboards. All figures are illustrative
// demo data for the NURVEX frontend-first build.

export const traineeProgress = [
  { month: "Apr", hours: 6 },
  { month: "May", hours: 11 },
  { month: "Jun", hours: 18 },
  { month: "Jul", hours: 14 },
  { month: "Aug", hours: 21 },
  { month: "Sep", hours: 16 },
];

export const traineeUpcomingAssessments = [
  {
    id: "asmt-1",
    title: "Bookkeeping with Tally - Module 3 Quiz",
    programme: "Cooperative Bookkeeping with Tally",
    dueDate: "2026-10-02",
    type: "Quiz",
  },
  {
    id: "asmt-2",
    title: "Leadership Simulation - Peer Review",
    programme: "Leadership for Cooperative Board Members",
    dueDate: "2026-10-06",
    type: "Practical",
  },
  {
    id: "asmt-3",
    title: "Data Analysis Capstone Submission",
    programme: "Data Analysis for Cooperative Decision-Making",
    dueDate: "2026-10-14",
    type: "Project",
  },
];

export const traineeEnrolledCourses = [
  { id: "c1", title: "Cooperative Bookkeeping with Tally", progress: 62 },
  { id: "c2", title: "Leadership for Cooperative Board Members", progress: 84 },
  { id: "c3", title: "Data Analysis for Cooperative Decision-Making", progress: 40 },
];

export const traineeRecommendedJobs = [
  { id: "job-dairy-supervisor-anand", title: "Dairy Procurement Supervisor", employer: "Amul Dairy Cooperative Union", matchScore: 91 },
  { id: "job-society-accountant-pune", title: "Cooperative Society Accountant", employer: "Vaikunth Cooperative Credit Society", matchScore: 76 },
  { id: "job-mis-analyst-delhi", title: "MIS & Data Analyst - Cooperative Sector", employer: "National Cooperative Development Corporation", matchScore: 68 },
];

// Institution dashboard
export const institutionAttendanceTrend = [
  { week: "W1", attendance: 88 },
  { week: "W2", attendance: 91 },
  { week: "W3", attendance: 85 },
  { week: "W4", attendance: 93 },
  { week: "W5", attendance: 89 },
  { week: "W6", attendance: 95 },
];

export const institutionProgrammeSummary = [
  { id: "p1", title: "Cooperative Management Fundamentals", trainees: 47, attendance: 92, status: "Active" },
  { id: "p2", title: "Cooperative Bookkeeping & Statutory Audit Readiness", trainees: 52, attendance: 88, status: "Active" },
  { id: "p3", title: "Dairy Cooperative Operations", trainees: 40, attendance: 95, status: "Completed" },
];

export const institutionNominations = [
  { id: "n1", trainee: "Anjali Rathore", programme: "Cooperative Management Fundamentals", submittedOn: "2026-09-20", status: "Pending" },
  { id: "n2", trainee: "Vikram Solanki", programme: "Cooperative Bookkeeping & Statutory Audit Readiness", submittedOn: "2026-09-22", status: "Pending" },
  { id: "n3", trainee: "Farida Khatoon", programme: "Cooperative Management Fundamentals", submittedOn: "2026-09-18", status: "Approved" },
  { id: "n4", trainee: "Deepak Chauhan", programme: "Dairy Cooperative Operations", submittedOn: "2026-09-15", status: "Rejected" },
];

// Trainer dashboard
export const trainerClasses = [
  { id: "cl1", title: "Cooperative Management Fundamentals - Batch B", time: "Mon/Wed 10:00 AM", trainees: 47 },
  { id: "cl2", title: "Leadership for Cooperative Board Members", time: "Tue/Thu 2:00 PM", trainees: 31 },
  { id: "cl3", title: "Data Analysis for Cooperative Decision-Making", time: "Fri 11:00 AM", trainees: 24 },
];

export const trainerAttendanceQueue = [
  { id: "att1", classTitle: "Cooperative Management Fundamentals - Batch B", date: "2026-09-29", status: "Not marked" },
  { id: "att2", classTitle: "Leadership for Cooperative Board Members", date: "2026-09-30", status: "Not marked" },
  { id: "att3", classTitle: "Data Analysis for Cooperative Decision-Making", date: "2026-09-26", status: "Marked" },
];

export const trainerGradingQueue = [
  { id: "grd1", assessment: "Governance & Bylaws Proficiency Test", submissions: 44, graded: 30 },
  { id: "grd2", assessment: "Meeting Facilitation Simulation", submissions: 31, graded: 31 },
  { id: "grd3", assessment: "Member Default-Risk Dashboard (Project)", submissions: 24, graded: 9 },
];

// Employer dashboard
export const employerJobPostings = [
  { id: "job-dairy-supervisor-anand", title: "Dairy Procurement Supervisor", applications: 38, status: "Open" },
  { id: "job-mis-analyst-delhi", title: "MIS & Data Analyst - Cooperative Sector", applications: 21, status: "Open" },
  { id: "job-apprentice-coop-secretary-jaipur", title: "Apprentice Cooperative Society Secretary", applications: 54, status: "Closed" },
];

export const employerCandidateMatches = [
  { id: "cand1", name: "Ravindra Suresh Patil", role: "Dairy Procurement Supervisor", matchScore: 94, verified: true },
  { id: "cand2", name: "Sunita Devi Yadav", role: "Cooperative Society Accountant", matchScore: 82, verified: true },
  { id: "cand3", name: "Aslam Sheikh", role: "MIS & Data Analyst - Cooperative Sector", matchScore: 71, verified: false },
];

export const employerApplicationFunnel = [
  { stage: "Applied", count: 168 },
  { stage: "Shortlisted", count: 54 },
  { stage: "Interviewed", count: 22 },
  { stage: "Offered", count: 9 },
  { stage: "Hired", count: 6 },
];

// Admin (NCCT) dashboard
export const adminInstitutionsSummary = [
  { id: "i1", name: "Institute of Rural Management, Anand", programmes: 6, trainees: 812, state: "Gujarat" },
  { id: "i2", name: "National Cooperative Union of India Training Centre, Delhi", programmes: 9, trainees: 1140, state: "Delhi" },
  { id: "i3", name: "Vaikunth Mehta National Institute of Cooperative Management, Pune", programmes: 5, trainees: 604, state: "Maharashtra" },
  { id: "i4", name: "Laxmanrao Inamdar National Academy, Gandhinagar", programmes: 4, trainees: 398, state: "Gujarat" },
];

export const adminSkillDemand = [
  { skill: "Dairy Operations", demand: 82 },
  { skill: "Credit Appraisal", demand: 75 },
  { skill: "Digital Marketing", demand: 90 },
  { skill: "Bookkeeping", demand: 64 },
  { skill: "Data Analysis", demand: 71 },
];

export const adminEmploymentFunnel = [
  { stage: "Registered", count: 24800 },
  { stage: "Completed Training", count: 18650 },
  { stage: "Certified", count: 15920 },
  { stage: "Job Matched", count: 9740 },
  { stage: "Employed", count: 7380 },
];

export const adminMonthlyOutcomes = [
  { month: "Apr", employed: 480, certified: 1120 },
  { month: "May", employed: 560, certified: 1340 },
  { month: "Jun", employed: 610, certified: 1490 },
  { month: "Jul", employed: 705, certified: 1610 },
  { month: "Aug", employed: 742, certified: 1780 },
  { month: "Sep", employed: 812, certified: 1905 },
];
