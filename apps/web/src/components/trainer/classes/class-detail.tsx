"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BarChart3, ClipboardCheck, GraduationCap, MapPin, TrendingUp } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendBarChart, TrendLineChart } from "@/components/dashboard/charts";
import { ErrorState } from "@/components/trainer/states";
import { useTrainerQuery } from "@/lib/trainer/api";
import {
  InitialsAvatar,
  MetricBar,
  PctCell,
  ReasonChips,
  SendReminderDialog,
  StatusBadge,
  fmtDate,
  type ReminderTarget,
  type TraineeRow,
} from "@/components/trainer/trainees/shared";
import { Section } from "@/components/trainer/dashboard/section";

interface ClassDetailData {
  id: string;
  course: { id: string; title: string; category: string | null };
  batch: { id: string; name: string; venue: string | null };
  room: string | null;
  overview: { course_progress: number; trainees: number; average_attendance: number; average_assessment: number; completion_rate: number };
  charts: {
    learning_progress: { bucket: string; trainees: number }[];
    attendance_trend: { date: string; attendance: number }[];
    assessment_performance: { assessment: string; average: number; pass_rate: number }[];
  };
  at_risk_trainees: TraineeRow[];
  trainees: TraineeRow[];
  attendance_sessions: { id: string; name: string; date: string; room: string | null; present: number; late: number; absent: number; excused: number; attendance: number }[];
  assessments: { id: string; title: string; status: string; scheduled_at: string | null; questions: number; duration_minutes: number; submitted: number; average: number | null; pass_rate: number | null }[];
  assignments: { id: string; title: string; deadline: string | null; assigned: number; submitted: number; pending: number; graded: number; status: string }[];
  announcements: { id: string; title: string; message: string; audience: string; status: string; created_at: string }[];
  content: { id: string; title: string; position?: number; duration_minutes?: number | null; type?: string }[];
}

