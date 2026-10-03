import type { Assessment } from "@/lib/admin/admin-api";

export const SHOW_ANSWERS_OPTIONS = [
  { value: "after_submit", label: "After submission" },
  { value: "never", label: "Never" },
] as const;

/** Labelled fallback rows, shown only when the live assessments API fails. */
export const DEMO_ASSESSMENTS: Assessment[] = [
  { id: "demo-as-1", title: "Dairy Management Quiz", skill_name: "Milk Quality Testing", programme_id: null, programme_title: "Dairy Management", total_questions: 25, duration_minutes: 45, passing_score: 60, due_date: null, attempts: 240 },
  { id: "demo-as-2", title: "Cooperative Governance Test", skill_name: "Governance", programme_id: null, programme_title: "Cooperative Management", total_questions: 40, duration_minutes: 60, passing_score: 70, due_date: null, attempts: 180 },
  { id: "demo-as-3", title: "Agri Business Assessment", skill_name: "Crop Aggregation", programme_id: null, programme_title: "Agri Business", total_questions: 30, duration_minutes: 45, passing_score: 60, due_date: null, attempts: 120 },
  { id: "demo-as-4", title: "Digital Skills Evaluation", skill_name: "Digital Payments", programme_id: null, programme_title: "Digital Skills", total_questions: 20, duration_minutes: 30, passing_score: 50, due_date: null, attempts: 310 },
];
