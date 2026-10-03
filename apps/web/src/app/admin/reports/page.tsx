"use client";

import { useState } from "react";
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
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                  */
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

function ReportCard({
  report,
}: {
  report: typeof REPORTS[0];
}) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const Icon = report.icon;

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
  };

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", report.tagColor)}>
            {report.tag}
          </span>
        </div>
        <CardTitle className="font-heading text-base mt-3">{report.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{report.desc}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-xs text-muted-foreground">
          Last generated:{" "}
          <span className="font-medium text-foreground">
            {new Date(report.lastGen).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        </p>
        {generated && (
          <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            ✓ Report ready — download available
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 border-t pt-4">
        <Button variant="outline" className="flex-1 gap-1.5" size="sm" disabled={!generated}>
          <Download className="size-3.5" /> Download
        </Button>
        <Button className="flex-1 gap-1.5" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {generating ? "Generating…" : "Generate"}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  const totalTrainees = OUTREACH_STATES.reduce((s, r) => s + r.trainees, 0);
  const totalEmployed = OUTREACH_STATES.reduce((s, r) => s + r.employed, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Reports & Analytics Centre"
        description="Generate system-wide reports, monitor national training outreach, and track the employment funnel."
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
                  <span className={cn(
                    "text-xs font-semibold rounded-full px-1.5 py-0.5",
                    kpi.value >= kpi.target
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
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
                    <span className={cn(
                      "text-xs font-semibold w-10 text-right",
                      step.pct >= 75 ? "text-emerald-600 dark:text-emerald-400"
                      : step.pct >= 50 ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                    )}>
                      {step.pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      i === 0 ? "bg-primary" :
                      i < 3 ? "bg-blue-500" :
                      i < 5 ? "bg-violet-500" :
                      "bg-emerald-500"
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
