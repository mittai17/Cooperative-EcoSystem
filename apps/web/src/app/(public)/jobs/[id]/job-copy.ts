import type { Job } from "@/lib/types";

/**
 * Small deterministic copy generators for the job-details page's Overview,
 * Requirements, and Company tabs. Derived entirely from the existing Job
 * fields (no new fields added to the shared mock data model).
 */
export function buildResponsibilities(job: Job): string[] {
  return [
    `Own day-to-day delivery of ${job.title.toLowerCase()} duties across ${job.employer}'s ${job.sector.toLowerCase()} operations.`,
    `Coordinate with member societies and field staff in and around ${job.location} to keep work on schedule.`,
    `Apply ${job.skillsRequired[0] ?? "core"} best practices and report outcomes to the cooperative's board.`,
    `Support onboarding and training of new staff as the ${job.employer} team grows.`,
  ];
}

export function buildRequirements(job: Job): string[] {
  return [
    `Working knowledge of ${job.skillsRequired.join(", ") || job.sector}.`,
    `Comfortable being based in or regularly travelling to ${job.location}.`,
    `Available for a ${job.type.toLowerCase()} engagement with ${job.openings} opening${job.openings > 1 ? "s" : ""}.`,
    "Prior cooperative-sector or rural-development experience preferred, not mandatory.",
  ];
}

export function buildCompanyBlurb(job: Job): string {
  return `${job.employer} is a cooperative employer in the ${job.sector.toLowerCase()} sector, operating out of ${job.location}. They post verified openings directly on CoopSetu and hire against AI-ranked, skill-passport-backed candidate matches rather than resume keywords alone.`;
}
