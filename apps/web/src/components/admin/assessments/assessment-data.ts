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

/** Labelled fallback rows, shown only when the live assessments API fails. */
export const DEMO_ASSESSMENTS: Assessment[] = [
  { id: "demo-as-1", title: "Dairy Management Quiz", skill_name: "Milk Quality Testing", programme_id: null, programme_title: "Dairy Management", total_questions: 25, duration_minutes: 45, passing_score: 60, due_date: null, attempts: 240 },
  { id: "demo-as-2", title: "Cooperative Governance Test", skill_name: "Governance", programme_id: null, programme_title: "Cooperative Management", total_questions: 40, duration_minutes: 60, passing_score: 70, due_date: null, attempts: 180 },
  { id: "demo-as-3", title: "Agri Business Assessment", skill_name: "Crop Aggregation", programme_id: null, programme_title: "Agri Business", total_questions: 30, duration_minutes: 45, passing_score: 60, due_date: "2026-09-20T00:00:00Z", attempts: 120 },
  { id: "demo-as-4", title: "Digital Skills Evaluation", skill_name: "Digital Payments", programme_id: null, programme_title: "Digital Skills", total_questions: 20, duration_minutes: 30, passing_score: 50, due_date: null, attempts: 310 },
  { id: "demo-as-5", title: "Rural Development Exam", skill_name: "Member Communication", programme_id: null, programme_title: "Rural Development", total_questions: 35, duration_minutes: 60, passing_score: 65, due_date: "2026-11-15T00:00:00Z", attempts: 200 },
];
