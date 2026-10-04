import {
  toEmploymentType,
  type EmployerJobDetail,
  type EmploymentType,
  type JobInput,
  type JobRequirement,
} from "@/lib/employer/jobs-api";

export const SECTORS = [
  "Dairy & Agri-processing",
  "Agriculture & Allied",
  "Rural Finance",
  "Consumer Cooperatives",
  "Fisheries",
  "Sugar & Agro-industry",
  "Handloom & Textiles",
  "Marketing & Supply Chain",
] as const;

export const DEPARTMENTS = [
  "Operations",
  "Procurement",
  "Finance & Accounts",
  "Quality Control",
  "Logistics & Cold Chain",
  "Human Resources",
  "Marketing",
  "Administration",
  "Information Technology",
] as const;

export const EXPERIENCE_OPTIONS = ["Fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"] as const;

export const EDUCATION_OPTIONS = [
  "Any qualification",
  "10th pass",
  "12th pass / ITI / Diploma",
  "Graduate (B.A. / B.Com / B.Sc.)",
  "Post graduate (M.A. / M.Com / M.Sc. / MBA)",
  "Professional degree (B.Tech / B.Sc. Agri / CA)",
] as const;

export interface JobFormValues {
  title: string;
  sector: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: string;
  salaryMax: string;
  experienceRequired: string;
  education: string;
  description: string;
  responsibilities: string;
  certifications: string;
  languages: string;
  deadline: string;
  openings: string;
  requirements: JobRequirement[];
}

export type JobFormErrors = Partial<Record<keyof JobFormValues | "requirements", string>>;

export const EMPTY_JOB_FORM: JobFormValues = {
  title: "",
  sector: "",
  department: "",
  location: "",
  employmentType: "Full-time",
  salaryMin: "",
  salaryMax: "",
  experienceRequired: "",
  education: "",
  description: "",
  responsibilities: "",
  certifications: "",
  languages: "",
  deadline: "",
  openings: "1",
  requirements: [],
};

export function formFromDetail(job: EmployerJobDetail): JobFormValues {
  return {
    title: job.title,
    sector: job.sector ?? "",
    department: job.department ?? "",
    location: job.location ?? "",
    employmentType: toEmploymentType(job.employment_type),
    salaryMin: job.salary_min != null ? String(job.salary_min) : "",
    salaryMax: job.salary_max != null ? String(job.salary_max) : "",
    experienceRequired: job.experience_required ?? "",
    education: job.education ?? "",
    description: job.description ?? "",
    responsibilities: job.responsibilities ?? "",
    certifications: job.certifications ?? "",
    languages: job.languages ?? "",
    deadline: job.deadline ? job.deadline.slice(0, 10) : "",
    openings: job.openings != null ? String(job.openings) : "1",
    requirements: job.requirements ?? [],
  };
}

/** Save-draft rule: only the title is mandatory so drafts can be parked early. */
export function validateDraft(values: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {};
  if (values.title.trim().length < 3) errors.title = "Enter a job title of at least 3 characters.";
  return errors;
}

/** Publish rule: every required field must be present before a posting goes live. */
export function validateForPublish(values: JobFormValues, now: Date = new Date()): JobFormErrors {
  const errors = validateDraft(values);
  if (!values.sector) errors.sector = "Choose a cooperative sector.";
  if (!values.department) errors.department = "Choose a department.";
  if (values.location.trim().length < 2) errors.location = "Enter the job location.";
  if (!values.experienceRequired) errors.experienceRequired = "Choose the experience required.";
  if (values.description.trim().length < 40) {
    errors.description = "Describe the role in at least 40 characters.";
  }
  const openings = Number(values.openings);
  if (!Number.isInteger(openings) || openings < 1) errors.openings = "Number of positions must be 1 or more.";
  if (values.deadline) {
    const deadline = new Date(`${values.deadline}T23:59:59`);
    if (Number.isNaN(deadline.getTime()) || deadline.getTime() < now.getTime()) {
      errors.deadline = "The application deadline must be in the future.";
    }
  } else {
    errors.deadline = "Set an application deadline.";
  }
  if (values.salaryMin && values.salaryMax && Number(values.salaryMin) > Number(values.salaryMax)) {
    errors.salaryMax = "Maximum salary must be at least the minimum.";
  }
  if (!values.requirements.some((r) => r.requirement_type === "required")) {
    errors.requirements = "Add at least one required skill.";
  }
  return errors;
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toJobInput(values: JobFormValues): JobInput {
  return {
    title: values.title.trim(),
    sector: values.sector,
    department: values.department,
    location: values.location.trim(),
    employment_type: values.employmentType,
    salary_min: optionalNumber(values.salaryMin),
    salary_max: optionalNumber(values.salaryMax),
    experience_required: values.experienceRequired,
    education: optionalText(values.education),
    description: values.description.trim(),
    responsibilities: optionalText(values.responsibilities),
    certifications: optionalText(values.certifications),
    languages: optionalText(values.languages),
    deadline: values.deadline ? `${values.deadline}T23:59:59+05:30` : null,
    openings: Math.max(1, Math.trunc(Number(values.openings) || 1)),
  };
}

export function hasErrors(errors: JobFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
