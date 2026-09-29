export type UserRole =
  | "trainee"
  | "institution"
  | "trainer"
  | "employer"
  | "admin"
  | "kiosk";

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "trainee",
    label: "Trainee / Learner",
    description: "Enrol in programmes, build your Skill Passport, find jobs",
  },
  {
    value: "institution",
    label: "Cooperative Institution",
    description: "Run programmes, nominate trainees, track outcomes",
  },
  {
    value: "trainer",
    label: "Trainer / Faculty",
    description: "Manage classes, attendance, and assessments",
  },
  {
    value: "employer",
    label: "Employer / Cooperative Society",
    description: "Post jobs, discover verified skilled candidates",
  },
  {
    value: "admin",
    label: "NCCT Administrator",
    description: "Oversee institutions, programmes, and national outcomes",
  },
  {
    value: "kiosk",
    label: "Digital Kiosk Station",
    description: "Offline-first village station for attendance and certificate verification",
  },
];

export type ProgrammeLevel = "Foundation" | "Intermediate" | "Advanced";
export type ProgrammeMode = "Online" | "In-person" | "Blended";

export interface Programme {
  id: string;
  title: string;
  sector: string;
  institution: string;
  level: ProgrammeLevel;
  mode: ProgrammeMode;
  durationWeeks: number;
  seatsTotal: number;
  seatsFilled: number;
  startDate: string;
  description: string;
  tags: string[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: ProgrammeLevel;
  durationHours: number;
  instructor: string;
  rating: number;
  enrolled: number;
  description: string;
  skills: string[];
}

export type JobType = "Full-time" | "Part-time" | "Contract" | "Apprenticeship";

export interface Job {
  id: string;
  title: string;
  employer: string;
  location: string;
  sector: string;
  type: JobType;
  salaryRange: string;
  postedDaysAgo: number;
  skillsRequired: string[];
  description: string;
  openings: number;
}

export type CertificateStatus = "Valid" | "Revoked" | "Expired";

export interface Certificate {
  id: string;
  holderName: string;
  programmeTitle: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  status: CertificateStatus;
  skillsCertified: string[];
  grade: string;
}

export type SkillLevel = "Foundational" | "Intermediate" | "Proficient" | "Expert";
export type EvidenceType = "Course" | "Assessment" | "Project" | "Employer Feedback";

export interface SkillEvidence {
  type: EvidenceType;
  title: string;
  date: string;
}

export interface SkillEntry {
  name: string;
  category: string;
  level: SkillLevel;
  confidence: number;
  evidence: SkillEvidence[];
  verified: boolean;
  lastUpdated: string;
}
