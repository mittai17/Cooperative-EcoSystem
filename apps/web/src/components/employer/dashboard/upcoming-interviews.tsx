"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Eye, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/employer/jobs/confirm-dialog";
import { formatTime } from "@/components/employer/jobs/format";
import { cancelEmployerInterview, type UpcomingInterview } from "@/lib/employer/jobs-api";
import { cn } from "@/lib/utils";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton, initials } from "./section-shell";

export function UpcomingInterviews({
  items,
  loading,
  error,
  onRetry,
  onChanged,
}: {
  items: UpcomingInterview[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Called after a cancellation so the parent can refresh KPIs. */
  onChanged: () => void;
}) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<UpcomingInterview | null>(null);

  const visible = (items ?? []).filter((item) => !removed.has(item.id) && item.status === "scheduled").slice(0, 4);

  return (
    <SectionCard title="Upcoming Interviews" icon={CalendarClock} action={{ label: "View All", href: "/employer/interviews" }}>
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || items === null ? (
        <SectionSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <SectionEmpty
          title="No upcoming interviews"
          body="Interviews you schedule with shortlisted candidates appear here."
          cta={{ label: "Open interviews", href: "/employer/interviews" }}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {visible.map((item) => {
            const date = new Date(item.starts_at);
            const validDate = !Number.isNaN(date.getTime());
            const joinHref = item.mode === "online" && item.meeting_link ? item.meeting_link : `/employer/interviews/${item.id}`;
            const isExternal = item.mode === "online" && Boolean(item.meeting_link);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-primary/20 bg-primary/5 py-1 text-center">
                  <span className="text-[10px] font-semibold text-primary uppercase">
                    {validDate ? date.toLocaleDateString("en-IN", { month: "short" }) : "—"}
                  </span>
                  <span className="font-heading text-base leading-tight font-bold text-foreground">
                    {validDate ? date.getDate() : "—"}
                  </span>
                </div>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {initials(item.candidate_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.candidate_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.role ?? "Role not set"} · {formatTime(item.starts_at)}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-1 h-4 px-1.5 text-[10px]",
                      item.mode === "online" ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-700",
                    )}
                  >
                    {item.mode === "online" ? "Online" : "Onsite"}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {isExternal ? (
                    <Button size="sm" render={<a href={joinHref} target="_blank" rel="noopener noreferrer" />}>
                      <Video className="size-3.5" /> Join
                    </Button>
                  ) : item.mode === "online" ? (
                    <Button size="sm" render={<Link href={joinHref} />}>
                      <Video className="size-3.5" /> Join
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" render={<Link href={joinHref} />}>
                      <Eye className="size-3.5" /> View
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" render={<Link href={`/employer/interviews/${item.id}?action=reschedule`} />}>
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setCancelTarget(item)}
                  >
                    Cancel
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this interview?"
        description={
          cancelTarget
            ? `The interview with ${cancelTarget.candidate_name} will be cancelled and the candidate will be notified.`
            : ""
        }
        confirmLabel="Cancel interview"
        destructive
        onConfirm={async () => {
          if (!cancelTarget) return;
          try {
            await cancelEmployerInterview(cancelTarget.id);
            setRemoved((prev) => new Set(prev).add(cancelTarget.id));
            onChanged();
          } catch (err) {
            throw err instanceof Error ? err : new Error("Could not cancel the interview.");
          }
        }}
      />
    </SectionCard>
  );
}
