import type { MatchResult } from "@/lib/employer/candidates-api";
import { applyCandidateFilters, type CandidateFilterState, EMPTY_CANDIDATE_FILTERS } from "../candidates/candidate-filters";

export interface MatchFilterState extends CandidateFilterState {
  skill: string;
  location: string;
  language: string;
}

export const EMPTY_MATCH_FILTERS: MatchFilterState = {
  ...EMPTY_CANDIDATE_FILTERS,
  skill: "",
  location: "",
  language: "",
};

export function countMatchFilters(filters: MatchFilterState): number {
  return [
    filters.skill.trim(),
    filters.location.trim(),
    filters.language.trim(),
    filters.education !== "any",
    filters.minExperience > 0,
    filters.certification !== "any",
    filters.availability !== "any",
  ].filter(Boolean).length;
}

function includesText(value: string | null | undefined, needle: string): boolean {
  return (value ?? "").toLowerCase().includes(needle.toLowerCase());
}

/** Applies every filter to the result list. A field the API did not return never excludes a candidate. */
export function applyMatchFilters(results: MatchResult[], filters: MatchFilterState): MatchResult[] {
  const byCandidateFields = applyCandidateFilters(
    results.map((result) => result.candidate),
    filters,
  );
  const allowed = new Set(byCandidateFields.map((candidate) => candidate.id));
  return results.filter((result) => {
    if (!allowed.has(result.candidate.id)) return false;
    if (filters.skill.trim()) {
      const held = [
        ...result.matched_skills.map((skill) => skill.name),
        ...(result.candidate.skills ?? []).map((skill) => skill.name),
      ];
      if (!held.some((name) => includesText(name, filters.skill.trim()))) return false;
    }
    if (filters.location.trim() && !includesText(result.candidate.location, filters.location.trim())) return false;
    if (filters.language.trim() && result.candidate.languages) {
      if (!result.candidate.languages.some((lang) => includesText(lang, filters.language.trim()))) return false;
    }
    return true;
  });
}
