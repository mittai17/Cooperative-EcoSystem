/**
 * Employer workspace demo data: explainable AI candidate matches plus the
 * application pipeline for the CoopSetu AI frontend-first build (SIH 2026,
 * problem statement PS 26087).
 *
 * Every candidate, posting, mark, certificate and feedback record below is
 * SYNTHETIC. Names are drawn from the shared CoopSetu demo cast (see
 * `mock-data/dashboards.ts`, `mock-data/institution.ts`) so the employer,
 * institution and trainee screens describe one coherent fictional world.
 * Nothing here is a real learner, employer or NCCT record, and pages must say so
 * with the `.demo-data-tag` chip from `globals.css`.
 *
 * ---------------------------------------------------------------------------
 * The match scorer
 * ---------------------------------------------------------------------------
 * `buildMatch()` is a purely deterministic scorer. It belongs to the same model
 * family as `lib/job-match.ts` - verified Skill Passport skills intersected
 * with a posting's required skills - extended with four more factors so an
 * employer can audit every single point of the score. There is no randomness
 * and no network call: the same candidate + posting always yields the same
 * number, and the per-factor points are made to sum exactly to that number
 * (see `allocatePoints`) so the breakdown on screen can never contradict the
 * headline score.
 */

import { courses } from "@/lib/mock-data/courses";
import type { CertificateStatus, Course, EvidenceType, SkillLevel } from "@/lib/types";

/** Fixed reference day for the employer demo dataset (Sunday, 27 September 2026). */
export const EMPLOYER_DEMO_TODAY = "2026-09-27";

/* -------------------------------------------------------------------------- */
/* Match model                                                                 */
/* -------------------------------------------------------------------------- */

export type MatchFactorKey = "mandatory" | "overlap" | "depth" | "evidence" | "vector";

export interface MatchFactor {
  key: MatchFactorKey;
  label: string;
  /** Share of the final score, 0-1. `MATCH_FACTORS` weights sum to exactly 1. */
  weight: number;
  /** Plain-English statement of how `achieved` is computed, shown in the UI. */
  basis: string;
}

/**
 * Evidence points budget: 5 certificate-covered skills x 12 + 5 graded
 * assessments x 6 + 2 projects x 8 + 2 employer reviews x 10 = 126.
 */
export const EVIDENCE_BUDGET = 126;

const CERT_EVIDENCE_POINTS = 12;
const ASSESSMENT_EVIDENCE_POINTS = 6;
const PROJECT_EVIDENCE_POINTS = 8;
const FEEDBACK_EVIDENCE_POINTS = 10;

/**
 * The five scored factors. Weights are fixed in code (and mirrored, editable, in
 * NCCT settings) so a score is reproducible: 0.30 + 0.25 + 0.15 + 0.15 + 0.15 = 1.
 */
export const MATCH_FACTORS: MatchFactor[] = [
  {
    key: "mandatory",
    label: "Mandatory requirements met",
    weight: 0.3,
    basis: "Share of the posting's non-negotiable requirements the candidate already holds at verified level.",
  },
  {
    key: "overlap",
    label: "Skill overlap",
    weight: 0.25,
    basis: "Required skills present on the verified Skill Passport, divided by every required skill on the posting.",
  },
  {
    key: "depth",
    label: "Proficiency depth",
    weight: 0.15,
    basis: "Mean proficiency of the matched skills on the four-step ladder: Foundational 0.25, Intermediate 0.50, Proficient 0.75, Expert 1.00.",
  },
  {
    key: "evidence",
    label: "Evidence strength",
    weight: 0.15,
    basis: `Points banked from verifiable artefacts only - valid certificates covering matched skills, graded assessments, project work and employer reviews - against a ${EVIDENCE_BUDGET}-point budget.`,
  },
  {
    key: "vector",
    label: "Semantic vector similarity",
    weight: 0.15,
    basis: "Sorensen-Dice overlap between the posting vector (required skills + sector) and the passport vector (skills + categories). The production matcher uses a sentence-embedding cosine; this deterministic lexical stand-in keeps the demo auditable offline.",
  },
];

/** Level-to-depth ladder used by the proficiency factor. */
const LEVEL_DEPTH: Record<SkillLevel, number> = {
  Foundational: 0.25,
  Intermediate: 0.5,
  Proficient: 0.75,
  Expert: 1,
};

/* -------------------------------------------------------------------------- */
/* Candidate evidence records                                                  */
/* -------------------------------------------------------------------------- */

export interface SkillSignal {
  name: string;
  category: string;
  level: SkillLevel;
  /** Passport confidence for this skill, 0-100. */
  confidence: number;
  /** Only verified skills count towards a match, same rule as `lib/job-match.ts`. */
  verified: boolean;
  /**
   * The single artefact that justifies the skill. The UI prints this next to
   * every skill so a reviewer can see the AI is not inventing capabilities.
   */
  source: {
    type: EvidenceType;
    title: string;
    date: string;
    issuer: string;
  };
}

export interface CandidateAssessmentRecord {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  date: string;
  grader: string;
}

export interface CandidateCertificateRecord {
  id: string;
  programme: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: CertificateStatus;
  grade: string;
  skillsCertified: string[];
}

export interface CandidateProjectRecord {
  title: string;
  summary: string;
  outcome: string;
}

export interface CandidateFeedbackRecord {
  employer: string;
  role: string;
  rating: number;
  submittedOn: string;
  strengths: string;
  gaps: string;
}

export interface EmployerMatchCandidate {
  id: string;
  name: string;
  passportId: string;
  state: string;
  district: string;
  currentRole: string;
  headline: string;
  /** Posting this candidate is being scored against. */
  jobId: string;
  sessionsAttended: number;
  sessionsTotal: number;
  passportUpdatedOn: string;
  skills: SkillSignal[];
  assessments: CandidateAssessmentRecord[];
  certificates: CandidateCertificateRecord[];
  projects: CandidateProjectRecord[];
  feedback: CandidateFeedbackRecord[];
}

export interface EmployerPosting {
  id: string;
  title: string;
  sector: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Apprenticeship";
  salaryRange: string;
  openings: number;
  /** Every skill the posting asks for - drives the overlap factor. */
  required: string[];
  /** The subset an applicant cannot be considered without - drives the gate. */
  mandatory: string[];
}

/* -------------------------------------------------------------------------- */
/* Derived match result                                                        */
/* -------------------------------------------------------------------------- */

export interface MatchedSkill {
  skill: SkillSignal;
  /** True when a currently valid certificate also certifies this skill. */
  certificateBacked: boolean;
}

export interface SkillGap {
  skill: string;
  mandatory: boolean;
  /** Single best course on the platform that closes this specific gap. */
  course: Course;
  reason: string;
}

export interface MatchBreakdownRow {
  key: MatchFactorKey;
  label: string;
  weight: number;
  /** Percentage of the factor satisfied, 0-100, one decimal. */
  achieved: number;
  /** Points this factor contributed, one decimal, summing exactly to `score`. */
  points: number;
  basis: string;
  detail: string;
}

export interface CandidateMatch {
  candidate: EmployerMatchCandidate;
  posting: EmployerPosting;
  /** 0-100. Equals the sum of `rows[].points`, rounded to a whole number. */
  score: number;
  rows: MatchBreakdownRow[];
  matched: MatchedSkill[];
  gaps: SkillGap[];
  attendancePct: number;
  averageAssessmentPct: number;
}

