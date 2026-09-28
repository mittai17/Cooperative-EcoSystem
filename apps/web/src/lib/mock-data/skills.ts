import type { SkillEntry } from "@/lib/types";

export const skillPassport: SkillEntry[] = [
  {
    name: "Cooperative Management",
    category: "Governance",
    level: "Proficient",
    confidence: 92,
    evidence: [
      { type: "Course", title: "Cooperative Management Fundamentals", date: "2026-04-10" },
      { type: "Assessment", title: "Governance & Bylaws Proficiency Test", date: "2026-04-22" },
      { type: "Project", title: "Model Bylaws Draft for Pilot Society", date: "2026-05-02" },
    ],
    verified: true,
    lastUpdated: "2026-05-02",
  },
  {
    name: "Data Analysis",
    category: "Data & Analytics",
    level: "Intermediate",
    confidence: 78,
    evidence: [
      { type: "Assessment", title: "Spreadsheet & Dashboarding Skill Check", date: "2026-06-14" },
      { type: "Project", title: "Member Default-Risk Dashboard", date: "2026-06-28" },
    ],
    verified: true,
    lastUpdated: "2026-06-28",
  },
  {
    name: "Dairy Operations",
    category: "Dairy & Agri-processing",
    level: "Proficient",
    confidence: 88,
    evidence: [
      { type: "Course", title: "Dairy Cooperative Operations", date: "2026-06-18" },
      { type: "Assessment", title: "FAT/SNF Quality Testing Practical", date: "2026-06-20" },
      { type: "Employer Feedback", title: "Field Internship Review - Amul Dairy Union", date: "2026-07-05" },
    ],
    verified: true,
    lastUpdated: "2026-07-05",
  },
  {
    name: "Digital Marketing",
    category: "Marketing & Sales",
    level: "Intermediate",
    confidence: 74,
    evidence: [
      { type: "Course", title: "Digital Marketing for Cooperatives", date: "2026-03-01" },
      { type: "Project", title: "ONDC Storefront Setup for Weaver Society", date: "2026-03-20" },
    ],
    verified: true,
    lastUpdated: "2026-03-20",
  },
  {
    name: "Bookkeeping",
    category: "Finance & Accounts",
    level: "Foundational",
    confidence: 61,
    evidence: [
      { type: "Course", title: "Cooperative Bookkeeping with Tally", date: "2026-08-11" },
    ],
    verified: false,
    lastUpdated: "2026-08-11",
  },
  {
    name: "Leadership & Facilitation",
    category: "Leadership",
    level: "Intermediate",
    confidence: 70,
    evidence: [
      { type: "Course", title: "Leadership for Cooperative Board Members", date: "2026-07-15" },
      { type: "Assessment", title: "Meeting Facilitation Simulation", date: "2026-07-22" },
    ],
    verified: true,
    lastUpdated: "2026-07-22",
  },
];
