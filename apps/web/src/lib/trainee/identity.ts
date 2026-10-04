/**
 * The single demo trainee persona used by every trainee surface.
 *
 * Identity anchors (id, roll number, batch, institution, Skill Passport id)
 * come from `currentTrainee` in `lib/mock-data/kiosk.ts`, which the certificate
 * detail screen and the public verification pages already treat as canonical.
 * This module only adds the profile fields those pages do not carry, so the
 * portal never shows two different learners.
 */
import { currentTrainee } from "@/lib/mock-data/kiosk";

export interface TraineeProfile {
  /** Short name used in greetings and the app shell. */
  name: string;
  /** Name exactly as printed on certificates and registry documents. */
  legalName: string;
  role: string;
  /** NURVEX trainee code, `TR-<year>-<serial>`. */
  traineeCode: string;
  /** Institute roll number, `T-<year>-<serial>`. */
  rollNo: string;
  skillPassportId: string;
  age: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  location: string;
  district: string;
  state: string;
  languages: string;
  email: string;
  phone: string;
  bio: string;
  careerGoal: string;
  careerGoalDesc: string;
  /** Role the AI mock interview and skill-gap analysis are built for. */
  targetRole: string;
  targetRoleSkills: string[];
  programme: string;
  batch: string;
  institution: string;
  enrolledOn: string;
  hostelBed: string;
}

export const traineeProfile: TraineeProfile = {
  name: currentTrainee.name,
  legalName: currentTrainee.legalName,
  role: "Trainee",
  traineeCode: currentTrainee.id,
  rollNo: currentTrainee.rollNo,
  skillPassportId: currentTrainee.skillPassportId,
  age: "23 years",
  dob: "12 Jun 2003",
  gender: "Male",
  location: "Sangli, Maharashtra",
  district: currentTrainee.district,
  state: "Maharashtra",
  languages: "Marathi, Hindi, English",
  email: "ravindra.patil@example.com",
  phone: "+91 98765 43210",
  bio: "Dairy cooperative operations trainee from Sangli, Maharashtra, currently placed at a 42-cow dairy unit. Focused on milk quality testing, route-level cold chain and cooperative bookkeeping, with the long-term goal of running procurement for a village-level Primary Agricultural Credit Society.",
  careerGoal: "Dairy Cooperative Operations Supervisor",
  careerGoalDesc: "I want to lead milk procurement for a village dairy cooperative and eventually manage the cold-chain route plan and member payouts for the same society.",
  targetRole: "PACS Management Trainee",
  targetRoleSkills: [
    "Cooperative Accounting",
    "Member Relations",
    "PACS Computerisation",
    "Agricultural Credit",
  ],
  programme: currentTrainee.programme,
  batch: currentTrainee.batch,
  institution: currentTrainee.institution,
  enrolledOn: currentTrainee.enrolledOn,
  hostelBed: "Block A · Room 214 · Bed 02",
};

/** Skills the AI mock interview targets when the learner has not typed a role. */
export const COMMON_INTERVIEW_ROLES = [
  "Dairy Procurement Supervisor",
  "PACS Accounts Assistant",
  "Cooperative Extension Officer",
  "Rural Marketing Executive",
  "Cold Chain Logistics Lead",
] as const;