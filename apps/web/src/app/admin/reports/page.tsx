"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Award,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Play,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { getAdminDashboard, getReport, type ReportResponse } from "@/lib/admin/admin-api";
import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import {
  DEMO_DONUT,
  DEMO_REPORTS,
  REPORT_PERIODS,
  REPORT_TABS,
  chartBars,
  type ChartPoint,
  type ReportKey,
} from "@/components/admin/reports/report-data";
import { downloadReportCsv } from "@/components/admin/reports/export-csv";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Recharts measures the DOM, so the chart components are loaded only in the browser.
const EnrollmentBarChart = dynamic(
  () => import("@/components/admin/reports/report-charts").then((m) => m.EnrollmentBarChart),
  { ssr: false }
);
const DistributionDonut = dynamic(
  () => import("@/components/admin/reports/report-charts").then((m) => m.DistributionDonut),
  { ssr: false }
);

const BAR_TITLES: Record<ReportKey, string> = {
  enrollment: "Trainee Enrollment",
  placements: "Placements by Month",
  assessments: "Average Score by Assessment",
  certifications: "Certifications by Program",
};

/* -------------------------------------------------------------------------- */
/*  National KPIs & Funnel Data                                               */
/* -------------------------------------------------------------------------- */

const ATTENDANCE_KPIS = [
  { label: "National Avg Attendance", value: 87, target: 90, color: "bg-blue-500" },
  { label: "VAMNICOM Programmes", value: 92, target: 90, color: "bg-emerald-500" },
  { label: "RICM Programmes", value: 84, target: 90, color: "bg-violet-500" },
  { label: "NCUI Training Centres", value: 79, target: 85, color: "bg-amber-500" },
];

const OUTREACH_STATES = [
  { state: "Gujarat", institutions: 5, trainees: 1840, employed: 1420, color: "bg-emerald-500" },
  { state: "Maharashtra", institutions: 4, trainees: 1560, employed: 1180, color: "bg-blue-500" },
  { state: "Rajasthan", institutions: 3, trainees: 920, employed: 680, color: "bg-violet-500" },
  { state: "Uttar Pradesh", institutions: 3, trainees: 870, employed: 610, color: "bg-amber-500" },
  { state: "Karnataka", institutions: 2, trainees: 640, employed: 490, color: "bg-rose-500" },
  { state: "Madhya Pradesh", institutions: 2, trainees: 580, employed: 420, color: "bg-teal-500" },
];

const EMPLOYMENT_FUNNEL = [
  { stage: "Registered", count: 6410, pct: 100 },
  { stage: "Programme Enrolled", count: 5820, pct: 91 },
  { stage: "Attended ≥75%", count: 4980, pct: 78 },
  { stage: "Assessed", count: 4520, pct: 71 },
  { stage: "Certified", count: 3840, pct: 60 },
  { stage: "Job Matched", count: 2950, pct: 46 },
  { stage: "Employed (Confirmed)", count: 2260, pct: 35 },
];

