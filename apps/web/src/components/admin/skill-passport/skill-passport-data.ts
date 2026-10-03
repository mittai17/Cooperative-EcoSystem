import type { SkillPassportRow } from "@/lib/admin/admin-api";

/** Labelled fallback rows, shown only when the live skill passport API fails. */
export const DEMO_SKILL_PASSPORT: SkillPassportRow[] = [
  { skill_id: "demo-skill-1", skill: "Bookkeeping", category: "Accounting", verified_count: 412, trainees: 300, avg_proficiency: 3.8 },
  { skill_id: "demo-skill-2", skill: "Milk Quality Testing", category: "Dairy", verified_count: 286, trainees: 210, avg_proficiency: 4.1 },
  { skill_id: "demo-skill-3", skill: "Digital Payments", category: "ICT", verified_count: 254, trainees: 190, avg_proficiency: 3.5 },
  { skill_id: "demo-skill-4", skill: "Member Communication", category: "Management", verified_count: 198, trainees: 150, avg_proficiency: 3.9 },
  { skill_id: "demo-skill-5", skill: "Crop Aggregation", category: "Agriculture", verified_count: 143, trainees: 110, avg_proficiency: 3.2 },
];