const TABS = ["overview", "trainees", "content", "attendance", "assessments", "assignments", "progress", "announcements"] as const;
type TabKey = (typeof TABS)[number];

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "success" | "warning" }) {
  const c = tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${c}`}>{children}</span>;
}

export function ClassDetail({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("tab") as TabKey | null;
  const tab: TabKey = raw && TABS.includes(raw) ? raw : "overview";
  const q = useTrainerQuery<ClassDetailData>(`/classes/${id}`);
  const [reminder, setReminder] = useState<ReminderTarget | null>(null);
  const d = q.data;

  function setTab(v: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", v);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  if (q.loading && !d) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-1/2 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }
  if (!d) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/trainer/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> My Classes</Link>
        <ErrorState message={q.error ?? "Class not found."} onRetry={q.refetch} />
      </div>
    );
  }

  const o = d.overview;
  const trend = d.charts.attendance_trend.map((p) => ({ label: shortDate(p.date), attendance: p.attendance }));
  const tableCls = "w-full min-w-[640px] text-sm";
  const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
  const td = "px-3 py-2.5";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/trainer/classes" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> My Classes</Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-[1.75rem]">{d.course.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span>Batch {d.batch.name}</span>
            {d.course.category && <span>{d.course.category}</span>}
            {(d.room || d.batch.venue) && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{[d.room, d.batch.venue].filter(Boolean).join(" · ")}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/trainer/attendance" className={buttonVariants()}><ClipboardCheck className="size-4" /> Take Attendance</Link>
          <Link href="/trainer/assessments/new" className={buttonVariants({ variant: "outline" })}>Create Assessment</Link>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-5">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="h-auto w-max min-w-full justify-start gap-1 border-b border-border">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t} className="h-9 flex-none px-3 capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
            <StatCard label="Course Progress" value={`${o.course_progress}%`} icon={TrendingUp} tint="red" className="p-4" />
            <StatCard label="Avg. Attendance" value={`${o.average_attendance}%`} icon={BarChart3} tint="blue" className="p-4" />
            <StatCard label="Avg. Assessment" value={`${o.average_assessment}%`} icon={ClipboardCheck} tint="violet" className="p-4" />
            <StatCard label="Completion Rate" value={`${o.completion_rate}%`} icon={GraduationCap} tint="green" trend={`${o.trainees} trainees`} className="p-4" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Learning Progress Distribution" empty={d.charts.learning_progress.length === 0} emptyMessage="No progress data yet.">
              <TrendBarChart data={d.charts.learning_progress} xKey="bucket" series={[{ key: "trainees", color: "var(--primary)", label: "Trainees" }]} height={220} />
            </Section>
            <Section title="Attendance Trend" empty={trend.length === 0} emptyMessage="No attendance recorded yet.">
              <TrendLineChart data={trend} xKey="label" series={[{ key: "attendance", color: "var(--primary)", label: "Attendance %" }]} height={220} />
            </Section>
            <Section title="Assessment Performance" empty={d.charts.assessment_performance.length === 0} emptyMessage="No assessments completed yet.">
              <TrendBarChart data={d.charts.assessment_performance} xKey="assessment" series={[{ key: "average", color: "var(--primary)", label: "Average %" }, { key: "pass_rate", color: "var(--success)", label: "Pass rate %" }]} height={220} />
            </Section>
            <Section title="At-Risk Trainees" empty={d.at_risk_trainees.length === 0} emptyMessage="All assigned trainees are currently on track.">
              <ul className="flex flex-col divide-y divide-border/60">
                {d.at_risk_trainees.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={t.name} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/trainer/trainees/${t.id}`} className="block truncate text-sm font-semibold hover:text-primary">{t.name}</Link>
                        <p className="text-xs text-muted-foreground">Attendance <PctCell value={t.attendance} /> · Progress <PctCell value={t.course_progress ?? t.learning} /></p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setReminder({ id: t.id, name: t.name, reasons: t.risk_reasons })}>Remind</Button>
                    </div>
                    <ReasonChips reasons={t.risk_reasons} max={3} />
                  </li>
                ))}
              </ul>
              {d.at_risk_trainees.length > 5 && (
                <Button variant="ghost" size="sm" className="self-start" onClick={() => setTab("trainees")}>View all {d.at_risk_trainees.length}</Button>
              )}
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="trainees">
          <Section title={`Trainees (${d.trainees.length})`} empty={d.trainees.length === 0} emptyMessage="No trainees enrolled in this class.">
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead><tr className="border-b border-border"><th className={th}>Trainee</th><th className={th}>Attendance</th><th className={th}>Progress</th><th className={th}>Assessment</th><th className={th}>Status</th><th className={th} /></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {d.trainees.map((t) => (
                    <tr key={t.id}>
                      <td className={td}><div className="flex items-center gap-2.5"><InitialsAvatar name={t.name} className="size-8" /><div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.trainee_code}</p></div></div></td>
                      <td className={td}><PctCell value={t.attendance} /></td>
                      <td className={td}><PctCell value={t.course_progress ?? t.learning} /></td>
                      <td className={td}><PctCell value={t.assessment} /></td>
                      <td className={td}><StatusBadge status={t.status} label={t.status_label} /></td>
                      <td className={`${td} text-right`}><Link href={`/trainer/trainees/${t.id}`} className={buttonVariants({ variant: "outline", size: "xs" })}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="content">
          <Section title="Learning Content" href="/trainer/content" hrefLabel="Manage content" empty={d.content.length === 0} emptyMessage="No content uploaded for this course yet.">
            <ul className="flex flex-col divide-y divide-border/60">
              {d.content.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">{c.position ?? i + 1}</span><span className="font-medium">{c.title}</span></span>
                  {c.duration_minutes ? <span className="text-xs text-muted-foreground">{c.duration_minutes} min</span> : null}
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="attendance">
          <Section title="Attendance Sessions" href="/trainer/attendance" hrefLabel="Take attendance" empty={d.attendance_sessions.length === 0} emptyMessage="No attendance sessions recorded yet.">
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead><tr className="border-b border-border"><th className={th}>Session</th><th className={th}>Date</th><th className={th}>Present</th><th className={th}>Late</th><th className={th}>Absent</th><th className={th}>Rate</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {d.attendance_sessions.map((s) => (
                    <tr key={s.id}><td className={`${td} font-medium`}>{s.name}</td><td className={td}>{fmtDate(s.date)}</td><td className={td}>{s.present}</td><td className={td}>{s.late}</td><td className={td}>{s.absent}</td><td className={td}><PctCell value={s.attendance} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="assessments">
          <Section title="Assessments" href="/trainer/assessments" empty={d.assessments.length === 0} emptyMessage="No assessments for this class yet.">
            <ul className="flex flex-col divide-y divide-border/60">
              {d.assessments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/trainer/assessments/${a.id}`} className="block truncate text-sm font-semibold hover:text-primary">{a.title}</Link>
                    <p className="text-xs text-muted-foreground">{fmtDate(a.scheduled_at, true)} · {a.questions} questions · {a.duration_minutes} min · {a.submitted} submitted{a.average != null ? ` · avg ${a.average}%` : ""}{a.pass_rate != null ? ` · pass ${a.pass_rate}%` : ""}</p>
                  </div>
                  <Pill tone={a.status === "completed" ? "success" : "muted"}>{a.status}</Pill>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="assignments">
          <Section title="Assignments" href="/trainer/assignments" empty={d.assignments.length === 0} emptyMessage="No assignments for this class yet.">
            <ul className="flex flex-col divide-y divide-border/60">
              {d.assignments.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <Link href="/trainer/assignments" className="truncate text-sm font-semibold hover:text-primary">{a.title}</Link>
                    <Pill>{a.status}</Pill>
                  </div>
                  <p className="text-xs text-muted-foreground">Due {fmtDate(a.deadline)} · {a.submitted}/{a.assigned} submitted · {a.graded} graded · {a.pending} pending</p>
                  <MetricBar label="Submission rate" value={a.assigned ? (a.submitted / a.assigned) * 100 : 0} />
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="progress">
          <Section title="Learning Progress" empty={d.trainees.length === 0} emptyMessage="No trainees enrolled in this class.">
            <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {[...d.trainees].sort((a, b) => (a.course_progress ?? a.learning) - (b.course_progress ?? b.learning)).map((t) => (
                <li key={t.id}>
                  <Link href={`/trainer/trainees/${t.id}`} className="mb-1 block text-xs text-muted-foreground hover:text-primary">{t.trainee_code}</Link>
                  <MetricBar label={t.name} value={t.course_progress ?? t.learning} />
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="announcements">
          <Section title="Announcements" href="/trainer/messages" hrefLabel="Compose" empty={d.announcements.length === 0} emptyMessage="No announcements sent to this class.">
            <ul className="flex flex-col divide-y divide-border/60">
              {d.announcements.map((a) => (
                <li key={a.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{a.title}</p><Pill tone={a.status === "sent" ? "success" : "muted"}>{a.status}</Pill></div>
                  <p className="text-sm text-muted-foreground">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(a.created_at, true)} · {a.audience}</p>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>
      </Tabs>

      <SendReminderDialog target={reminder} onClose={() => setReminder(null)} />
    </div>
  );
}
