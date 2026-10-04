import type { InstitutionStatus } from "@/lib/admin/admin-api";

export const SUBJECT_OPTIONS = [
  "Dairy Management",
  "Cooperative Management",
  "Agri Business",
  "Supply Chain",
  "Digital Skills",
  "ICT for Cooperatives",
  "Rural Development",
  "Food Safety",
] as const;

export const STATE_OPTIONS = [
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Tamil Nadu",
  "Uttar Pradesh",
  "West Bengal",
] as const;

/** Matches the backend status filter, which accepts only active or inactive. */
export const PERSON_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

/** Narrows a select value to the status filter the backend accepts. */
export function statusParam(value: string): InstitutionStatus | undefined {
  return value === "active" || value === "inactive" ? value : undefined;
}

export function initials(name: string): string {
  const parts = name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
