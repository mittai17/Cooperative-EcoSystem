"use client";

import { useState } from "react";
import { Activity, AlertTriangle, BookOpenCheck, CalendarCheck, ClipboardCheck, Trophy } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendBarChart, TrendLineChart } from "@/components/dashboard/charts";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { FilterSelect } from "@/components/trainer/filter-select";
import { useTrainerQuery } from "@/lib/trainer/api";

interface Analytics {
  empty: boolean;
  batches: { id: string; name: string }[];
  metrics?: {
    classes_conducted: number;
    attendance_avg: number | null;
    course_completion: number | null;
    assessment_avg: number | null;
    pass_rate: number | null;
    at_risk: number;
    trainees: number;
  };
  attendance_trend?: { date: string; label: string; attendance: number }[];
  assessment_trend?: { label: string; average: number | null; pass_rate: number | null }[];
  learning_completion?: { label: string; completion: number }[];
  skill_growth?: {
    by_skill: { skill: string; confidence: number }[];
    by_month: { month: string; rating: number; evaluations: number }[];
  };
}

const RED = "#E31B23";
const pctv = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);

function Panel({ title, hint, children, empty }: { title: string; hint?: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      {hint && <p className="mb-3 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2">{empty ? <EmptyState title="No data yet" hint="This chart fills in as records are captured." /> : children}</div>
    </section>
  );
}

export function AnalyticsView() {
  const [batch, setBatch] = useState("");
  const { data, loading, error, refetch } = useTrainerQuery<Analytics>(`/analytics${batch ? `?batch_id=${batch}` : ""}`);

  const filter = data && (
    <FilterSelect
      label="Batch"
      value={batch}
      onChange={setBatch}
      options={[{ value: "", label: "All batches" }, ...data.batches.map((b) => ({ value: b.id, label: b.name }))]}
      className="w-44"
    />
  );

  if (loading && !data) return <LoadingBlock rows={5} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.empty || !data.metrics) return <EmptyState title="No classes assigned" hint="Analytics appear once you teach a batch." />;

  const m = data.metrics;
  // average multiple sessions on the same day into one point
  const byDate = new Map<string, { label: string; sum: number; n: number }>();
  for (const p of data.attendance_trend ?? []) {
    const cur = byDate.get(p.date) ?? { label: p.label, sum: 0, n: 0 };
    byDate.set(p.date, { label: cur.label, sum: cur.sum + p.attendance, n: cur.n + 1 });
  }
  const att = [...byDate.entries()].sort().map(([, v]) => ({ label: v.label, attendance: Math.round(v.sum / v.n) }));
  const assess = (data.assessment_trend ?? []).map((a) => ({
    label: a.label.length > 22 ? `${a.label.slice(0, 20)}…` : a.label,
    average: a.average ?? 0,
    pass_rate: a.pass_rate ?? 0,
  }));
  const learning = (data.learning_completion ?? []).map((l) => ({ label: l.label.length > 16 ? `${l.label.slice(0, 15)}…` : l.label, completion: l.completion }));
  const skills = (data.skill_growth?.by_skill ?? []).map((s) => ({ label: s.skill.length > 14 ? `${s.skill.slice(0, 13)}…` : s.skill, confidence: s.confidence }));
  const months = data.skill_growth?.by_month ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">{filter}</div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Classes conducted" value={String(m.classes_conducted)} icon={CalendarCheck} tint="red" />
        <StatCard label="Attendance avg" value={pctv(m.attendance_avg)} icon={Activity} tint="green" />
        <StatCard label="Course completion" value={pctv(m.course_completion)} icon={BookOpenCheck} tint="blue" />
        <StatCard label="Assessment avg" value={pctv(m.assessment_avg)} icon={ClipboardCheck} tint="violet" />
        <StatCard label="Pass rate" value={pctv(m.pass_rate)} icon={Trophy} tint="amber" />
        <StatCard label="At-risk trainees" value={String(m.at_risk)} icon={AlertTriangle} tint="red" trend={`of ${m.trainees} trainees`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Attendance trend" hint="Average attendance % per class day" empty={att.length === 0}>
          <TrendLineChart data={att} xKey="label" series={[{ key: "attendance", color: RED, label: "Attendance %" }]} />
        </Panel>
        <Panel title="Assessment trend" hint="Average score and pass rate per assessment, oldest first" empty={assess.length === 0}>
          <TrendLineChart
            data={assess}
            xKey="label"
            series={[
              { key: "average", color: RED, label: "Average score" },
              { key: "pass_rate", color: "#2563eb", label: "Pass rate %" },
            ]}
          />
        </Panel>
        <Panel title="Learning completion" hint="Average course progress per class" empty={learning.length === 0}>
          <TrendBarChart data={learning} xKey="label" series={[{ key: "completion", color: RED, label: "Completion %" }]} />
        </Panel>
        <Panel title="Skill growth" hint="Average trainee confidence by skill" empty={skills.length === 0}>
          <TrendBarChart data={skills} xKey="label" series={[{ key: "confidence", color: "#2563eb", label: "Confidence %" }]} />
        </Panel>
      </div>

      {months.length > 0 && (
        <Panel title="Trainer evaluation rating by month" hint="Average rating from your skill evaluations">
          <TrendLineChart data={months} xKey="month" series={[{ key: "rating", color: RED, label: "Avg rating" }]} height={220} />
        </Panel>
      )}
    </div>
  );
}