const REPORTS = [
  {
    id: "1",
    icon: Users,
    title: "Trainee Progress Report",
    desc: "Attendance, assessment scores, and completion rates across all active programmes.",
    lastGen: "2026-09-20",
    tag: "Weekly",
    tagColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    id: "2",
    icon: TrendingUp,
    title: "Employment Outcomes",
    desc: "Placement statistics, top hiring employers, and average salary trends by sector.",
    lastGen: "2026-09-01",
    tag: "Monthly",
    tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    id: "3",
    icon: BarChart3,
    title: "Skill Gap Analysis",
    desc: "Comparison of market skill demand against training institution capacity.",
    lastGen: "2026-08-15",
    tag: "Quarterly",
    tagColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  },
  {
    id: "4",
    icon: Building2,
    title: "Institution Performance",
    desc: "Benchmarking institutions on completion rates, attendance, and placements.",
    lastGen: "2026-09-25",
    tag: "Monthly",
    tagColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    id: "5",
    icon: BadgeCheck,
    title: "Certificate Registry",
    desc: "Full ledger of all certificates issued, including revoked and expired status.",
    lastGen: "2026-09-27",
    tag: "Daily",
    tagColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    id: "6",
    icon: CalendarCheck,
    title: "Attendance Analytics",
    desc: "Session-level attendance breakdown by institution, batch, and date range.",
    lastGen: "2026-10-02",
    tag: "Daily",
    tagColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
];

/* -------------------------------------------------------------------------- */
/*  Report card                                                                */
/* -------------------------------------------------------------------------- */

function ReportCard({ report }: { report: (typeof REPORTS)[0] }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1200);
  }

  const Icon = report.icon;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <span className={cn("text-xs font-medium rounded-full px-2 py-0.5", report.tagColor)}>
            {report.tag}
          </span>
        </div>
        <CardTitle className="font-heading text-sm mt-3">{report.title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{report.desc}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-0 flex items-center justify-between border-t border-border/50 text-xs text-muted-foreground">
        <span>Last generated: {report.lastGen}</span>
        <Button
          size="sm"
          variant={generated ? "outline" : "default"}
          className="gap-1.5 h-8 text-xs cursor-pointer"
          disabled={generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {generating ? "Generating…" : generated ? "Download" : "Generate"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
      No chart data yet.
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportKey>("enrollment");
  const [months, setMonths] = useState<number>(6);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [donut, setDonut] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const totalTrainees = OUTREACH_STATES.reduce((s, r) => s + r.trainees, 0);
  const totalEmployed = OUTREACH_STATES.reduce((s, r) => s + r.employed, 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, dashboard] = await Promise.all([getReport(tab), getAdminDashboard()]);
        if (cancelled) return;
        setReport(data);
        setDonut(dashboard.program_distribution.map((p) => ({ label: p.label, value: p.percent })));
        setUsingDemo(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setReport(DEMO_REPORTS[tab]);
        setDonut(DEMO_DONUT);
        setUsingDemo(true);
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, reloadKey]);

  const bars = report ? chartBars(report.chart) : [];
  const visibleBars = tab === "enrollment" || tab === "placements" ? bars.slice(-months) : bars;

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await downloadReportCsv(tab);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <AdminPageHeader
        icon={Download}
        title="Reports & Analytics Centre"
        description="Generate system-wide reports, monitor national training outreach, visual analytics, and track the employment funnel."
        action={
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer shadow-xs"
          >
            <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Export Report (CSV)"}
          </button>
        }
      />

      {/* ── Attendance KPIs ─────────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="size-4 text-primary" /> National Attendance KPIs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ATTENDANCE_KPIS.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <span
                    className={cn(
                      "text-xs font-semibold rounded-full px-1.5 py-0.5",
                      kpi.value >= kpi.target
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {kpi.value >= kpi.target ? "✓ On target" : `${kpi.target - kpi.value}% gap`}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-2">{kpi.value}%</p>
                <Progress value={kpi.value} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1.5">Target: {kpi.target}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Interactive Visual Analytics & Charts ───────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-border pb-3">
          <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-6">
            {REPORT_TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`border-b-2 pb-2 text-sm font-semibold transition-colors cursor-pointer ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-muted-foreground dark:hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {usingDemo && <DemoBanner />}
            <span className="text-xs text-slate-500">Live data unavailable: {error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
        {exportError && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            Could not export: {exportError}
          </p>
        )}

        {loading ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading report">
            <div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-muted" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-muted" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-slate-200/80 dark:border-border p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-foreground">
                    {BAR_TITLES[tab]}
                  </h2>
                  {(tab === "enrollment" || tab === "placements") && (
                    <select
                      aria-label="Chart period"
                      value={months}
                      onChange={(e) => setMonths(Number(e.target.value))}
                      className="h-9 rounded-lg border border-slate-200 bg-white dark:bg-card dark:border-border px-3 text-sm text-slate-700 dark:text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      {REPORT_PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="h-64">
                  {visibleBars.length === 0 ? <EmptyChart /> : <EnrollmentBarChart data={visibleBars} />}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200/80 dark:border-border p-5">
                <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-foreground">
                  Program-wise Distribution
                </h2>
                <div className="h-64">
                  {donut.length === 0 ? <EmptyChart /> : <DistributionDonut data={donut} />}
                </div>
              </section>
            </div>

            <div className="mt-6 overflow-x-auto">
              {!report || report.rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-border p-10 text-center text-sm text-slate-500">
                  No rows for this report yet.
                </div>
              ) : (
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-border text-xs uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
                      {report.columns.map((col) => (
                        <th key={col} className="px-3 py-3 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-border/50 last:border-0">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-3 text-slate-700 dark:text-foreground/90">
                            {typeof cell === "number" ? cell.toLocaleString("en-IN") : (cell ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Outreach Map + Employment Funnel ────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Outreach by state */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> National Outreach by State
            </CardTitle>
            <CardDescription>
              {OUTREACH_STATES.length} states covered &middot; {totalTrainees.toLocaleString("en-IN")} trainees &middot; {totalEmployed.toLocaleString("en-IN")} employed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {OUTREACH_STATES.map((row) => {
              const empRate = Math.round((row.employed / row.trainees) * 100);
              return (
                <div key={row.state}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", row.color)} />
                      <span className="text-sm font-medium text-foreground">{row.state}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.institutions} inst.
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{row.trainees.toLocaleString("en-IN")} trainees</span>
                      <span className="font-medium text-foreground">{empRate}% employed</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", row.color)}
                      style={{ width: `${empRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Employment funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" /> Training → Employment Funnel
            </CardTitle>
            <CardDescription>
              Conversion from registration to confirmed hire — national aggregate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {EMPLOYMENT_FUNNEL.map((step, i) => (
              <div key={step.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{step.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {step.count.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold w-10 text-right",
                        step.pct >= 75
                          ? "text-emerald-600 dark:text-emerald-400"
                          : step.pct >= 50
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {step.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      i === 0
                        ? "bg-primary"
                        : i < 3
                        ? "bg-blue-500"
                        : i < 5
                        ? "bg-violet-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Report cards ────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="size-4 text-primary" /> Available Reports
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>
    </div>
  );
}
