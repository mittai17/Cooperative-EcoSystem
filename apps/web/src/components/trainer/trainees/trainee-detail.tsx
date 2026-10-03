"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Award, CheckCircle2, ClipboardCheck, ClipboardList, MessageSquare, Send, StickyNote } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/components/trainer/dashboard/section";
import { ErrorState } from "@/components/trainer/states";
import { useTrainerQuery } from "@/lib/trainer/api";
import { InitialsAvatar, MetricBar, ReasonChips, SendReminderDialog, StatusBadge, fmtDate, relTime, type ReminderTarget } from "./shared";

interface Detail {
  profile: { id: string; trainee_code: string; name: string; batch: string; batch_id: string; status: string; status_label: string };
  performance: { learning: number; attendance: number; assessment: number; assignment: number; skill_readiness: number; last_activity: string | null; inactive_days: number | null; risk_reasons: string[] };
  courses: { class_id: string; course: string; progress: number; last_accessed: string | null }[];
  assessments: { assessment_id: string; attempt_id: string; title: string; score: number | null; passed: boolean; status: string; submitted_at: string | null }[];
  assignments: { id: string; title: string; deadline: string | null; status: string; marks: number | null; max_marks: number | null }[];
  skills: { skill: string; proficiency: number; level: string; verified: boolean }[];
  certificates: { id?: string; programme?: string | null; issued?: string | null; grade?: string | null }[];
  observations: { id?: string; dimension?: string; rating?: number; observation?: string | null; created_at?: string | null }[];
  recent_activity: { type: string; text: string; at: string }[];
}

export function TraineeDetail({ id }: { id: string }) {
  const q = useTrainerQuery<Detail>(`/trainees/${id}`);
  const [reminder, setReminder] = useState<ReminderTarget | null>(null);
  const d = q.data;

  if (q.loading && !d) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
      </div>
    );
  }
  if (!d) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/trainer/trainees" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Trainees</Link>
        <ErrorState message={q.error ?? "Trainee not found."} onRetry={q.refetch} />
      </div>
    );
  }

  const p = d.profile;
  const perf = d.performance;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/trainer/trainees" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Trainees</Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={p.name} className="size-14 text-base" />
          <div>
            <h1 className="font-heading text-xl font-bold sm:text-2xl">{p.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{p.trainee_code} · Batch {p.batch} · Last active {relTime(perf.last_activity)}</p>
            <div className="mt-2"><StatusBadge status={p.status} label={p.status_label} /></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setReminder({ id: p.id, name: p.name, reasons: perf.risk_reasons })}><Send className="size-4" /> Send Reminder</Button>
          <Link href={`/trainer/skills?trainee=${p.id}`} className={buttonVariants({ variant: "outline" })}><ClipboardCheck className="size-4" /> Evaluate Skills</Link>
          <Button variant="outline" onClick={() => setReminder({ id: p.id, name: p.name, feedback: true })}>
            <MessageSquare className="size-4" /> Provide Feedback
          </Button>
        </div>
      </div>

      {perf.risk_reasons.length > 0 && (
        <Section title="Risk Reasons" className="border-destructive/30">
          <ReasonChips reasons={perf.risk_reasons} max={10} />
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Performance">
          <div className="flex flex-col gap-4">
            <MetricBar label="Learning progress" value={perf.learning} />
            <MetricBar label="Attendance" value={perf.attendance} />
            <MetricBar label="Assessment average" value={perf.assessment} />
            <MetricBar label="Assignment completion" value={perf.assignment} />
          </div>
        </Section>
        <Section title="Skills" href={`/trainer/skills?trainee=${p.id}`} hrefLabel="Evaluate" empty={d.skills.length === 0} emptyMessage="No skills evaluated yet.">
          <div className="flex flex-col gap-4">
            {d.skills.map((s) => (
              <div key={s.skill}>
                <MetricBar label={s.skill} value={s.proficiency} />
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">{s.level}{s.verified && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-3" /> Verified</span>}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Current Courses" empty={d.courses.length === 0} emptyMessage="Not enrolled in any course.">
          <ul className="flex flex-col gap-4">
            {d.courses.map((c) => (
              <li key={c.class_id}>
                <MetricBar label={c.course} value={c.progress} />
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last accessed {relTime(c.last_accessed)}</span>
                  <Link href={`/trainer/classes/${c.class_id}`} className="font-medium text-primary hover:underline">Open class</Link>
                </div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Assessment Results" icon={ClipboardCheck} empty={d.assessments.length === 0} emptyMessage="No assessments attempted yet.">
          <ul className="flex flex-col divide-y divide-border/60">
            {d.assessments.map((a) => (
              <li key={a.attempt_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <Link href={`/trainer/assessments/${a.assessment_id}`} className="block truncate text-sm font-medium hover:text-primary">{a.title}</Link>
                  <p className="text-xs text-muted-foreground">{fmtDate(a.submitted_at, true)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{a.score ?? "—"}%</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{a.passed ? "Passed" : "Failed"}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Assignments" icon={ClipboardList} href="/trainer/assignments" empty={d.assignments.length === 0} emptyMessage="No assignments yet.">
          <ul className="flex flex-col divide-y divide-border/60">
            {d.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">Due {fmtDate(a.deadline)}</p></div>
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  {a.marks != null && <span className="font-semibold tabular-nums">{a.marks}/{a.max_marks}</span>}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">{a.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Certificates" icon={Award} empty={d.certificates.length === 0} emptyMessage="No certificates earned yet.">
          <ul className="flex flex-col gap-2">
            {d.certificates.map((c, i) => (
              <li key={c.id ?? i} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"><span className="font-medium">{c.programme ?? "Certificate"}{c.grade ? ` · ${c.grade}` : ""}</span><span className="text-xs text-muted-foreground">{fmtDate(c.issued)}</span></li>
            ))}
          </ul>
        </Section>

        <Section title="Trainer Observations" icon={StickyNote} empty={d.observations.length === 0} emptyMessage="No observations recorded." emptyHint="Use Evaluate Skills to add observations.">
          <ul className="flex flex-col gap-2">
            {d.observations.map((o, i) => (
              <li key={o.id ?? i} className="rounded-xl bg-muted/50 px-3 py-2 text-sm"><p><span className="font-medium capitalize">{(o.dimension ?? "").replace(/_/g, " ")}</span>{o.rating ? ` · ${o.rating}/5` : ""}{o.observation ? ` — ${o.observation}` : ""}</p>{o.created_at && <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(o.created_at)}</p>}</li>
            ))}
          </ul>
        </Section>
        <Section title="Recent Activity" icon={Activity} empty={d.recent_activity.length === 0} emptyMessage="No recent activity.">
          <ul className="flex flex-col gap-3">
            {d.recent_activity.map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-3 text-sm"><span>{a.text}</span><span className="shrink-0 text-xs text-muted-foreground">{relTime(a.at)}</span></li>
            ))}
          </ul>
        </Section>
      </div>

      <SendReminderDialog
        target={reminder}
        onClose={() => setReminder(null)}
        defaultSubject={reminder?.feedback ? "Feedback from your trainer" : "Reminder from your trainer"}
      />
    </div>
  );
}