/* -------------------------------------------------------------------------- */
/* Deterministic scorer                                                        */
/* -------------------------------------------------------------------------- */

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function verifiedSkillIndex(candidate: EmployerMatchCandidate): Set<string> {
  return new Set(candidate.skills.filter((skill) => skill.verified).map((skill) => normalise(skill.name)));
}

function matchedSkills(candidate: EmployerMatchCandidate, posting: EmployerPosting): MatchedSkill[] {
  const verified = verifiedSkillIndex(candidate);
  const validCertified = new Set(
    candidate.certificates
      .filter((certificate) => certificate.status === "Valid")
      .flatMap((certificate) => certificate.skillsCertified.map(normalise)),
  );
  return posting.required
    .filter((skill) => verified.has(normalise(skill)))
    .map((skill) => {
      const record = candidate.skills.find((item) => normalise(item.name) === normalise(skill));
      const signal: SkillSignal = record ?? {
        name: skill,
        category: "Unmapped",
        level: "Foundational",
        confidence: 0,
        verified: true,
        source: { type: "Course", title: "Imported record", date: EMPLOYER_DEMO_TODAY, issuer: "CoopSetu passport import" },
      };
      return { skill: signal, certificateBacked: validCertified.has(normalise(skill)) };
    });
}

function mandatoryAchieved(candidate: EmployerMatchCandidate, posting: EmployerPosting): { pct: number; detail: string } {
  if (posting.mandatory.length === 0) {
    return { pct: 100, detail: "Posting declares no non-negotiable requirement." };
  }
  const held = verifiedSkillIndex(candidate);
  const met = posting.mandatory.filter((skill) => held.has(normalise(skill)));
  const detail =
    met.length === posting.mandatory.length
      ? `All ${posting.mandatory.length} mandatory requirements verified: ${met.join(", ")}.`
      : `${met.length} of ${posting.mandatory.length} mandatory requirements verified. Still open: ${posting.mandatory
          .filter((skill) => !held.has(normalise(skill)))
          .join(", ")}.`;
  return { pct: (met.length / posting.mandatory.length) * 100, detail };
}

function overlapAchieved(
  matched: MatchedSkill[],
  posting: EmployerPosting,
): { pct: number; detail: string } {
  if (posting.required.length === 0) {
    return { pct: 100, detail: "Posting lists no required skills." };
  }
  const detail = `${matched.length} of ${posting.required.length} required skills are on the verified passport.`;
  return { pct: (matched.length / posting.required.length) * 100, detail };
}

function depthAchieved(matched: MatchedSkill[]): { pct: number; detail: string } {
  if (matched.length === 0) {
    return { pct: 0, detail: "No required skill is verified, so there is no proficiency depth to score." };
  }
  const mean = matched.reduce((sum, item) => sum + LEVEL_DEPTH[item.skill.level], 0) / matched.length;
  const atOrAbove = matched.filter((item) => LEVEL_DEPTH[item.skill.level] >= 0.75).length;
  return {
    pct: mean * 100,
    detail: `Mean ladder position ${round1(mean * 100)}%; ${atOrAbove} of ${matched.length} matched skills at Proficient or better.`,
  };
}

function evidenceAchieved(candidate: EmployerMatchCandidate, matched: MatchedSkill[]): { pct: number; detail: string } {
  const certificateBacked = matched.filter((item) => item.certificateBacked).length;
  const certPoints = Math.min(5, certificateBacked) * CERT_EVIDENCE_POINTS;
  const assessmentPoints = Math.min(5, candidate.assessments.length) * ASSESSMENT_EVIDENCE_POINTS;
  const projectPoints = Math.min(2, candidate.projects.length) * PROJECT_EVIDENCE_POINTS;
  const feedbackPoints = Math.min(2, candidate.feedback.length) * FEEDBACK_EVIDENCE_POINTS;
  const earned = certPoints + assessmentPoints + projectPoints + feedbackPoints;
  return {
    pct: (earned / EVIDENCE_BUDGET) * 100,
    detail: `${earned} of ${EVIDENCE_BUDGET} points - ${certificateBacked} certificate-backed skills (${certPoints}), ${candidate.assessments.length} graded assessments (${assessmentPoints}), ${candidate.projects.length} projects (${projectPoints}), ${candidate.feedback.length} employer reviews (${feedbackPoints}).`,
  };
}

function postingVector(posting: EmployerPosting): Set<string> {
  return new Set([...posting.required, ...posting.mandatory, posting.sector].map(normalise));
}

function passportVector(candidate: EmployerMatchCandidate): Set<string> {
  return new Set([
    ...candidate.skills.map((skill) => normalise(skill.name)),
    ...candidate.skills.map((skill) => normalise(skill.category)),
  ]);
}

function vectorAchieved(candidate: EmployerMatchCandidate, posting: EmployerPosting): { pct: number; detail: string } {
  const a = postingVector(posting);
  const b = passportVector(candidate);
  const shared = [...a].filter((term) => b.has(term));
  const dice = a.size + b.size === 0 ? 1 : (2 * shared.length) / (a.size + b.size);
  return {
    pct: dice * 100,
    detail: `${shared.length} of ${a.size} posting terms found in the passport vector${shared.length > 0 ? ` (${shared.slice(0, 3).join(", ")}${shared.length > 3 ? ", ..." : ""})` : ""}.`,
  };
}

/**
 * Converts raw weighted points into whole numbers that sum EXACTLY to the
 * headline score. Each factor is rounded on its own, then the rounding residue
 * is added to the heaviest factor (ties broken by declaration order) so the
 * visible breakdown can never add up to a different number than the badge.
 */
function allocatePoints(
  raw: { key: MatchFactorKey; weight: number; value: number }[],
  score: number,
): Map<MatchFactorKey, number> {
  // `value` is the factor weight applied to the achieved percentage, so rounding
  // it keeps every printed row faithful to the maths behind the headline score.
  const rounded = raw.map((row) => ({ key: row.key, value: Math.round(row.value) }));
  const residue = score - rounded.reduce((sum, row) => sum + row.value, 0);
  if (residue !== 0 && rounded.length > 0) {
    let target = 0;
    for (let index = 1; index < rounded.length; index += 1) {
      if (raw[index].weight > raw[target].weight) target = index;
    }
    rounded[target].value += residue;
  }
  return new Map(rounded.map((row) => [row.key, row.value]));
}

/** Picks the single course that best closes one specific skill gap. */
export function bestCourseForSkill(skill: string, posting: EmployerPosting): { course: Course; reason: string } {
  const bySkill = courses.find((course) => course.skills.some((item) => normalise(item) === normalise(skill)));
  if (bySkill) {
    return { course: bySkill, reason: "Covers this exact skill in its syllabus." };
  }
  const bySector = courses.find((course) => course.category === posting.sector);
  if (bySector) {
    return { course: bySector, reason: `Closest match in the posting sector, ${posting.sector}.` };
  }
  return { course: courses[0], reason: "Highest-enrolment foundation course on the platform." };
}

