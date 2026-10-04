import { CheckCircle2, CircleAlert, CircleDashed, CircleX } from "lucide-react";
import type { FactorStatus, MatchBreakdown, MatchFactor } from "@/lib/employer/candidates-api";
import { cn } from "@/lib/utils";

const ROWS: { key: keyof MatchBreakdown; label: string }[] = [
  { key: "required_skills", label: "Required Skills" },
  { key: "skill_proficiency", label: "Skill Proficiency" },
  { key: "education", label: "Education" },
  { key: "certification", label: "Certification" },
  { key: "experience", label: "Experience" },
  { key: "location", label: "Location" },
];

const STATUS_ICON: Record<FactorStatus, { icon: typeof CheckCircle2; className: string; label: string }> = {
  matched: { icon: CheckCircle2, className: "text-success", label: "Matched" },
  partial: { icon: CircleAlert, className: "text-warning", label: "Partial" },
  missing: { icon: CircleX, className: "text-destructive", label: "Missing" },
  unknown: { icon: CircleDashed, className: "text-muted-foreground", label: "Not available" },
};

function factorPercent(factor: MatchFactor): number | null {
  if (typeof factor.value !== "number") return null;
  if (typeof factor.total === "number" && factor.total > 0) {
    return Math.round((factor.value / factor.total) * 100);
  }
  return Math.round(factor.value);
}

function factorValueText(factor: MatchFactor): string {
  if (typeof factor.value !== "number") return "Not available";
  if (typeof factor.total === "number" && factor.total > 0) return `${factor.value}/${factor.total}`;
  return `${Math.round(factor.value)}%`;
}

interface MatchBreakdownListProps {
  breakdown: MatchBreakdown;
  className?: string;
}

/** Factor-by-factor breakdown. Any factor the API did not return is shown as "Not available". */
export function MatchBreakdownList({ breakdown, className }: MatchBreakdownListProps) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {ROWS.map(({ key, label }) => {
        const factor: MatchFactor = breakdown[key] ?? { status: "unknown" };
        const percent = factorPercent(factor);
        const status = STATUS_ICON[factor.status] ?? STATUS_ICON.unknown;
        const Icon = status.icon;
        return (
          <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <Icon className={cn("size-4 shrink-0", status.className)} aria-label={status.label} />
              <span className="truncate text-foreground">{label}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-foreground">{factorValueText(factor)}</span>
            {percent !== null && (
              <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
              </div>
            )}
            {factor.detail && <p className="col-span-2 text-xs text-muted-foreground">{factor.detail}</p>}
          </li>
        );
      })}
    </ul>
  );
}
