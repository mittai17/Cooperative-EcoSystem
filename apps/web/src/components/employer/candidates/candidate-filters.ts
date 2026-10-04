import type { CandidateSummary, SkillLevel } from "@/lib/employer/candidates-api";

export interface CandidateFilterState {
  education: string;
  minExperience: number;
  certification: "any" | "yes";
  availability: string;
  proficiency: "any" | SkillLevel;
  minMatch: number;
}

export const EMPTY_CANDIDATE_FILTERS: CandidateFilterState = {
  education: "any",
  minExperience: 0,
  certification: "any",
  availability: "any",
  proficiency: "any",
  minMatch: 0,
};

export const EDUCATION_OPTIONS = [
  { value: "any", label: "Any education" },
  { value: "10th", label: "10th pass" },
  { value: "12th", label: "12th pass" },
  { value: "diploma", label: "Diploma / ITI" },
  { value: "graduate", label: "Graduate" },
  { value: "postgraduate", label: "Postgraduate" },
];

export const EXPERIENCE_OPTIONS = [
  { value: "0", label: "Any experience" },
  { value: "1", label: "1+ years" },
  { value: "3", label: "3+ years" },
  { value: "5", label: "5+ years" },
];

export const PROFICIENCY_OPTIONS = [
  { value: "any", label: "Any level" },
  { value: "Foundational", label: "Foundational" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Proficient", label: "Proficient" },
  { value: "Expert", label: "Expert" },
];

export const MATCH_FLOOR_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "65", label: "65% and above" },
  { value: "75", label: "75% and above" },
  { value: "80", label: "80% and above" },
];

export function countActiveFilters(filters: CandidateFilterState): number {
  return [
    filters.education !== "any",
    filters.minExperience > 0,
    filters.certification !== "any",
    filters.availability !== "any",
    filters.proficiency !== "any",
    filters.minMatch > 0,
  ].filter(Boolean).length;
}

/**
 * Applies the client-side filters. A filter only excludes a candidate when the
 * record carries the field; the UI disables filters whose field the API never returns.
 */
export function applyCandidateFilters<T extends CandidateSummary>(
  candidates: T[],
  filters: CandidateFilterState,
): T[] {
  return candidates.filter((candidate) => {
    if (filters.education !== "any" && candidate.education_level) {
      if (!candidate.education_level.toLowerCase().includes(filters.education.toLowerCase())) return false;
    }
    if (filters.minExperience > 0 && typeof candidate.years_of_experience === "number") {
      if (candidate.years_of_experience < filters.minExperience) return false;
    }
    if (filters.certification === "yes" && typeof candidate.certificate_count === "number") {
      if (candidate.certificate_count < 1) return false;
    }
    if (filters.availability !== "any" && candidate.availability) {
      if (!candidate.availability.toLowerCase().includes(filters.availability.toLowerCase())) return false;
    }
    if (filters.proficiency !== "any" && candidate.skills) {
      if (!candidate.skills.some((skill) => skill.level === filters.proficiency)) return false;
    }
    if (filters.minMatch > 0 && candidate.match_score !== null) {
      if (candidate.match_score < filters.minMatch) return false;
    }
    return true;
  });
}
