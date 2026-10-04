import type { SkillPassportRow } from "@/lib/admin/admin-api";

/** Labelled fallback rows, shown only when the live skill passport API fails or is empty. */
export const DEMO_SKILL_PASSPORT: SkillPassportRow[] = [
  { skill_id: "demo-skill-1", skill: "Cooperative Bookkeeping & Tally", category: "Accounting", verified_count: 512, trainees: 380, avg_proficiency: 4.2 },
  { skill_id: "demo-skill-2", skill: "Milk Quality Testing & Fat Analysis", category: "Dairy", verified_count: 426, trainees: 310, avg_proficiency: 4.4 },
  { skill_id: "demo-skill-3", skill: "PACS Digital Ledger & ERP Operations", category: "ICT", verified_count: 364, trainees: 280, avg_proficiency: 3.9 },
  { skill_id: "demo-skill-4", skill: "Cooperative Governance & Member Relations", category: "Management", verified_count: 318, trainees: 240, avg_proficiency: 4.1 },
  { skill_id: "demo-skill-5", skill: "Crop Aggregation & Market Linkages", category: "Agriculture", verified_count: 243, trainees: 190, avg_proficiency: 3.7 },
  { skill_id: "demo-skill-6", skill: "Cold Storage Temperature & Post-Harvest", category: "Food Processing", verified_count: 185, trainees: 140, avg_proficiency: 4.0 },
  { skill_id: "demo-skill-7", skill: "Credit Appraisal & Recovery Operations", category: "Accounting", verified_count: 210, trainees: 165, avg_proficiency: 3.8 },
  { skill_id: "demo-skill-8", skill: "Handloom Weaving & Dyeing Quality", category: "Community", verified_count: 145, trainees: 120, avg_proficiency: 4.3 },
];
