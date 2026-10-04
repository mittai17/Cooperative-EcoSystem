import type { Assessment } from "@/lib/admin/admin-api";

export const SHOW_ANSWERS_OPTIONS = [
  { value: "after_submit", label: "After submission" },
  { value: "never", label: "Never" },
] as const;

/**
 * The backend has no assessment status. An assessment is treated as closed once
 * its due date has passed; with no due date it stays open.
 */
export function assessmentStatus(a: Pick<Assessment, "due_date">, now: number = Date.now()): "active" | "closed" {
  if (!a.due_date) return "active";
  const due = new Date(a.due_date).getTime();
  return Number.isNaN(due) || due >= now ? "active" : "closed";
}

/** Labelled fallback rows, shown only when the live assessments API fails or is empty. */
export const DEMO_ASSESSMENTS: Assessment[] = [
  { id: "demo-as-1", title: "Dairy Milk Testing & Cold Chain Quiz", skill_name: "Milk Quality Testing", programme_id: null, programme_title: "Dairy Cooperative Operations", total_questions: 25, duration_minutes: 45, passing_score: 60, due_date: null, attempts: 240 },
  { id: "demo-as-2", title: "Cooperative Bookkeeping Final Exam", skill_name: "Ledger Accounting", programme_id: null, programme_title: "Cooperative Bookkeeping & Audit Readiness", total_questions: 40, duration_minutes: 60, passing_score: 70, due_date: null, attempts: 180 },
  { id: "demo-as-3", title: "Agri Commodity Aggregation Evaluation", skill_name: "Crop Aggregation", programme_id: null, programme_title: "Organic Farm Aggregation & FPO Linkage", total_questions: 30, duration_minutes: 45, passing_score: 60, due_date: "2026-09-20T00:00:00Z", attempts: 120 },
  { id: "demo-as-4", title: "Digital Payments & Cloud Records Assessment", skill_name: "Digital Payments", programme_id: null, programme_title: "Digital ERP & Cloud Records for Cooperatives", total_questions: 20, duration_minutes: 30, passing_score: 50, due_date: null, attempts: 310 },
  { id: "demo-as-5", title: "PACS Secretary Operations & Governance", skill_name: "Member Communication", programme_id: null, programme_title: "PACS Secretary Professional Foundation", total_questions: 35, duration_minutes: 60, passing_score: 65, due_date: "2026-11-15T00:00:00Z", attempts: 200 },
  { id: "demo-as-6", title: "Cold Storage Temperature Control & Safety", skill_name: "Cold Storage Ops", programme_id: null, programme_title: "Cooperative Cold Chain & Post-Harvest Logistics", total_questions: 25, duration_minutes: 40, passing_score: 60, due_date: null, attempts: 85 },
  { id: "demo-as-7", title: "Urban Credit NPA Management & Recovery", skill_name: "NPA Recovery", programme_id: null, programme_title: "Urban Credit Cooperative Compliance & Audit", total_questions: 30, duration_minutes: 45, passing_score: 65, due_date: "2026-10-30T00:00:00Z", attempts: 95 },
  { id: "demo-as-8", title: "Fishery Collective Harvest & Preservation", skill_name: "Marine Harvest", programme_id: null, programme_title: "Fishery Collectives & Marine Value Chain", total_questions: 20, duration_minutes: 30, passing_score: 60, due_date: null, attempts: 60 },
];