/** Scores one candidate against one posting. Deterministic and side-effect free. */
export function buildMatch(candidate: EmployerMatchCandidate, posting: EmployerPosting): CandidateMatch {
  const matched = matchedSkills(candidate, posting);
  const matchedNames = new Set(matched.map((item) => normalise(item.skill.name)));
  const verified = verifiedSkillIndex(candidate);

  const mandatory = mandatoryAchieved(candidate, posting);
  const overlap = overlapAchieved(matched, posting);
  const depth = depthAchieved(matched);
  const evidence = evidenceAchieved(candidate, matched);
  const vector = vectorAchieved(candidate, posting);

  const achievedByKey: Record<MatchFactorKey, { pct: number; detail: string }> = {
    mandatory,
    overlap,
    depth,
    evidence,
    vector,
  };

  const raw = MATCH_FACTORS.map((factor) => ({
    key: factor.key,
    weight: factor.weight,
    value: factor.weight * achievedByKey[factor.key].pct,
  }));
  const score = Math.round(raw.reduce((sum, row) => sum + row.value, 0));
  const points = allocatePoints(raw, score);

  const rows: MatchBreakdownRow[] = MATCH_FACTORS.map((factor) => ({
    key: factor.key,
    label: factor.label,
    weight: factor.weight,
    achieved: round1(achievedByKey[factor.key].pct),
    points: (points.get(factor.key) ?? 0),
    basis: factor.basis,
    detail: achievedByKey[factor.key].detail,
  }));

  const gaps: SkillGap[] = posting.required
    .filter((skill) => !matchedNames.has(normalise(skill)))
    .map((skill) => {
      const isMandatory = posting.mandatory.some((item) => normalise(item) === normalise(skill));
      const { course, reason } = bestCourseForSkill(skill, posting);
      const heldButUnverified = candidate.skills.find(
        (item) => normalise(item.name) === normalise(skill) && !verified.has(normalise(item.name)),
      );
      return {
        skill,
        mandatory: isMandatory,
        course,
        reason: heldButUnverified ? `On the passport but awaiting verification. ${reason}` : reason,
      };
    });

  const attendancePct =
    candidate.sessionsTotal === 0
      ? 0
      : Math.round((candidate.sessionsAttended / candidate.sessionsTotal) * 100);
  const averageAssessmentPct =
    candidate.assessments.length === 0
      ? 0
      : Math.round(
          candidate.assessments.reduce((sum, item) => sum + (item.score / item.maxScore) * 100, 0) /
            candidate.assessments.length,
        );

  return { candidate, posting, score, rows, matched, gaps, attendancePct, averageAssessmentPct };
}

/* -------------------------------------------------------------------------- */
/* Postings this employer account has open                                     */
/* -------------------------------------------------------------------------- */

export const employerPostings: EmployerPosting[] = [
  {
    id: "emp-job-dairy-supervisor",
    title: "Dairy Procurement Supervisor",
    sector: "Dairy & Agri-processing",
    location: "Anand, Gujarat",
    type: "Full-time",
    salaryRange: "Rs 22,000 - 28,000 / month",
    openings: 4,
    required: ["Dairy Operations", "Quality Testing", "Logistics Planning"],
    mandatory: ["Dairy Operations", "Quality Testing"],
  },
  {
    id: "emp-job-quality-analyst",
    title: "Quality & Compliance Analyst",
    sector: "Quality & Compliance",
    location: "Anand, Gujarat",
    type: "Full-time",
    salaryRange: "Rs 26,000 - 34,000 / month",
    openings: 2,
    required: ["Quality Testing", "Documentation", "Six Sigma Basics"],
    mandatory: ["Quality Testing"],
  },
  {
    id: "emp-job-mis-analyst",
    title: "MIS & Data Analyst - Cooperative Sector",
    sector: "Data & Analytics",
    location: "New Delhi",
    type: "Full-time",
    salaryRange: "Rs 35,000 - 45,000 / month",
    openings: 2,
    required: ["Data Analysis", "Dashboarding", "Spreadsheets"],
    mandatory: ["Data Analysis"],
  },
  {
    id: "emp-job-society-accountant",
    title: "Cooperative Society Accountant",
    sector: "Rural Finance",
    location: "Pune, Maharashtra",
    type: "Full-time",
    salaryRange: "Rs 18,000 - 24,000 / month",
    openings: 2,
    required: ["Bookkeeping", "Tally", "Statutory Compliance"],
    mandatory: ["Bookkeeping", "Tally"],
  },
  {
    id: "emp-job-store-manager",
    title: "Retail Store Manager - Cooperative Brand",
    sector: "Marketing & Sales",
    location: "Vadodara, Gujarat",
    type: "Full-time",
    salaryRange: "Rs 19,000 - 25,000 / month",
    openings: 1,
    required: ["Retail Operations", "Digital Marketing", "E-commerce"],
    mandatory: ["Retail Operations"],
  },
];

/* -------------------------------------------------------------------------- */
/* Candidates scored by the explainable matcher                               */
/* -------------------------------------------------------------------------- */

