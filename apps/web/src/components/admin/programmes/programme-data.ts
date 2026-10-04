import type { Programme } from "@/lib/admin/admin-api";

export const PROGRAMME_SECTORS = [
  "Management",
  "Dairy & Livestock",
  "Agriculture",
  "ICT",
  "Accounting",
  "Community",
  "Food Processing",
] as const;

export const PROGRAMME_MODES = [
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
] as const;

/** Labelled fallback rows, shown only when the live programmes API fails or is empty. */
export const DEMO_PROGRAMMES: Programme[] = [
  { id: "ncct-prog-dairy-ops", title: "Dairy Cooperative Operations", sector: "Dairy & Livestock", level: "Intermediate", mode: "offline", duration_weeks: 10, seats_total: 120, seats_filled: 118, organisation_name: "Institute of Rural Management, Anand", start_date: "2026-04-06", status: "active" },
  { id: "ncct-prog-bookkeeping", title: "Cooperative Bookkeeping & Audit Readiness", sector: "Accounting", level: "Foundation", mode: "hybrid", duration_weeks: 8, seats_total: 200, seats_filled: 164, organisation_name: "NCUI Training Centre, Delhi", start_date: "2026-02-09", status: "active" },
  { id: "ncct-prog-poultry-lead", title: "Poultry & Small Livestock Cluster Leadership", sector: "Dairy & Livestock", level: "Foundation", mode: "offline", duration_weeks: 6, seats_total: 80, seats_filled: 76, organisation_name: "Tamil Nadu Cooperative Union", start_date: "2026-03-02", status: "active" },
  { id: "ncct-prog-pacs-sec", title: "PACS Secretary Professional Foundation", sector: "Management", level: "Foundation", mode: "hybrid", duration_weeks: 12, seats_total: 250, seats_filled: 242, organisation_name: "VAMNICOM, Pune", start_date: "2026-01-12", status: "active" },
  { id: "ncct-prog-fishery-val", title: "Fishery Collectives & Marine Value Chain", sector: "Agriculture", level: "Intermediate", mode: "offline", duration_weeks: 8, seats_total: 60, seats_filled: 55, organisation_name: "Kerala Rural Institute", start_date: "2026-05-04", status: "active" },
  { id: "ncct-prog-handloom-mgmt", title: "Handloom Weaver Cooperative Management", sector: "Community", level: "Foundation", mode: "online", duration_weeks: 6, seats_total: 90, seats_filled: 84, organisation_name: "NCUI Delhi Handloom Cell", start_date: "2026-02-16", status: "active" },
  { id: "ncct-prog-cold-chain", title: "Cooperative Cold Chain & Post-Harvest Logistics", sector: "Food Processing", level: "Advanced", mode: "offline", duration_weeks: 10, seats_total: 75, seats_filled: 68, organisation_name: "Haryana Agri Cooperative", start_date: "2026-03-09", status: "active" },
  { id: "ncct-prog-urban-credit", title: "Urban Credit Cooperative Compliance & Audit", sector: "Accounting", level: "Advanced", mode: "online", duration_weeks: 4, seats_total: 110, seats_filled: 102, organisation_name: "Sahakar Bharati College", start_date: "2026-04-13", status: "active" },
  { id: "ncct-prog-organic-fpo", title: "Organic Farm Aggregation & FPO Linkage", sector: "Agriculture", level: "Intermediate", mode: "hybrid", duration_weeks: 8, seats_total: 85, seats_filled: 79, organisation_name: "Assam Cooperative College", start_date: "2026-05-18", status: "active" },
  { id: "ncct-prog-digital-skills", title: "Digital ERP & Cloud Records for Cooperatives", sector: "ICT", level: "Intermediate", mode: "online", duration_weeks: 8, seats_total: 310, seats_filled: 244, organisation_name: "NCDC Training Institute", start_date: "2026-01-19", status: "active" },
];

export function durationLabel(weeks: number | null): string {
  if (weeks === null || weeks === undefined) return "-";
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}

export function modeLabel(mode: string | null): string {
  if (!mode) return "-";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}
