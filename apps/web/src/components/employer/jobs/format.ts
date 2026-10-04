import type { JobStatus } from "@/lib/employer/jobs-api";

const inr = new Intl.NumberFormat("en-IN");

export function formatInr(value: number): string {
  return `₹${inr.format(value)}`;
}

/** "₹22,000 - ₹28,000 / month" from structured salary bounds, falling back to the stored label. */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  fallback?: string | null,
): string {
  if (min != null && max != null) return `${formatInr(min)} - ${formatInr(max)} / month`;
  if (min != null) return `From ${formatInr(min)} / month`;
  if (max != null) return `Up to ${formatInr(max)} / month`;
  return fallback || "Not disclosed";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/** "5 days ago", "2 weeks ago" etc. Uses the calendar difference, never a future offset. */
export function formatRelativeDays(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function isoDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export const STATUS_CHIP_CLASS: Record<JobStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-success/10 text-success border-success/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  closed: "bg-destructive/10 text-destructive border-destructive/20",
};
