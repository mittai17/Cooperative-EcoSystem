"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, ClipboardCheck, MapPin, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/trainer/states";
import { MetricBar } from "@/components/trainer/trainees/shared";
import { useTrainerQuery } from "@/lib/trainer/api";

export interface ClassSummary {
  id: string;
  course: string;
  category: string | null;
  batch: string;
  trainees: number;
  progress: number;
  attendance: number;
  assessments_completed: number;
  assessments_total: number;
  at_risk: number;
  room: string | null;
  next_class: { start: string; label: string; room: string | null } | null;
}

export function ClassesList() {
  const q = useTrainerQuery<{ classes: ClassSummary[] }>("/classes");
  const rows = q.data?.classes ?? [];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Classes" description="Every course and batch you teach, with progress, attendance and risk at a glance." />
      {q.loading && !q.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : q.error && !q.data ? (
        <ErrorState message={q.error} onRetry={q.refetch} />
      ) : rows.length === 0 ? (
        <EmptyState title="No classes assigned yet." hint="Classes appear here once an institution assigns you a batch." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <article key={c.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-base font-semibold text-foreground">{c.course}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Batch {c.batch}{c.category ? ` · ${c.category}` : ""}</p>
                </div>
                {c.at_risk > 0 ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    <AlertTriangle className="size-3" /> {c.at_risk} at risk
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">On track</span>
                )}
              </header>
              <div className="flex flex-col gap-3">
                <MetricBar label="Course progress" value={c.progress} />
                <MetricBar label="Attendance" value={c.attendance} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" /><div><dt className="sr-only">Trainees</dt><dd className="font-medium">{c.trainees} trainees</dd></div></div>
                <div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-muted-foreground" /><div><dt className="sr-only">Assessments</dt><dd className="font-medium">{c.assessments_completed}/{c.assessments_total} assessments</dd></div></div>
              </dl>
              <p className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                <CalendarClock className="size-4 shrink-0" />
                {c.next_class ? <span>Next: <span className="font-medium text-foreground">{c.next_class.label}</span></span> : "No upcoming class scheduled"}
                {c.next_class?.room && <span className="ml-auto inline-flex items-center gap-1"><MapPin className="size-3" />{c.next_class.room}</span>}
              </p>
              <Link href={`/trainer/classes/${c.id}`} className={buttonVariants({ className: "mt-auto w-full" })}>Open Class</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
