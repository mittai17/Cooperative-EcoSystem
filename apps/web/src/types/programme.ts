// =============================================================================
// Programme Registration Module — Types
// =============================================================================

export type ProgrammeType =
  | "training"
  | "short-course"
  | "certification-exam"
  | "skill-development"
  | "digital-literacy";

export type ProgrammeMode = "Online" | "On-Campus" | "Hybrid" | "Offline Residential";
export type ProgrammeLevel = "Beginner" | "Intermediate" | "Advanced";
export type ProgrammeLang =
  | "English"
  | "Hindi"
  | "Marathi"
  | "Tamil"
  | "Telugu"
  | "Gujarati"
  | "Assamese";
export type CertificateType = "Certificate" | "Diploma" | "No Certificate";
export type ProgrammeAvailability = "Open" | "Limited Seats" | "Full";

export interface EligibilityRule {
  field: string;
  label: string;
  operator: "eq" | "gte" | "lte" | "in" | "exists";
  value: string | number | string[];
  description: string;
}

export interface CurriculumModule {
  week: number;
  title: string;
  topics: string[];
  hours: number;
}

export interface Programme {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  type: ProgrammeType;
  category: string;
  institution: string;
  institutionId: string;
  location: string;
  state: string;
  district: string;
  mode: ProgrammeMode;
  language: ProgrammeLang[];
  startDate: string;       // ISO date
  endDate: string;         // ISO date
  duration: number;
  durationUnit: "days" | "weeks" | "months";
  registrationDeadline: string;
  totalSeats: number;
  availableSeats: number;
  level: ProgrammeLevel;
  certificateType: CertificateType;
  skills: string[];
  eligibility: string[];
  eligibilityRules: EligibilityRule[];
  hostelAvailable: boolean;
  mealAvailable: boolean;
  transportAvailable: boolean;
  trainerIds: string[];
  curriculum: CurriculumModule[];
  learningOutcomes: string[];
  documentsRequired: string[];
  fee: number;
  isFree: boolean;
  status: "active" | "upcoming" | "closed" | "draft";
  featured: boolean;
  recommended: boolean;
  applicationCount: number;
  rating: number;
  tags: string[];
  imageUrl?: string;
}

export interface CertificationExam {
  id: string;
  name: string;
  shortName: string;
  issuer: string;
  description: string;
  eligibility: string[];
  eligibilityRules: EligibilityRule[];
  registrationDeadline: string;
  examDate: string;
  duration: number;  // minutes
  durationUnit: "minutes" | "hours";
  mode: ProgrammeMode;
  availableSlots: number;
  filledSlots: number;
  fee: number;
  isFree: boolean;
  certificateType: CertificateType;
  skillsAssessed: string[];
  language: ProgrammeLang[];
  status: "open" | "closed" | "upcoming" | "completed";
  passingScore: number;
  syllabus: string[];
}

export interface Trainer {
  id: string;
  name: string;
  title: string;
  institution: string;
  specializations: string[];
  experience: string;
  email: string;
  rating: number;
  bio: string;
}

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  type: "RICM" | "ICM" | "VAMNICOM" | "NCCT" | "Other";
  state: string;
  district: string;
  address: string;
  website: string;
  accreditation: string;
}

export interface Cooperative {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  memberCount: number;
}
