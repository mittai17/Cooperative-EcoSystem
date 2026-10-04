import type { Job } from "@/lib/types";

/** Translator passed in from a client component (useT). Keys live under public.jobDetails.copy. */
export type CopyT = (key: string) => string;

/**
 * Small deterministic copy generators for the job-details page's Overview,
 * Requirements, and Company tabs. Derived entirely from the existing Job
 * fields (no new fields added to the shared mock data model).
 */
export function buildResponsibilities(job: Job, t: CopyT): string[] {
  return [
    t("public.jobDetails.copy.responsibilities.0")
      .replace("{title}", job.title.toLowerCase())
      .replace("{employer}", job.employer)
      .replace("{sector}", job.sector.toLowerCase()),
    t("public.jobDetails.copy.responsibilities.1").replace("{location}", job.location),
    t("public.jobDetails.copy.responsibilities.2").replace("{skill}", job.skillsRequired[0] ?? "core"),
    t("public.jobDetails.copy.responsibilities.3").replace("{employer}", job.employer),
  ];
}

export function buildRequirements(job: Job, t: CopyT): string[] {
  return [
    t("public.jobDetails.copy.requirements.0").replace("{skills}", job.skillsRequired.join(", ") || job.sector),
    t("public.jobDetails.copy.requirements.1").replace("{location}", job.location),
    t(job.openings > 1 ? "public.jobDetails.copy.requirements.2Many" : "public.jobDetails.copy.requirements.2One")
      .replace("{type}", t(`public.jobCatalog.jobTypes.${job.type}`))
      .replace("{count}", String(job.openings)),
    t("public.jobDetails.copy.requirements.3"),
  ];
}

export function buildCompanyBlurb(job: Job, t: CopyT): string {
  return t("public.jobDetails.copy.companyBlurb")
    .replace("{employer}", job.employer)
    .replace("{sector}", job.sector.toLowerCase())
    .replace("{location}", job.location);
}
