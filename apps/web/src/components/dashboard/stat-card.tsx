import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTint = "red" | "blue" | "green" | "violet" | "amber";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Icon tint tile color, rotates across the palette for visual variety. */
  tint?: StatTint;
  trend?: string;
  trendTone?: "up" | "down" | "neutral";
  className?: string;
}

const tintClass: Record<StatTint, string> = {
  red: "icon-tile-red",
  blue: "icon-tile-blue",
  green: "icon-tile-green",
  violet: "icon-tile-violet",
  amber: "icon-tile-amber",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tint = "red",
  trend,
  trendTone = "neutral",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm",
        className
      )}
    >
      <span className={cn("size-11", tintClass[tint])}>
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div>
        <p className="font-heading text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {trend && (
        <p
          className={cn(
            "text-xs font-medium",
            trendTone === "up" && "text-success",
            trendTone === "down" && "text-destructive",
            trendTone === "neutral" && "text-muted-foreground"
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
