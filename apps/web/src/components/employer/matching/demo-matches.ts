/**
 * Offline fallback for AI Matching. Uses the existing deterministic demo scorer
 * (`buildMatch`) and maps its output to the API result shape. Every value here is
 * fictional, and the page labels the whole view with the demo-data tag.
 */
import {
  buildMatch,
  employerMatchCandidates,
  employerPostings,
  type CandidateMatch,
  type EmployerPosting,
} from "@/lib/mock-data/employer";
import type { FactorStatus, JobMatchesResponse, MatchResult } from "@/lib/employer/candidates-api";

export function demoPostingOptions(): { id: string; title: string; status: string }[] {
  return employerPostings.map((posting) => ({ id: posting.id, title: posting.title, status: "open" }));
}

function toMatchResult(match: CandidateMatch, posting: EmployerPosting): MatchResult {
  const candidate = match.candidate;
  const validCertificates = candidate.certificates.filter((item) => item.status === "Valid");
  const depth = match.rows.find((row) => row.key === "depth");
  const depthPct = depth ? depth.achieved : null;
  const requiredTotal = posting.required.length;
  const matchedCount = match.matched.length;

  const requiredStatus: FactorStatus =
    matchedCount === 0 ? "missing" : matchedCount >= requiredTotal ? "matched" : "partial";
  const depthStatus: FactorStatus =
    depthPct === null ? "unknown" : depthPct >= 75 ? "matched" : depthPct > 0 ? "partial" : "missing";
  const locationMatched = posting.location.toLowerCase().includes(candidate.state.toLowerCase());
  const certifiedSkills = new Set(validCertificates.flatMap((item) => item.skillsCertified));

  const explanation: MatchResult["explanation"] = [
    ...match.matched.map((item) => ({
      kind: "match" as const,
      text: `${item.skill.name} is verified at ${item.skill.level} level${item.certificateBacked ? " and backed by a valid certificate" : ""}.`,
    })),
    ...match.gaps.map((gap) => ({
      kind: "gap" as const,
      text: `${gap.skill} is required${gap.mandatory ? " (mandatory)" : ""} but not verified on the passport.`,
    })),
  ];

  return {
    candidate: {
      id: candidate.id,
      name: candidate.name,
      location: `${candidate.district}, ${candidate.state}`,
      occupation: candidate.currentRole,
      match_score: match.score,
      certificate_count: validCertificates.length,
      skills: candidate.skills.map((skill) => ({ name: skill.name, level: skill.level, verified: skill.verified })),
    },
    score: match.score,
    breakdown: {
      required_skills: {
        status: requiredStatus,
        value: matchedCount,
        total: requiredTotal,
        detail: `${matchedCount} of ${requiredTotal} required skills held at verified level.`,
      },
      skill_proficiency: {
        status: depthStatus,
        value: depthPct,
        detail: depth?.detail ?? null,
      },
      certification: {
        status: certifiedSkills.size > 0 ? "matched" : "missing",
        detail: `${validCertificates.length} valid certificate${validCertificates.length === 1 ? "" : "s"} on record.`,
      },
      location: {
        status: locationMatched ? "matched" : "partial",
        detail: `Candidate in ${candidate.state}; posting in ${posting.location}.`,
      },
    },
    matched_skills: match.matched.map((item) => ({
      name: item.skill.name,
      level: item.skill.level,
      verified: item.skill.verified,
    })),
    missing_skills: match.gaps.map((gap) => gap.skill),
    explanation,
    recommended_action: null,
    is_demo: true,
  };
}

/** Demo equivalent of `GET /employer/jobs/{id}/matches` for one posting. */
export function demoJobMatches(jobId: string): JobMatchesResponse {
  const posting = employerPostings.find((item) => item.id === jobId) ?? employerPostings[0];
  const matches = employerMatchCandidates
    .map((candidate) => toMatchResult(buildMatch(candidate, posting), posting))
    .sort((a, b) => b.score - a.score);
  return {
    job: { id: posting.id, title: posting.title, required_skills: posting.required },
    matches,
  };
}
