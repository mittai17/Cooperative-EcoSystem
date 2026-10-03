import { cn } from "@/lib/utils";

/** Pulsing placeholder block used while a dashboard panel is loading. */
export function DashboardPanelPlaceholder({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl border border-border bg-muted/60", className)} />;
}
