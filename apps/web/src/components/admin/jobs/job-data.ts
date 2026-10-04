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

/** Labelled fallback rows, shown only when the live jobs API fails or is empty. */
export const DEMO_JOBS: Job[] = [
  { id: "demo-job-1", title: "Dairy Quality Analyst", employer_name: "Amul Dairy Products (GCMMF)", location: "Anand, Gujarat", job_type: "Full-time", openings: 4, status: "open", source: "employer", applicants: 18, posted_at: "2026-10-01T10:00:00Z" },
  { id: "demo-job-2", title: "Supply Chain & Logistics Executive", employer_name: "IFFCO Logistics", location: "Lucknow, Uttar Pradesh", job_type: "Full-time", openings: 2, status: "open", source: "employer", applicants: 12, posted_at: "2026-09-28T10:00:00Z" },
  { id: "demo-job-3", title: "PACS Field Records Supervisor", employer_name: "NCDC Partner Network", location: "Delhi", job_type: "Full-time", openings: 5, status: "open", source: "employer", applicants: 25, posted_at: "2026-09-25T10:00:00Z" },
  { id: "demo-job-4", title: "Cooperative Accounts Officer", employer_name: "Sahakar Bharati College", location: "Bengaluru, Karnataka", job_type: "Full-time", openings: 2, status: "open", source: "employer", applicants: 14, posted_at: "2026-09-22T10:00:00Z" },
  { id: "demo-job-5", title: "Cold Storage Technical Supervisor", employer_name: "Saras Dairy Co-op", location: "Jaipur, Rajasthan", job_type: "Full-time", openings: 1, status: "open", source: "employer", applicants: 8, posted_at: "2026-09-20T10:00:00Z" },
  { id: "demo-job-6", title: "Agri Commodity Procurement Officer", employer_name: "NAFED Operations", location: "Bhopal, Madhya Pradesh", job_type: "Contract", openings: 3, status: "draft", source: "employer", applicants: 0, posted_at: null },
  { id: "demo-job-7", title: "Food Safety & Quality Inspector", employer_name: "Campco Co-op", location: "Mangalore, Karnataka", job_type: "Full-time", openings: 2, status: "open", source: "employer", applicants: 11, posted_at: "2026-09-15T10:00:00Z" },
  { id: "demo-job-8", title: "Dairy Processing Plant Technician", employer_name: "Milma Dairy Federation", location: "Kochi, Kerala", job_type: "Full-time", openings: 3, status: "closed", source: "employer", applicants: 34, posted_at: "2026-08-10T10:00:00Z" },
];
