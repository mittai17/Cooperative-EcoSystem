import type { Job } from "@/lib/admin/admin-api";

export const JOB_SECTORS = [
  "Cooperative",
  "Dairy",
  "Agri Business",
  "Supply Chain",
  "Digital",
  "Food Processing",
  "Finance",
] as const;

export const JOB_STATUSES = [
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
] as const;

/** Labelled fallback rows, shown only when the live jobs API fails. */
export const DEMO_JOBS: Job[] = [
  { id: "demo-job-1", title: "Dairy Quality Analyst", employer_name: "Amul Dairy", location: "Anand, Gujarat", job_type: "Full-time", openings: 2, status: "open", source: "employer", applicants: 14, posted_at: null },
  { id: "demo-job-2", title: "Supply Chain Executive", employer_name: "Sahakar Bharati", location: "Delhi", job_type: "Full-time", openings: 1, status: "open", source: "employer", applicants: 9, posted_at: null },
  { id: "demo-job-3", title: "Data Analyst", employer_name: "GCMMF", location: "Gujarat", job_type: "Contract", openings: 3, status: "draft", source: "employer", applicants: 0, posted_at: null },
  { id: "demo-job-4", title: "Field Officer", employer_name: "NCDC", location: "Pune, Maharashtra", job_type: "Full-time", openings: 4, status: "open", source: "employer", applicants: 22, posted_at: null },
  { id: "demo-job-5", title: "HR Assistant", employer_name: "Saras Dairy", location: "Karnataka", job_type: "Part-time", openings: 1, status: "closed", source: "employer", applicants: 31, posted_at: null },
];