export const employerMatchCandidates: EmployerMatchCandidate[] = [
  {
    id: "cand-ravindra-patil",
    name: "Ravindra Suresh Patil",
    passportId: "SP-GJ-2026-004821",
    state: "Gujarat",
    district: "Anand",
    currentRole: "Milk Route Supervisor, Kheda District Dairy Union",
    headline: "Six years running procurement routes for 42 primary societies",
    jobId: "emp-job-dairy-supervisor",
    sessionsAttended: 138,
    sessionsTotal: 146,
    passportUpdatedOn: "2026-09-19",
    skills: [
      {
        name: "Dairy Operations",
        category: "Dairy & Agri-processing",
        level: "Proficient",
        confidence: 88,
        verified: true,
        source: {
          type: "Course",
          title: "Dairy Cooperative Operations",
          date: "2026-06-18",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Quality Testing",
        category: "Quality & Compliance",
        level: "Proficient",
        confidence: 82,
        verified: true,
        source: {
          type: "Assessment",
          title: "FAT/SNF Quality Testing Practical",
          date: "2026-06-20",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Logistics Planning",
        category: "Supply Chain",
        level: "Intermediate",
        confidence: 71,
        verified: true,
        source: {
          type: "Project",
          title: "Route consolidation plan for 12 collection routes",
          date: "2026-07-11",
          issuer: "Kheda District Progressive Dairy Union",
        },
      },
      {
        name: "Cold Chain Handling",
        category: "Dairy & Agri-processing",
        level: "Proficient",
        confidence: 79,
        verified: true,
        source: {
          type: "Employer Feedback",
          title: "Field internship review - Amul Dairy Cooperative Union",
          date: "2026-08-02",
          issuer: "Amul Dairy Cooperative Union",
        },
      },
    ],
    assessments: [
      {
        id: "asm-rav-1",
        title: "FAT/SNF Quality Testing Practical",
        score: 42,
        maxScore: 50,
        date: "2026-06-20",
        grader: "Er. Rajendra Patil",
      },
      {
        id: "asm-rav-2",
        title: "Route Economics Case Study",
        score: 33,
        maxScore: 40,
        date: "2026-07-04",
        grader: "Er. Rajendra Patil",
      },
      {
        id: "asm-rav-3",
        title: "Milk Procurement Software Practical",
        score: 46,
        maxScore: 50,
        date: "2026-07-18",
        grader: "Er. Rajendra Patil",
      },
      {
        id: "asm-rav-4",
        title: "Cold Chain Audit Simulation",
        score: 27,
        maxScore: 40,
        date: "2026-08-09",
        grader: "Smt. Nilima Trivedi",
      },
      {
        id: "asm-rav-5",
        title: "Member Grievance Handling Scenario",
        score: 34,
        maxScore: 40,
        date: "2026-08-26",
        grader: "Smt. Nilima Trivedi",
      },
    ],
    certificates: [
      {
        id: "CST-2026-DAI-00842",
        programme: "Dairy Cooperative Operations",
        issuer: "Institute of Rural Management, Anand",
        issueDate: "2026-06-18",
        expiryDate: "2029-06-18",
        status: "Valid",
        grade: "A (Distinction)",
        skillsCertified: ["Dairy Operations", "Quality Testing", "Logistics Planning"],
      },
    ],
    projects: [
      {
        title: "Route consolidation plan for 12 collection routes",
        summary: "Re-modelled collection timings and vehicle cycles across the Kheda belt.",
        outcome: "Cut idle vehicle hours by 17% over one procurement season.",
      },
      {
        title: "Chilling unit failure log analysis",
        summary: "Diagnosed repeat compressor trips on three route chillers.",
        outcome: "Vendor warranty claimed for two units, saving the society Rs 1.8 lakh.",
      },
    ],
    feedback: [
      {
        employer: "Amul Dairy Cooperative Union",
        role: "Field intern, procurement",
        rating: 4,
        submittedOn: "2026-08-02",
        strengths: "Reads FAT/SNF meters accurately and reconciles collection slips the same evening.",
        gaps: "Cold chain documentation lags by a day on two routes.",
      },
      {
        employer: "Kheda District Progressive Dairy Union",
        role: "Route supervisor",
        rating: 4,
        submittedOn: "2026-06-30",
        strengths: "Holds a route team of nine without escalations.",
        gaps: "Needs practice writing English board notes.",
      },
    ],
  },
  {
    id: "cand-sunita-yadav",
    name: "Sunita Devi Yadav",
    passportId: "SP-DL-2025-011930",
    state: "Delhi",
    district: "South Delhi",
    currentRole: "Society Accountant, Vaikunth Mehta PACS",
    headline: "Statutory registers and Tally for a 4,000-member primary society",
    jobId: "emp-job-society-accountant",
    sessionsAttended: 96,
    sessionsTotal: 104,
    passportUpdatedOn: "2026-09-12",
    skills: [
      {
        name: "Bookkeeping",
        category: "Finance & Accounts",
        level: "Proficient",
        confidence: 84,
        verified: true,
        source: {
          type: "Course",
          title: "Cooperative Bookkeeping with Tally",
          date: "2025-11-18",
          issuer: "NCUI Training Centre, Delhi",
        },
      },
      {
        name: "Tally",
        category: "Finance & Accounts",
        level: "Intermediate",
        confidence: 76,
        verified: true,
        source: {
          type: "Assessment",
          title: "Tally GST and bank reconciliation practical",
          date: "2025-12-01",
          issuer: "NCUI Training Centre, Delhi",
        },
      },
      {
        name: "Statutory Compliance",
        category: "Audit & Statutory",
        level: "Proficient",
        confidence: 81,
        verified: true,
        source: {
          type: "Course",
          title: "Cooperative Bookkeeping with Tally",
          date: "2025-11-18",
          issuer: "NCUI Training Centre, Delhi",
        },
      },
      {
        name: "Records Management",
        category: "Audit & Statutory",
        level: "Intermediate",
        confidence: 68,
        verified: true,
        source: {
          type: "Project",
          title: "Digitised member passbook register for 4,000 members",
          date: "2026-02-14",
          issuer: "Vaikunth Mehta PACS, Delhi",
        },
      },
    ],
    assessments: [
      {
        id: "asm-sun-1",
        title: "Tally GST and bank reconciliation practical",
        score: 43,
        maxScore: 50,
        date: "2025-12-01",
        grader: "Sh. Ramesh Iyer",
      },
      {
        id: "asm-sun-2",
        title: "Cooperative audit readiness exercise",
        score: 36,
        maxScore: 45,
        date: "2026-01-22",
        grader: "Sh. Ramesh Iyer",
      },
      {
        id: "asm-sun-3",
        title: "Share ledger and dividend computation",
        score: 31,
        maxScore: 40,
        date: "2026-03-09",
        grader: "Smt. Anuradha Rao",
      },
    ],
    certificates: [
      {
        id: "CST-2025-COOP-01193",
        programme: "Cooperative Management Fundamentals",
        issuer: "NCUI Training Centre, Delhi",
        issueDate: "2025-12-02",
        expiryDate: "2028-12-02",
        status: "Valid",
        grade: "B+",
        skillsCertified: ["Cooperative Management", "Governance", "Bylaws Drafting"],
      },
      {
        id: "CST-2026-BKG-01477",
        programme: "Cooperative Bookkeeping with Tally",
        issuer: "NCUI Training Centre, Delhi",
        issueDate: "2026-01-30",
        expiryDate: "2029-01-30",
        status: "Valid",
        grade: "A",
        skillsCertified: ["Bookkeeping", "Tally", "Statutory Compliance"],
      },
    ],
    projects: [
      {
        title: "Digitised member passbook register for 4,000 members",
        summary: "Moved the physical passbook register to a tracked digital sheet with a two-person sign-off.",
        outcome: "Reconciliation disputes at the AGM fell from nine to one.",
      },
    ],
    feedback: [
      {
        employer: "Vaikunth Mehta PACS, Delhi",
        role: "Society Accountant",
        rating: 5,
        submittedOn: "2026-08-28",
        strengths: "Audit file was complete and query-free for the first time in the society's history.",
        gaps: "Wants exposure to NABARD reporting formats.",
      },
    ],
  },
  {
    id: "cand-aslam-sheikh",
    name: "Mohammed Aslam Sheikh",
    passportId: "SP-MH-2024-003170",
    state: "Maharashtra",
    district: "Pune",
    currentRole: "Data Entry Operator, District PACS Union",
    headline: "Spreadsheet reporting for member defaults and procurement dashboards",
    jobId: "emp-job-mis-analyst",
    sessionsAttended: 61,
    sessionsTotal: 88,
    passportUpdatedOn: "2026-08-30",
    skills: [
      {
        name: "Data Analysis",
        category: "Data & Analytics",
        level: "Intermediate",
        confidence: 72,
        verified: true,
        source: {
          type: "Assessment",
          title: "Spreadsheet & dashboarding skill check",
          date: "2026-06-14",
          issuer: "VAMNICOM, Pune",
        },
      },
      {
        name: "Spreadsheets",
        category: "Data & Analytics",
        level: "Intermediate",
        confidence: 80,
        verified: true,
        source: {
          type: "Course",
          title: "Data Analysis for Cooperative Decision-Making",
          date: "2026-05-30",
          issuer: "VAMNICOM, Pune",
        },
      },
      {
        name: "Dashboarding",
        category: "Data & Analytics",
        level: "Foundational",
        confidence: 58,
        verified: false,
        source: {
          type: "Course",
          title: "Data Analysis for Cooperative Decision-Making",
          date: "2026-05-30",
          issuer: "VAMNICOM, Pune",
        },
      },
      {
        name: "Cooperative Management",
        category: "Governance",
        level: "Intermediate",
        confidence: 66,
        verified: true,
        source: {
          type: "Course",
          title: "Cooperative Management Fundamentals",
          date: "2024-03-27",
          issuer: "VAMNICOM, Pune",
        },
      },
    ],
    assessments: [
      {
        id: "asm-asl-1",
        title: "Spreadsheet & dashboarding skill check",
        score: 33,
        maxScore: 50,
        date: "2026-06-14",
        grader: "Sh. Suresh Nair",
      },
      {
        id: "asm-asl-2",
        title: "Member default-risk dashboard project",
        score: 29,
        maxScore: 40,
        date: "2026-06-28",
        grader: "Sh. Suresh Nair",
      },
      {
        id: "asm-asl-3",
        title: "Procurement variance analysis exercise",
        score: 24,
        maxScore: 40,
        date: "2026-07-25",
        grader: "Dr. Meenal Kulkarni",
      },
    ],
    certificates: [
      {
        id: "CST-2024-CRD-00317",
        programme: "Agricultural Credit Cooperative Management",
        issuer: "VAMNICOM, Pune",
        issueDate: "2024-03-27",
        expiryDate: "2027-03-27",
        status: "Valid",
        grade: "A",
        skillsCertified: ["Credit Appraisal", "Risk Management", "Compliance"],
      },
    ],
    projects: [
      {
        title: "Member default-risk dashboard",
        summary: "Built a repayment-behaviour tracker for 18 branch societies.",
        outcome: "Flagged 11 accounts for early follow-up in the first month.",
      },
    ],
    feedback: [],
  },
  {
    id: "cand-meenakshi-deshmukh",
    name: "Meenakshi Ramesh Deshmukh",
    passportId: "SP-GJ-2026-006113",
    state: "Gujarat",
    district: "Vadodara",
    currentRole: "Quality Lab Technician, Baroda Distillery Unit",
    headline: "Lab documentation and HACCP basics for a distillery quality unit",
    jobId: "emp-job-quality-analyst",
    sessionsAttended: 74,
    sessionsTotal: 80,
    passportUpdatedOn: "2026-09-21",
    skills: [
      {
        name: "Quality Testing",
        category: "Quality & Compliance",
        level: "Proficient",
        confidence: 86,
        verified: true,
        source: {
          type: "Assessment",
          title: "Milk composition analyser practical",
          date: "2026-08-14",
          issuer: "Laxmanrao Inamdar National Academy, Gandhinagar",
        },
      },
      {
        name: "Documentation",
        category: "Quality & Compliance",
        level: "Proficient",
        confidence: 83,
        verified: true,
        source: {
          type: "Project",
          title: "Standard operating procedure rewrite for the quality lab",
          date: "2026-08-30",
          issuer: "Baroda Distillery Unit",
        },
      },
      {
        name: "Six Sigma Basics",
        category: "Quality & Compliance",
        level: "Foundational",
        confidence: 54,
        verified: true,
        source: {
          type: "Course",
          title: "Quality systems foundation module",
          date: "2026-07-12",
          issuer: "Laxmanrao Inamdar National Academy, Gandhinagar",
        },
      },
      {
        name: "Six Sigma Green Belt",
        category: "Quality & Compliance",
        level: "Intermediate",
        confidence: 61,
        verified: true,
        source: {
          type: "Course",
          title: "Six Sigma Green Belt (elective)",
          date: "2026-08-02",
          issuer: "Gujarat Productivity Council",
        },
      },
    ],
    assessments: [
      {
        id: "asm-mee-1",
        title: "Milk composition analyser practical",
        score: 45,
        maxScore: 50,
        date: "2026-08-14",
        grader: "Dr. Kavita Deshmukh",
      },
      {
        id: "asm-mee-2",
        title: "Laboratory deviation reporting exercise",
        score: 38,
        maxScore: 45,
        date: "2026-08-28",
        grader: "Dr. Kavita Deshmukh",
      },
      {
        id: "asm-mee-3",
        title: "Root cause analysis on a batch rejection case",
        score: 32,
        maxScore: 40,
        date: "2026-09-11",
        grader: "Sh. Ramesh Iyer",
      },
    ],
    certificates: [
      {
        id: "CST-2026-QCL-00641",
        programme: "Quality Systems for Cooperative Units",
        issuer: "Laxmanrao Inamdar National Academy, Gandhinagar",
        issueDate: "2026-09-05",
        expiryDate: "2029-09-05",
        status: "Valid",
        grade: "A",
        skillsCertified: ["Quality Testing", "Documentation"],
      },
    ],
    projects: [
      {
        title: "Standard operating procedure rewrite for the quality lab",
        summary: "Re-documented 14 lab procedures to match FSSAI and internal audit expectations.",
        outcome: "Audit observations on documentation dropped from six to one.",
      },
    ],
    feedback: [],
  },
  {
    id: "cand-farida-khatoon",
    name: "Farida Khatoon",
    passportId: "SP-GJ-2026-007204",
    state: "Gujarat",
    district: "Kheda",
    currentRole: "Sales Associate, Kheda Weavers Cooperative",
    headline: "Counter sales and WhatsApp catalogue upkeep for a 1,800-member society",
    jobId: "emp-job-store-manager",
    sessionsAttended: 52,
    sessionsTotal: 66,
    passportUpdatedOn: "2026-09-05",
    skills: [
      {
        name: "Retail Operations",
        category: "Retail & Store Management",
        level: "Intermediate",
        confidence: 70,
        verified: true,
        source: {
          type: "Course",
          title: "Retail Operations for Cooperative Stores",
          date: "2026-07-19",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Digital Marketing",
        category: "Marketing & Sales",
        level: "Foundational",
        confidence: 57,
        verified: true,
        source: {
          type: "Project",
          title: "WhatsApp catalogue for 240 GI-tagged products",
          date: "2026-08-16",
          issuer: "Kheda Weavers Cooperative",
        },
      },
      {
        name: "E-commerce",
        category: "Marketing & Sales",
        level: "Intermediate",
        confidence: 64,
        verified: true,
        source: {
          type: "Course",
          title: "E-commerce onboarding for cooperative retail brands",
          date: "2026-07-19",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Cash Handling",
        category: "Retail & Store Management",
        level: "Proficient",
        confidence: 78,
        verified: true,
        source: {
          type: "Employer Feedback",
          title: "Counter duty review - Kheda Weavers Cooperative",
          date: "2026-09-01",
          issuer: "Kheda Weavers Cooperative",
        },
      },
    ],
    assessments: [
      {
        id: "asm-far-1",
        title: "Daily cash reconciliation exercise",
        score: 34,
        maxScore: 40,
        date: "2026-07-26",
        grader: "Ananya Bose",
      },
      {
        id: "asm-far-2",
        title: "Store opening checklist practical",
        score: 27,
        maxScore: 40,
        date: "2026-08-09",
        grader: "Ananya Bose",
      },
      {
        id: "asm-far-3",
        title: "Customer complaint handling scenario",
        score: 22,
        maxScore: 35,
        date: "2026-08-30",
        grader: "Smt. Nilima Trivedi",
      },
    ],
    certificates: [
      {
        id: "CST-2026-RET-00731",
        programme: "Retail Operations for Cooperative Stores",
        issuer: "Institute of Rural Management, Anand",
        issueDate: "2026-08-01",
        expiryDate: "2029-08-01",
        status: "Valid",
        grade: "B",
        skillsCertified: ["Retail Operations", "E-commerce"],
      },
    ],
    projects: [
      {
        title: "WhatsApp catalogue for 240 GI-tagged products",
        summary: "Photographed, priced and listed 240 products with size and weave charts.",
        outcome: "Orders through WhatsApp tripled in two months.",
      },
    ],
    feedback: [
      {
        employer: "Kheda Weavers Cooperative",
        role: "Sales Associate",
        rating: 4,
        submittedOn: "2026-09-01",
        strengths: "Daily cash reconciliation has not been short once in eight months.",
        gaps: "Needs stock reorder discipline on fast-moving lines.",
      },
    ],
  },
  {
    id: "cand-vikram-solanki",
    name: "Vikram Solanki",
    passportId: "SP-GJ-2026-004903",
    state: "Gujarat",
    district: "Kheda",
    currentRole: "Junior Accountant, Anand Taluka Kisan Sahakari Mandali",
    headline: "Ledger maintenance and member receipting, six months in role",
    jobId: "emp-job-society-accountant",
    sessionsAttended: 44,
    sessionsTotal: 60,
    passportUpdatedOn: "2026-08-27",
    skills: [
      {
        name: "Bookkeeping",
        category: "Finance & Accounts",
        level: "Foundational",
        confidence: 61,
        verified: true,
        source: {
          type: "Course",
          title: "Cooperative Bookkeeping with Tally",
          date: "2026-08-11",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Tally",
        category: "Finance & Accounts",
        level: "Foundational",
        confidence: 55,
        verified: true,
        source: {
          type: "Course",
          title: "Cooperative Bookkeeping with Tally",
          date: "2026-08-11",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Statutory Compliance",
        category: "Audit & Statutory",
        level: "Intermediate",
        confidence: 59,
        verified: false,
        source: {
          type: "Course",
          title: "Cooperative Bookkeeping with Tally",
          date: "2026-08-11",
          issuer: "Institute of Rural Management, Anand",
        },
      },
      {
        name: "Cooperative Management",
        category: "Governance",
        level: "Foundational",
        confidence: 58,
        verified: true,
        source: {
          type: "Course",
          title: "Cooperative Management Fundamentals",
          date: "2026-06-27",
          issuer: "Institute of Rural Management, Anand",
        },
      },
    ],
    assessments: [
      {
        id: "asm-vik-1",
        title: "Ledger reconciliation exercise",
        score: 24,
        maxScore: 40,
        date: "2026-08-20",
        grader: "Sh. Ramesh Iyer",
      },
      {
        id: "asm-vik-2",
        title: "Statutory register maintenance practical",
        score: 26,
        maxScore: 40,
        date: "2026-09-02",
        grader: "Sh. Ramesh Iyer",
      },
    ],
    certificates: [],
    projects: [
      {
        title: "Member receipt register digitisation",
        summary: "Converted 1,900 handwritten receipt entries into a searchable register.",
        outcome: "Passbook disputes now close within the same sitting.",
      },
    ],
    feedback: [],
  },
];

/** Pre-scored matches, highest score first. Recomputed with `buildMatch` on demand. */
export const employerMatches: CandidateMatch[] = employerMatchCandidates
  .map((candidate) => {
    const posting = employerPostings.find((item) => item.id === candidate.jobId);
    if (!posting) {
      throw new Error(`Employer match candidate ${candidate.id} references unknown posting ${candidate.jobId}`);
    }
    return buildMatch(candidate, posting);
  })
  .sort((a, b) => b.score - a.score);

/* -------------------------------------------------------------------------- */
/* Application pipeline                                                        */
/* -------------------------------------------------------------------------- */

export const APPLICATION_STAGES = ["Applied", "Shortlisted", "Interviewed", "Offered", "Hired"] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export interface ApplicationApplicant {
  passportId: string;
  name: string;
  state: string;
  district: string;
  headline: string;
  /** Score captured by the matcher at the moment the application was submitted. */
  matchScore: number;
  verifiedSkillCount: number;
  attendancePct: number;
}

export interface ApplicationDocument {
  id: string;
  label: string;
  kind: "Resume" | "Certificate" | "Assessment" | "ID proof";
  reference: string;
  status: "On file" | "Pending verification" | "Not uploaded";
  updatedOn: string;
}

export interface ApplicationStageEvent {
  stage: ApplicationStage;
  on: string;
  note: string;
}

export interface JobApplication {
  id: string;
  applicant: ApplicationApplicant;
  jobId: string;
  /** Stage the employer has moved the card to. Never derived from a counter. */
  stage: ApplicationStage;
  appliedOn: string;
  updatedOn: string;
  source: "AI match" | "Direct apply" | "Institution referral" | "CoopSetu job board";
  noticePeriod: string;
  /** True once the employer has confirmed the hire. Drives the feedback prompt. */
  hired: boolean;
  /** True once the employer has logged the post-hire feedback. */
  feedbackSubmitted: boolean;
  history: ApplicationStageEvent[];
  documents: ApplicationDocument[];
}

/** Builds the resume record attached to an application from its passport id. */
function resumeFor(passportId: string, updatedOn: string): ApplicationDocument {
  return {
    id: `doc-resume-${passportId.toLowerCase()}`,
    label: "Resume",
    kind: "Resume",
    reference: `RES-${passportId.slice(-6)}.pdf`,
    status: "On file",
    updatedOn,
  };
}

/** Builds the certificate bundle record, which may still await NCCT verification. */
function certificateFor(passportId: string, updatedOn: string, status: ApplicationDocument["status"]): ApplicationDocument {
  return {
    id: `doc-cert-${passportId.toLowerCase()}`,
    label: "Skill Passport certificate bundle",
    kind: "Certificate",
    reference: `CST-BUNDLE-${passportId.slice(-6)}`,
    status,
    updatedOn,
  };
}

/** Builds the assessment transcript record. */
function assessmentFor(passportId: string, updatedOn: string): ApplicationDocument {
  return {
    id: `doc-asm-${passportId.toLowerCase()}`,
    label: "Assessment transcript",
    kind: "Assessment",
    reference: `TRN-${passportId.slice(-6)}`,
    status: "On file",
    updatedOn,
  };
}

export const employerApplicationsSeed: JobApplication[] = [
  {
    id: "app-ravindra-dairy",
    applicant: {
      passportId: "SP-GJ-2026-004821",
      name: "Ravindra Suresh Patil",
      state: "Gujarat",
      district: "Anand",
      headline: "Six years running procurement routes for 42 primary societies",
      matchScore: 89,
      verifiedSkillCount: 9,
      attendancePct: 95,
    },
    jobId: "emp-job-dairy-supervisor",
    stage: "Offered",
    appliedOn: "2026-09-08",
    updatedOn: "2026-09-24",
    source: "AI match",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-08", note: "Applied from the AI match queue after a route economics screening call." },
      { stage: "Shortlisted", on: "2026-09-12", note: "Shortlisted: 89% match with both mandatory requirements verified." },
      { stage: "Interviewed", on: "2026-09-18", note: "Panel interview at the Anand collection centre, 46/50." },
      { stage: "Offered", on: "2026-09-24", note: "Offer letter issued for the Kheda route cluster, Rs 25,000 per month." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-004821", "2026-09-08"),
      certificateFor("SP-GJ-2026-004821", "2026-09-08", "On file"),
      assessmentFor("SP-GJ-2026-004821", "2026-09-09"),
    ],
  },
  {
    id: "app-meenakshi-quality",
    applicant: {
      passportId: "SP-GJ-2026-006113",
      name: "Meenakshi Ramesh Deshmukh",
      state: "Gujarat",
      district: "Vadodara",
      headline: "Lab documentation and HACCP basics for a distillery quality unit",
      matchScore: 81,
      verifiedSkillCount: 7,
      attendancePct: 93,
    },
    jobId: "emp-job-quality-analyst",
    stage: "Interviewed",
    appliedOn: "2026-09-02",
    updatedOn: "2026-09-19",
    source: "Institution referral",
    noticePeriod: "60 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-02", note: "Referred by Laxmanrao Inamdar National Academy, Gandhinagar." },
      { stage: "Shortlisted", on: "2026-09-06", note: "Shortlisted on documentation depth and lab practical scores." },
      { stage: "Interviewed", on: "2026-09-19", note: "Written test 78%, lab round scheduled for 2026-09-29." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-006113", "2026-09-02"),
      certificateFor("SP-GJ-2026-006113", "2026-09-03", "On file"),
    ],
  },
  {
    id: "app-sunita-accountant",
    applicant: {
      passportId: "SP-DL-2025-011930",
      name: "Sunita Devi Yadav",
      state: "Delhi",
      district: "South Delhi",
      headline: "Statutory registers and Tally for a 4,000-member primary society",
      matchScore: 82,
      verifiedSkillCount: 11,
      attendancePct: 92,
    },
    jobId: "emp-job-society-accountant",
    stage: "Hired",
    appliedOn: "2026-08-14",
    updatedOn: "2026-09-11",
    source: "CoopSetu job board",
    noticePeriod: "Serving notice accepted",
    hired: true,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-08-14", note: "Applied through the public job board with a verified Skill Passport." },
      { stage: "Shortlisted", on: "2026-08-18", note: "Shortlisted: both mandatory requirements verified." },
      { stage: "Interviewed", on: "2026-08-27", note: "Ledger test 41/50, audit-readiness viva passed." },
      { stage: "Offered", on: "2026-09-04", note: "Offer issued at Rs 22,000 per month." },
      { stage: "Hired", on: "2026-09-11", note: "Joining intimation sent; reporting date 2026-10-05." },
    ],
    documents: [
      resumeFor("SP-DL-2025-011930", "2026-08-14"),
      certificateFor("SP-DL-2025-011930", "2026-08-14", "On file"),
      assessmentFor("SP-DL-2025-011930", "2026-08-15"),
    ],
  },
  {
    id: "app-vikram-accountant",
    applicant: {
      passportId: "SP-GJ-2026-004903",
      name: "Vikram Solanki",
      state: "Gujarat",
      district: "Kheda",
      headline: "Ledger maintenance and member receipting, six months in role",
      matchScore: 63,
      verifiedSkillCount: 5,
      attendancePct: 73,
    },
    jobId: "emp-job-society-accountant",
    stage: "Shortlisted",
    appliedOn: "2026-09-09",
    updatedOn: "2026-09-16",
    source: "AI match",
    noticePeriod: "60 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-09", note: "Surfaced by the matcher with both mandatory requirements held but shallow." },
      { stage: "Shortlisted", on: "2026-09-16", note: "Shortlisted as a trainee accountant; needs a Tally refresher before audit season." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-004903", "2026-09-09"),
      certificateFor("SP-GJ-2026-004903", "2026-09-09", "Pending verification"),
    ],
  },
  {
    id: "app-farida-store",
    applicant: {
      passportId: "SP-GJ-2026-007204",
      name: "Farida Khatoon",
      state: "Gujarat",
      district: "Kheda",
      headline: "Counter sales and WhatsApp catalogue upkeep for a 1,800-member society",
      matchScore: 66,
      verifiedSkillCount: 4,
      attendancePct: 79,
    },
    jobId: "emp-job-store-manager",
    stage: "Applied",
    appliedOn: "2026-09-21",
    updatedOn: "2026-09-21",
    source: "CoopSetu job board",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-21", note: "Applied with a verified Skill Passport and three live artefacts." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-007204", "2026-09-21"),
    ],
  },
  {
    id: "app-aslam-mis",
    applicant: {
      passportId: "SP-MH-2024-003170",
      name: "Mohammed Aslam Sheikh",
      state: "Maharashtra",
      district: "Pune",
      headline: "Spreadsheet reporting for member defaults and procurement dashboards",
      matchScore: 70,
      verifiedSkillCount: 6,
      attendancePct: 69,
    },
    jobId: "emp-job-mis-analyst",
    stage: "Applied",
    appliedOn: "2026-09-17",
    updatedOn: "2026-09-17",
    source: "AI match",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-17", note: "Dashboarding is unverified, so the matcher flagged it as a training gap." },
    ],
    documents: [
      resumeFor("SP-MH-2024-003170", "2026-09-17"),
      certificateFor("SP-MH-2024-003170", "2026-09-17", "On file"),
    ],
  },
  {
    id: "app-priya-marketing",
    applicant: {
      passportId: "SP-WB-2026-004590",
      name: "Priya Ramesh Bose",
      state: "West Bengal",
      district: "Kolkata",
      headline: "ONDC storefront and catalogue work for a handloom weaver society",
      matchScore: 68,
      verifiedSkillCount: 5,
      attendancePct: 84,
    },
    jobId: "emp-job-store-manager",
    stage: "Applied",
    appliedOn: "2026-09-20",
    updatedOn: "2026-09-20",
    source: "Direct apply",
    noticePeriod: "Immediate",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-20", note: "Direct apply. One certificate on the passport is revoked, so evidence strength dropped." },
    ],
    documents: [
      resumeFor("SP-WB-2026-004590", "2026-09-20"),
      certificateFor("SP-WB-2026-004590", "2026-09-20", "Pending verification"),
    ],
  },
  {
    id: "app-imran-quality",
    applicant: {
      passportId: "SP-GJ-2025-009915",
      name: "Imran Husein Patel",
      state: "Gujarat",
      district: "Bharuch",
      headline: "Quality lab assistant with a cooperative dairy background",
      matchScore: 74,
      verifiedSkillCount: 6,
      attendancePct: 88,
    },
    jobId: "emp-job-quality-analyst",
    stage: "Shortlisted",
    appliedOn: "2026-09-10",
    updatedOn: "2026-09-20",
    source: "AI match",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-10", note: "Applied from the AI match queue." },
      { stage: "Shortlisted", on: "2026-09-20", note: "Shortlisted: strong quality testing evidence, documentation below the bar." },
    ],
    documents: [
      resumeFor("SP-GJ-2025-009915", "2026-09-10"),
      certificateFor("SP-GJ-2025-009915", "2026-09-11", "On file"),
    ],
  },
  {
    id: "app-rekha-dairy",
    applicant: {
      passportId: "SP-GJ-2026-005122",
      name: "Rekha Ashokbhai Prajapati",
      state: "Gujarat",
      district: "Anand",
      headline: "Milk collection clerk with cooperative bookkeeping experience",
      matchScore: 78,
      verifiedSkillCount: 5,
      attendancePct: 90,
    },
    jobId: "emp-job-dairy-supervisor",
    stage: "Shortlisted",
    appliedOn: "2026-09-11",
    updatedOn: "2026-09-18",
    source: "AI match",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-11", note: "Applied from the AI match queue at 78%." },
      { stage: "Shortlisted", on: "2026-09-18", note: "Shortlisted pending a logistics planning refresher recommendation." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-005122", "2026-09-11"),
      certificateFor("SP-GJ-2026-005122", "2026-09-11", "On file"),
    ],
  },
  {
    id: "app-harsh-mis",
    applicant: {
      passportId: "SP-GJ-2026-008877",
      name: "Harsh Dilipkumar Shah",
      state: "Gujarat",
      district: "Surat",
      headline: "MIS executive with state cooperative registry exposure",
      matchScore: 72,
      verifiedSkillCount: 6,
      attendancePct: 86,
    },
    jobId: "emp-job-mis-analyst",
    stage: "Shortlisted",
    appliedOn: "2026-09-13",
    updatedOn: "2026-09-22",
    source: "CoopSetu job board",
    noticePeriod: "60 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-13", note: "Applied with a verified passport and an employer letter." },
      { stage: "Shortlisted", on: "2026-09-22", note: "Shortlisted for a technical round on dashboard design." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-008877", "2026-09-13"),
      certificateFor("SP-GJ-2026-008877", "2026-09-14", "On file"),
      assessmentFor("SP-GJ-2026-008877", "2026-09-15"),
    ],
  },
  {
    id: "app-sameer-quality",
    applicant: {
      passportId: "SP-GJ-2026-009044",
      name: "Sameer Nilesh Joshi",
      state: "Gujarat",
      district: "Rajkot",
      headline: "Quality control technician in a food processing unit",
      matchScore: 71,
      verifiedSkillCount: 5,
      attendancePct: 82,
    },
    jobId: "emp-job-quality-analyst",
    stage: "Applied",
    appliedOn: "2026-09-22",
    updatedOn: "2026-09-22",
    source: "Direct apply",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-22", note: "Direct apply with a verified quality testing certificate." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-009044", "2026-09-22"),
    ],
  },
  {
    id: "app-nitin-dairy",
    applicant: {
      passportId: "SP-GJ-2026-003388",
      name: "Nitin Bharatsinh Chauhan",
      state: "Gujarat",
      district: "Banaskantha",
      headline: "Village society secretary with a dairy procurement portfolio",
      matchScore: 80,
      verifiedSkillCount: 8,
      attendancePct: 91,
    },
    jobId: "emp-job-dairy-supervisor",
    stage: "Interviewed",
    appliedOn: "2026-08-29",
    updatedOn: "2026-09-17",
    source: "Institution referral",
    noticePeriod: "60 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-08-29", note: "Referred by the district cooperative union." },
      { stage: "Shortlisted", on: "2026-09-03", note: "Shortlisted at 80% with all three required skills verified." },
      { stage: "Interviewed", on: "2026-09-17", note: "Route simulation exercise passed; awaiting written offer." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-003388", "2026-08-29"),
      certificateFor("SP-GJ-2026-003388", "2026-08-30", "On file"),
    ],
  },
  {
    id: "app-kavita-accountant",
    applicant: {
      passportId: "SP-GJ-2026-006701",
      name: "Kavita Rameshbhai Solanki",
      state: "Gujarat",
      district: "Anand",
      headline: "Society clerk with a bookkeeping certificate and audit support experience",
      matchScore: 76,
      verifiedSkillCount: 6,
      attendancePct: 87,
    },
    jobId: "emp-job-society-accountant",
    stage: "Offered",
    appliedOn: "2026-08-25",
    updatedOn: "2026-09-20",
    source: "CoopSetu job board",
    noticePeriod: "30 days",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-08-25", note: "Applied with a Tally-backed bookkeeping certificate." },
      { stage: "Shortlisted", on: "2026-08-28", note: "Shortlisted at 76%." },
      { stage: "Interviewed", on: "2026-09-09", note: "Register maintenance test 39/50." },
      { stage: "Offered", on: "2026-09-20", note: "Offer issued at Rs 19,500 per month, subject to audit-season availability." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-006701", "2026-08-25"),
      certificateFor("SP-GJ-2026-006701", "2026-08-25", "On file"),
    ],
  },
  {
    id: "app-salim-store",
    applicant: {
      passportId: "SP-GJ-2025-004412",
      name: "Salim Yousuf Shaikh",
      state: "Gujarat",
      district: "Surat",
      headline: "Store in-charge at a cooperative consumer store",
      matchScore: 64,
      verifiedSkillCount: 4,
      attendancePct: 71,
    },
    jobId: "emp-job-store-manager",
    stage: "Applied",
    appliedOn: "2026-09-23",
    updatedOn: "2026-09-23",
    source: "Direct apply",
    noticePeriod: "Immediate",
    hired: false,
    feedbackSubmitted: false,
    history: [
      { stage: "Applied", on: "2026-09-23", note: "Direct apply; digital marketing evidence is missing entirely." },
    ],
    documents: [
      resumeFor("SP-GJ-2025-004412", "2026-09-23"),
    ],
  },
  {
    id: "app-ashwin-dairy",
    applicant: {
      passportId: "SP-GJ-2026-001265",
      name: "Ashwin Kantilal Solanki",
      state: "Gujarat",
      district: "Anand",
      headline: "Chilling plant operator with a food processing diploma",
      matchScore: 75,
      verifiedSkillCount: 5,
      attendancePct: 89,
    },
    jobId: "emp-job-dairy-supervisor",
    stage: "Hired",
    appliedOn: "2026-08-11",
    updatedOn: "2026-09-05",
    source: "AI match",
    noticePeriod: "Notice waived",
    hired: true,
    feedbackSubmitted: true,
    history: [
      { stage: "Applied", on: "2026-08-11", note: "Applied from the AI match queue at 75%." },
      { stage: "Shortlisted", on: "2026-08-14", note: "Shortlisted; dairy operations certificate verified." },
      { stage: "Interviewed", on: "2026-08-26", note: "Chilling plant round passed." },
      { stage: "Offered", on: "2026-08-31", note: "Offer issued at Rs 23,000 per month." },
      { stage: "Hired", on: "2026-09-05", note: "Joined the Borsad cluster; induction completed 2026-09-09." },
    ],
    documents: [
      resumeFor("SP-GJ-2026-001265", "2026-08-11"),
      certificateFor("SP-GJ-2026-001265", "2026-08-12", "On file"),
    ],
  },
];

/**
 * Builds the cumulative funnel for a set of applications. A card sitting in
 * "Interviewed" has necessarily passed Applied and Shortlisted, so stage counts
 * are derived from the board itself and can never disagree with it.
 */
export function pipelineFunnel(applications: JobApplication[]): { stage: ApplicationStage; count: number; conversionPct: number }[] {
  return APPLICATION_STAGES.map((stage) => {
    const target = APPLICATION_STAGES.indexOf(stage);
    const count = applications.filter((application) => APPLICATION_STAGES.indexOf(application.stage) >= target).length;
    const previous = target === 0 ? count : applications.filter(
      (application) => APPLICATION_STAGES.indexOf(application.stage) >= target - 1,
    ).length;
    return {
      stage,
      count,
      conversionPct: previous === 0 ? 0 : Math.round((count / previous) * 100),
    };
  });
}
