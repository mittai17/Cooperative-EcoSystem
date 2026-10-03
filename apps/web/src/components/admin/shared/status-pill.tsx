import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "gray";

const TONE_BY_STATUS: Record<string, Tone> = {
  active: "green",
  verified: "green",
  paid: "green",
  placed: "green",
  completed: "green",
  open: "green",
  under_review: "amber",
  pending: "amber",
  draft: "amber",
  inactive: "red",
  rejected: "red",
  failed: "red",
  closed: "gray",
  expired: "gray",
};

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-600 border-red-200",
  gray: "bg-muted text-muted-foreground border-border",
};

export function formatStatusLabel(status: string): string {
  return status
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ");
}

interface StatusPillProps {
  status: string;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const key = status.toLowerCase().replace(/[\s-]+/g, "_");
  const tone = TONE_BY_STATUS[key] ?? "gray";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
