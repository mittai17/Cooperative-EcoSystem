"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FilePlus2,
  GraduationCap,
  Lightbulb,
  MapPin,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, type StatTint } from "@/components/dashboard/stat-card";
import { TrendLineChart } from "@/components/dashboard/charts";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/trainer/states";
import { useTrainerQuery } from "@/lib/trainer/api";
import { trainerProfile } from "@/lib/mock-data/trainer";
import { cn } from "@/lib/utils";
import { Section } from "./section";
import type { ClassSlot, DashboardData } from "./types";
import {
  InitialsAvatar,
  PctCell,
  ReasonChips,
  SendReminderDialog,
  relTime,
  type ReminderTarget,
} from "@/components/trainer/trainees/shared";

const noopSubscribe = () => () => {};

function useGreeting(name: string | undefined) {
  const hour = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getHours(),
    () => -1
  );
  const part = hour < 0 ? "Welcome" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const parts = (name || trainerProfile.name).split(/\s+/);
  const short = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts.join(" ");
  return `${part}, ${short}`;
}

function slotIsLive(s: ClassSlot, today: string) {
  if (s.date !== today) return false;
  if (s.attendance_status === "live" || s.attendance_status === "in_progress") return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = s.start.split(":").map(Number);
  const [eh, em] = s.end.split(":").map(Number);
  return cur >= sh * 60 + sm && cur < eh * 60 + em;
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

const ACTIVITY_ICON: Record<string, typeof Activity> = {
  assignment: ClipboardList,
  assessment: ClipboardCheck,
  attendance: CheckCircle2,
};

export function DashboardView() {
  const q = useTrainerQuery<DashboardData>("/dashboard", { pollMs: 120000 });
  const [reminder, setReminder] = useState<ReminderTarget | null>(null);
  const d = q.data;
  const greeting = useGreeting(d?.trainer.name);
  const err = q.error && !d ? q.error : null;
  const loading = q.loading && !d;
  const sec = { loading, error: err, onRetry: q.refetch };

  const k = d?.kpis;
  const delta = k?.attendance_delta ?? 0;
  const doneToday = d ? d.today_classes.filter((c) => c.attendance_status === "completed").length : 0;
  const liveToday = d ? d.today_classes.filter((c) => slotIsLive(c, d.today)).length : 0;
  const kpis: {
    label: string;
    value: string;
    icon: typeof Users;
    tint: StatTint;
    trend?: string;
    tone?: "up" | "down" | "neutral";
  }[] = k
    ? [
        {
          label: "Today's Classes",
          value: String(k.todays_classes),
          icon: CalendarDays,
          tint: "red",
          trend: k.todays_classes
            ? doneToday
              ? `${doneToday} of ${k.todays_classes} attendance done`
              : `${liveToday} live now`
            : "Free day",
        },
        { label: "Upcoming Classes", value: String(k.upcoming_classes), icon: CalendarClock, tint: "blue", trend: "Next 2 weeks" },
        { label: "Trainees", value: String(k.trainees), icon: Users, tint: "green", trend: `${d!.learning_progress.length} active classes` },
        { label: "Average Attendance", value: `${k.average_attendance}%`, icon: BarChart3, tint: "violet", trend: `${delta > 0 ? "+" : ""}${delta}% vs last week`, tone: delta > 0 ? "up" : delta < 0 ? "down" : "neutral" },
        { label: "Pending Assessments", value: String(k.pending_assessments), icon: ClipboardCheck, tint: "amber", trend: k.pending_breakdown ? `${k.pending_breakdown.submissions_to_grade} to grade · ${k.pending_breakdown.attempts_to_review} to review` : undefined },
        { label: "At-Risk Trainees", value: String(k.at_risk), icon: AlertTriangle, tint: "red", trend: k.at_risk ? "Needs your attention" : "All on track", tone: k.at_risk ? "down" : "up" },
      ]
    : [];

  const trend = (d?.attendance_trend ?? []).map((p) => ({
    ...p,
    label: new Date(`${p.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={greeting}
        description="Manage your classes, track trainee progress and support skill development."
        action={
          <>
            <Link href="/trainer/assessments/new" className={buttonVariants({ size: "default" })}>
              <FilePlus2 className="size-4" /> Create Assessment
            </Link>
            <Link href="/trainer/attendance" className={buttonVariants({ variant: "outline" })}>
              <ClipboardCheck className="size-4" /> Take Attendance
            </Link>
            <Link href="/trainer/content" className={buttonVariants({ variant: "outline" })}>
              <Upload className="size-4" /> Upload Content
            </Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          : err
            ? <div className="col-span-full"><ErrorState message={err} onRetry={q.refetch} /></div>
            : kpis.map((c) => (
                <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tint={c.tint} trend={c.trend} trendTone={c.tone} className="p-4" />
              ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-6 2xl:grid-cols-2">
            <Section title="Today's Classes" icon={CalendarDays} href="/trainer/calendar" hrefLabel="Full schedule" {...sec} empty={!!d && d.today_classes.length === 0} emptyMessage="No classes scheduled for today.">
              <ul className="flex flex-col gap-3">
                {d?.today_classes.map((c) => (
                  <TodayClassCard key={c.slot_id} c={c} today={d.today} />
                ))}
              </ul>
            </Section>

            <Section title="At-Risk Trainees" icon={AlertTriangle} href="/trainer/trainees?status=at_risk" {...sec} empty={!!d && d.at_risk_trainees.length === 0} emptyMessage="All assigned trainees are currently on track.">
              <ul className="flex flex-col divide-y divide-border/60">
                {d?.at_risk_trainees.map((t) => (
                  <li key={t.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <InitialsAvatar name={t.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.batch} · Attendance <PctCell value={t.attendance} /> · Learning <PctCell value={t.learning} /> · Active {relTime(t.last_activity)}
                        </p>
                      </div>
                    </div>
                    <ReasonChips reasons={t.risk_reasons} />
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/trainer/trainees/${t.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>View Trainee</Link>
                      <Button size="sm" variant="secondary" onClick={() => setReminder({ id: t.id, name: t.name, reasons: t.risk_reasons })}>Send Reminder</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Attendance Trend" icon={BarChart3} {...sec} empty={!!d && trend.length === 0} emptyMessage="No attendance recorded yet.">
              <TrendLineChart data={trend} xKey="label" series={[{ key: "attendance", color: "var(--primary)", label: "Attendance %" }]} height={230} />
            </Section>
            <Section title="Learning Progress by Class" icon={BookOpen} href="/trainer/classes" hrefLabel="My classes" {...sec} empty={!!d && d.learning_progress.length === 0} emptyMessage="No classes assigned yet.">
              <HorizontalBarList items={(d?.learning_progress ?? []).map((l) => ({ label: `${l.course} · ${l.batch}`, value: l.progress }))} max={100} valueFormatter={(v) => `${v}%`} />
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Upcoming Assessments" icon={ClipboardCheck} href="/trainer/assessments" {...sec} empty={!!d && d.upcoming_assessments.length === 0} emptyMessage="You're all caught up." emptyHint="No assessments are scheduled.">
              <ul className="flex flex-col divide-y divide-border/60">
                {d?.upcoming_assessments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/trainer/assessments/${a.id}`} className="block truncate text-sm font-medium hover:text-primary">{a.title}</Link>
                      <p className="text-xs text-muted-foreground">{a.batch} · {a.questions} questions · {a.duration_minutes} min</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {new Date(a.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Recent Activity" icon={Activity} {...sec} empty={!!d && d.recent_activity.length === 0} emptyMessage="You're all caught up." emptyHint="No recent trainee activity.">
              <ul className="flex flex-col gap-3">
                {d?.recent_activity.slice(0, 6).map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.type] ?? Activity;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon className="size-3.5" /></span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{a.text}</p>
                        <p className="text-xs text-muted-foreground">{relTime(a.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Skill Development" icon={GraduationCap} href="/trainer/skills" hrefLabel="Evaluate skills" {...sec} empty={!!d && d.skills.length === 0} emptyMessage="No skill data yet.">
              <HorizontalBarList items={(d?.skills ?? []).map((s) => ({ label: s.skill, value: s.average }))} max={100} valueFormatter={(v) => `${v}%`} />
            </Section>
            <Section title="AI Class Insights" icon={Sparkles} {...sec} empty={!!d && d.insights.length === 0} emptyMessage="No insights right now." emptyHint="Insights appear as class data accumulates.">
              <ul className="flex flex-col gap-2.5">
                {d?.insights.map((i, n) => (
                  <li key={n} className={cn("flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm", i.severity === "critical" || i.severity === "danger" ? "bg-destructive/10" : i.severity === "warning" ? "bg-warning/10" : i.severity === "positive" || i.severity === "success" ? "bg-success/10" : "bg-muted")}>
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="text-foreground">{i.text}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section title="Upcoming Classes" icon={CalendarClock} {...sec} empty={!!d && d.upcoming.tomorrow.length + d.upcoming.this_week.length === 0} emptyMessage="No upcoming classes this week.">
            <div className="flex flex-col gap-5">
              {([
                ["Tomorrow", d?.upcoming.tomorrow ?? []],
                ["This Week", d?.upcoming.this_week ?? []],
              ] as const).map(([label, rows]) => (
                <div key={label}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
                  {rows.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border py-4 text-center text-sm text-muted-foreground">No classes {label === "Tomorrow" ? "tomorrow" : "later this week"}.</p>
                  ) : (
                    <ul className="grid gap-3 md:grid-cols-2">
                      {rows.map((c) => (
                        <li key={c.slot_id} className="flex flex-col gap-3 rounded-xl border border-border/70 p-3.5">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.course}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{c.batch} · {dayLabel(c.date)} · {c.start_label}–{c.end_label}{c.room ? ` · ${c.room}` : ""}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/trainer/classes/${c.class_id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>View Class</Link>
                            <Link href={`/trainer/classes/${c.class_id}?tab=trainees`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View Roster</Link>
                            <Link href="/trainer/content" className={buttonVariants({ variant: "ghost", size: "sm" })}>Open Materials</Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* xl right-hand compact panel */}
        <aside className="hidden flex-col gap-6 xl:flex">
          <Section title="Today's Schedule" icon={Clock} {...sec} skeletonRows={3} empty={!!d && d.today_classes.length === 0} emptyMessage="No classes scheduled for today.">
            <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
              {d?.today_classes.map((c) => {
                const live = slotIsLive(c, d.today);
                return (
                  <li key={c.slot_id} className="relative">
                    <span className={cn("absolute -left-[21px] top-1.5 size-2.5 rounded-full ring-4 ring-card", live ? "bg-primary" : c.attendance_status === "completed" ? "bg-success" : "bg-border")} />
                    <p className="text-xs font-medium text-muted-foreground">{c.start_label} – {c.end_label}</p>
                    <Link href={`/trainer/classes/${c.class_id}`} className="text-sm font-semibold hover:text-primary">{c.course}</Link>
                    <p className="text-xs text-muted-foreground">{c.batch}{c.room ? ` · ${c.room}` : ""}</p>
                  </li>
                );
              })}
            </ol>
          </Section>
          <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold">Quick Actions</h2>
            {[
              { href: "/trainer/attendance", label: "Take Attendance", icon: ClipboardCheck },
              { href: "/trainer/assessments/new", label: "Create Assessment", icon: FilePlus2 },
              { href: "/trainer/assignments", label: "Review Assignments", icon: ClipboardList },
              { href: "/trainer/content", label: "Upload Content", icon: Upload },
              { href: "/trainer/messages", label: `Messages${d?.unread_messages ? ` (${d.unread_messages} new)` : ""}`, icon: Users },
            ].map((a) => (
              <Link key={a.href} href={a.href} className={cn(buttonVariants({ variant: "outline" }), "justify-start")}>
                <a.icon className="size-4 text-primary" /> {a.label}
              </Link>
            ))}
          </section>
        </aside>
      </div>

      <SendReminderDialog target={reminder} onClose={() => setReminder(null)} />
    </div>
  );
}

function TodayClassCard({ c, today }: { c: ClassSlot; today: string }) {
  const live = slotIsLive(c, today);
  const done = c.attendance_status === "completed";
  return (
    <li className={cn("flex flex-col gap-3 rounded-xl border p-3.5", live ? "border-primary/40 bg-primary/[0.03]" : "border-border/70")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{c.course}</p>
          <p className="text-xs text-muted-foreground">Batch {c.batch}</p>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        )}
        {done && !live && <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">Completed</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{c.start_label} – {c.end_label}</span>
        {c.room && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{c.room}</span>}
        <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{c.trainees} trainees</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {done ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-success/10 px-3 text-[0.8rem] font-medium text-success">
            <CheckCircle2 className="size-3.5" /> Attendance Completed{c.present != null ? ` · ${c.present} present` : ""}
          </span>
        ) : (
          <Link href={`/trainer/attendance?slot=${c.slot_id}`} className={buttonVariants({ size: "sm" })}>Take Attendance</Link>
        )}
        <Link href={`/trainer/classes/${c.class_id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open Class</Link>
      </div>
    </li>
  );
}
