// =============================================================================
// Eligibility Service — deterministic eligibility engine
// =============================================================================
import type { EligibilityRule } from "@/types/programme";

export interface TraineeProfile {
  education: string;         // "8th Pass" | "10th Pass" | "12th Pass" | "Graduate" | "Post-Graduate"
  age: number;
  gender: string;            // "Male" | "Female" | "Other"
  cooperativeMembership: string; // e.g. "Haveli Taluka PACS" or "" if none
  experience: number;        // years
  state: string;
  district: string;
  occupation: string;
}

export interface EligibilityCheckResult {
  overall: "eligible" | "not_eligible" | "conditional";
  details: {
    ruleId: string;
    label: string;
    description: string;
    met: boolean;
    reason?: string;
  }[];
  summary: string;
}

const EDUCATION_RANK: Record<string, number> = {
  "8th Pass": 1,
  "10th Pass": 2,
  "12th Pass": 3,
  "Graduate": 4,
  "Post-Graduate": 5,
};

export function checkEligibility(
  rules: EligibilityRule[],
  profile: TraineeProfile
): EligibilityCheckResult {
  const details = rules.map((rule) => {
    let met = false;
    let reason: string | undefined;

    switch (rule.field) {
      case "education": {
        if (rule.operator === "in" && Array.isArray(rule.value)) {
          const requiredRanks = (rule.value as string[]).map((e) => EDUCATION_RANK[e] ?? 0);
          const minRequired = Math.min(...requiredRanks);
          const profileRank = EDUCATION_RANK[profile.education] ?? 0;
          met = profileRank >= minRequired;
          if (!met) reason = `Your qualification (${profile.education}) does not meet the minimum requirement.`;
        }
        break;
      }
      case "age": {
        if (rule.operator === "gte") met = profile.age >= (rule.value as number);
        else if (rule.operator === "lte") met = profile.age <= (rule.value as number);
        if (!met) reason = `Age requirement: ${rule.operator === "gte" ? "at least" : "at most"} ${rule.value} years. Your age: ${profile.age}.`;
        break;
      }
      case "cooperativeMembership": {
        met = Boolean(profile.cooperativeMembership && profile.cooperativeMembership.trim().length > 0);
        if (!met) reason = "Cooperative membership is required but not provided.";
        break;
      }
      case "experience": {
        if (rule.operator === "gte") met = profile.experience >= (rule.value as number);
        if (!met) reason = `Minimum ${rule.value} year(s) of experience required. Your experience: ${profile.experience} year(s).`;
        break;
      }
      case "gender": {
        if (rule.operator === "eq") met = profile.gender.toLowerCase() === (rule.value as string).toLowerCase();
        if (!met) reason = `This programme is restricted to ${rule.value} participants.`;
        break;
      }
      default:
        met = true;
    }

    return {
      ruleId: rule.field,
      label: rule.label,
      description: rule.description,
      met,
      reason,
    };
  });

  const hardFails = details.filter((d) => !d.met);
  const overall: EligibilityCheckResult["overall"] =
    hardFails.length === 0 ? "eligible" : "not_eligible";

  const summary =
    overall === "eligible"
      ? "You meet all eligibility requirements and can apply for this programme."
      : `You do not meet ${hardFails.length} eligibility requirement(s). Please review the details below.`;

  return { overall, details, summary };
}

// Default demo trainee profile
export const DEMO_TRAINEE_PROFILE: TraineeProfile = {
  education: "Graduate",
  age: 33,
  gender: "Male",
  cooperativeMembership: "Haveli Taluka PACS",
  experience: 4,
  state: "Maharashtra",
  district: "Nashik",
  occupation: "PACS Secretary",
};

// Recommendation engine — deterministic based on profile skills
export function getRecommendationReason(
  programmeId: string,
  profile: TraineeProfile
): string | null {
  const reasons: Record<string, string> = {
    "prog-pacs-accounting-002": "Strengthens your PACS Accounting skills and adds digital proficiency critical for your PACS Secretary role.",
    "prog-coop-finance-006": "Builds on your cooperative experience and adds financial management skills needed for career advancement.",
    "prog-cold-chain-009": "Complements your Dairy Operations experience with advanced cold chain and quality management skills.",
    "prog-coop-mgmt-001": "Provides a strong governance foundation relevant to your current PACS Secretary position.",
    "prog-coop-law-010": "Addresses the cooperative law knowledge gap important for a PACS Secretary role.",
    "prog-coop-leadership-011": "Prepares you for senior cooperative leadership based on your 4 years of field experience.",
  };
  return reasons[programmeId] ?? null;
}
