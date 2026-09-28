import { skillPassport } from "@/lib/mock-data/skills";
import { courses } from "@/lib/mock-data/courses";
import type { Course, Job } from "@/lib/types";

export interface JobMatch {
  percent: number;
  matched: string[];
  missing: string[];
}

const verifiedSkillNames = new Set(
  skillPassport.filter((s) => s.verified).map((s) => s.name.toLowerCase())
);

/**
 * Deterministic "AI match" between the demo trainee's verified Skill
 * Passport and a job's required skills. Derived purely from existing mock
 * data (no new fields added to Job or SkillEntry).
 */
export function getJobMatch(job: Job): JobMatch {
  if (job.skillsRequired.length === 0) {
    return { percent: 100, matched: [], missing: [] };
  }
  const matched = job.skillsRequired.filter((skill) => verifiedSkillNames.has(skill.toLowerCase()));
  const missing = job.skillsRequired.filter((skill) => !verifiedSkillNames.has(skill.toLowerCase()));
  const percent = Math.round((matched.length / job.skillsRequired.length) * 100);
  return { percent, matched, missing };
}

/**
 * Finds the course most likely to close this job's missing-skill gap, by
 * overlap with the course's own skills list, falling back to the job's
 * sector/category before finally falling back to the first course.
 */
export function getRecommendedCourse(job: Job): Course {
  const { missing } = getJobMatch(job);
  const missingLower = missing.map((s) => s.toLowerCase());

  const byMissingSkill = courses.find((course) =>
    course.skills.some((skill) => missingLower.includes(skill.toLowerCase()))
  );
  if (byMissingSkill) return byMissingSkill;

  const bySector = courses.find((course) => course.category === job.sector);
  if (bySector) return bySector;

  return courses[0];
}
