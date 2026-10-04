/**
 * Roles the backend accepts (UserCreate / UserUpdate in admin_portal.py).
 * The five sub-role labels from the design (Super Admin, Program Admin and so on)
 * have no one-to-one backend role, so they are not offered here.
 */
import type { PlatformRole } from "@/lib/admin/admin-api";

export const ROLE_OPTIONS = [
  { value: "trainee", label: "Trainee" },
  { value: "trainer", label: "Trainer" },
  { value: "institution", label: "Institution" },
  { value: "employer", label: "Employer" },
  { value: "admin", label: "Admin" },
  { value: "ncct_admin", label: "NCCT Admin" },
] as const;

/** Narrows a select value to a backend role; returns undefined for anything else. */
export function roleParam(value: string): PlatformRole | undefined {
  return ROLE_OPTIONS.find((option) => option.value === value)?.value;
}

export function roleLabel(role: string): string {
  const match = ROLE_OPTIONS.find((option) => option.value === role);
  if (match) return match.label;
  return role
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}
