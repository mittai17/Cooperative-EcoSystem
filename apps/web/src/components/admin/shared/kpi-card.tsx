import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTone = "red" | "blue" | "green" | "amber" | "violet";

const TILE: Record<KpiTone, string> = {
  red: "bg-tint-red-bg text-tint-red-fg",
  blue: "bg-tint-blue-bg text-tint-blue-fg",
  green: "bg-tint-green-bg text-tint-green-fg",
  amber: "bg-tint-amber-bg text-tint-amber-fg",
  violet: "bg-tint-violet-bg text-tint-violet-fg",
};

interface KpiCardProps {
  icon: LucideIcon;
  tone?: KpiTone;
  value: string | number;
  label: string;
  /** Free text such as "12 this month". Omit to hide the delta row. */
  delta?: string;
  /** "up" green arrow, "down" red arrow, "flat" neutral dash. Defaults to "up". */
  deltaTone?: "up" | "down" | "flat";
}

export function KpiCard({ icon: Icon, tone = "red", value, label, delta, deltaTone = "up" }: KpiCardProps) {
  const DeltaIcon = deltaTone === "down" ? ArrowDown : deltaTone === "flat" ? Minus : ArrowUp;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span className={cn("flex size-11 items-center justify-center rounded-xl", TILE[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="font-heading text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {delta ? (
        <p
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            deltaTone === "down" ? "text-red-600" : deltaTone === "flat" ? "text-muted-foreground" : "text-emerald-600",
          )}
        >
          <DeltaIcon className="size-3.5" aria-hidden />
          {delta}
        </p>
      ) : null}
    </div>
  );
}
