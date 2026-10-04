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

/** Labelled fallback rows, shown only when the live programmes API fails. */
export const DEMO_PROGRAMMES: Programme[] = [
  { id: "demo-prog-1", title: "Dairy Management", sector: "Dairy & Livestock", level: null, mode: "offline", duration_weeks: 12, seats_total: 240, seats_filled: 198, organisation_name: null, start_date: null, status: "active" },
  { id: "demo-prog-2", title: "Cooperative Management", sector: "Management", level: null, mode: "hybrid", duration_weeks: 24, seats_total: 180, seats_filled: 140, organisation_name: null, start_date: null, status: "active" },
  { id: "demo-prog-3", title: "Agri Business", sector: "Agriculture", level: null, mode: "offline", duration_weeks: 16, seats_total: 120, seats_filled: 96, organisation_name: null, start_date: null, status: "active" },
  { id: "demo-prog-4", title: "Digital Skills", sector: "ICT", level: null, mode: "online", duration_weeks: 8, seats_total: 310, seats_filled: 244, organisation_name: null, start_date: null, status: "inactive" },
  { id: "demo-prog-5", title: "Rural Development", sector: "Community", level: null, mode: "offline", duration_weeks: 12, seats_total: 200, seats_filled: 150, organisation_name: null, start_date: null, status: "active" },
];

export function durationLabel(weeks: number | null): string {
  if (weeks === null || weeks === undefined) return "-";
  return `${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}

export function modeLabel(mode: string | null): string {
  if (!mode) return "-";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}
