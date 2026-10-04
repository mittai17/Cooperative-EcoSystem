import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { DashboardToday } from "@/lib/employer/jobs-api";
import { formatTime } from "@/components/employer/jobs/format";
import { cn } from "@/lib/utils";
import { SectionEmpty, SectionSkeleton } from "./section-shell";

const KIND_TONE: Record<DashboardToday["kind"], string> = {
  interview: "bg-primary",
  review: "bg-amber-500",
  offer: "bg-success",
  other: "bg-muted-foreground",
};

const KIND_LABEL: Record<DashboardToday["kind"], string> = {
  interview: "Interview",
  review: "Team review",
  offer: "Offer",
  other: "Event",
};

export function TodayPanel({
  items,
  loading,
  error,
  onRetry,
}: {
  items: DashboardToday[] | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm" aria-label="Today">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          <CalendarDays className="size-4 text-primary" /> Today
        </h2>
        <span className="text-xs text-muted-foreground">{today}</span>
      </div>
      {error ? (
        <div className="flex flex-col items-start gap-2 text-sm">
          <p className="text-destructive">Today&apos;s schedule could not be loaded.</p>
          {onRetry && (
            <button type="button" className="text-xs font-medium text-primary underline" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      ) : loading || items === null ? (
        <SectionSkeleton rows={3} />
      ) : items.length === 0 ? (
        <SectionEmpty title="Nothing scheduled today" body="Interviews and team reviews you schedule will appear here." />
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="flex w-20 shrink-0 flex-col items-end text-xs font-medium text-muted-foreground tabular-nums">
                {formatTime(item.starts_at)}
              </div>
              <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", KIND_TONE[item.kind])} aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {KIND_LABEL[item.kind]}
                </p>
                <p className="truncate text-sm font-medium text-foreground">{item.candidate_name ?? item.subtitle ?? "Scheduled"}</p>
                {item.candidate_name && item.subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <Link href="/employer/interviews" className="mt-auto text-xs font-medium text-primary hover:underline">
        View full calendar
      </Link>
    </section>
  );
}
