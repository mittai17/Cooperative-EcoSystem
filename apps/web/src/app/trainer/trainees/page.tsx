"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Download,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ScanLine,
  Search,
  TrendingDown,
  TrendingUp,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { TrendLineChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_RISK_THRESHOLD,
  SCORE_RISK_THRESHOLD,
  trainerClasses,
  trainees,
} from "@/lib/mock-data/trainer";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const skillTone: Record<string, string> = {
  Advanced: "bg-tint-green-bg text-tint-green-fg",
  Proficient: "bg-tint-blue-bg text-primary",
  Developing: "bg-tint-amber-bg text-amber-700",
  Beginner: "bg-muted text-muted-foreground",
};

const attendanceTone: Record<string, string> = {
  up: "text-emerald-700",
  down: "text-red-700",
  neutral: "text-muted-foreground",
};

function attendanceBand(pct: number): "healthy" | "watch" | "risk" {
  if (pct < ATTENDANCE_RISK_THRESHOLD) return "risk";
  if (pct < 85) return "watch";
  return "healthy";
}

function scoreBand(pct: number): "healthy" | "watch" | "risk" {
  if (pct < SCORE_RISK_THRESHOLD) return "risk";
  if (pct < 60) return "watch";
  return "healthy";
}

function barColor(pct: number, threshold: number): string {
  if (pct < threshold) return "bg-red-600";
  if (pct < threshold + 10) return "bg-amber-600";
  return "bg-emerald-600";
}

function toCsvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Weekly attendance window, oldest first, so the chart reads left to right. */
function trendWindow(trainee: (typeof trainees)[number]) {
  const start = 6 - trainee.attendanceTrend.length;
  return trainee.attendanceTrend.map((value, index) => ({
    week: `W${start + index}`,
    attendance: value,
  }));
}

export default function TrainerTraineesPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(trainees[0]?.id ?? null);
  const [exporting, setExporting] = useState(false);

  const atRisk = trainees.filter((trainee) => trainee.atRiskReason);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return trainees.filter((trainee) => {
      if (classFilter !== "all" && trainee.classId !== classFilter) return false;
      if (riskFilter === "risk" && !trainee.atRiskReason) return false;
      if (riskFilter === "watch" && !trainee.atRiskReason && attendanceBand(trainee.attendancePct) === "healthy") {
        return false;
      }
      if (
        term &&
        !`${trainee.name} ${trainee.enrolmentId} ${trainee.district}`.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [classFilter, riskFilter, search]);

  const selected = trainees.find((trainee) => trainee.id === selectedId) ?? null;
  const selectedClass = selected
    ? trainerClasses.find((cls) => cls.id === selected.classId)
    : null;
  const selectedTrend = useMemo(
    () => (selected ? trendWindow(selected) : []),
    [selected],
  );
  const selectedScores = useMemo(
    () =>
      (selected?.scores ?? []).map((score) => ({
        label: score.label,
        score: score.pct,
      })),
    [selected],
  );

  const meanAttendance = Math.round(
    trainees.reduce((sum, trainee) => sum + trainee.attendancePct, 0) / trainees.length,
  );
  const meanScore = Math.round(
    trainees.reduce((sum, trainee) => sum + trainee.avgScorePct, 0) / trainees.length,
  );
  const improving = trainees.filter((trainee) => {
    const trend = trainee.attendanceTrend;
    return trend.length > 1 && trend[trend.length - 1] > trend[0];
  }).length;

  function exportCsv() {
    setExporting(true);
    const rows = [
      [
        "Trainee",
        "Enrolment ID",
        "Batch",
        "District",
        "Attendance %",
        "Average score %",
        "Last scan",
        "Scan method",
        "At-risk reason",
      ],
      ...filtered.map((trainee) => [
        trainee.name,
        trainee.enrolmentId,
        trainee.batch,
        trainee.district,
        trainee.attendancePct,
        trainee.avgScorePct,
        trainee.lastScanAt,
        trainee.scanMethod ?? "None",
        trainee.atRiskReason ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "coopsetu-trainer-trainees.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    window.setTimeout(() => setExporting(false), 400);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My trainees"
        description="Search the cohort, read a single trainee's attendance and marks history, and pull the at-risk list into a CSV for the mentor meeting."
        action={
          <Button variant="outline" onClick={exportCsv} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 size-4" />
            )}
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trainees on record"
          value={String(trainees.length)}
          icon={Users}
          trend={`${trainerClasses.length} classes, ${meanAttendance}% mean attendance`}
          trendTone="neutral"
        />
        <StatCard
          label="Flagged at risk"
          value={String(atRisk.length)}
          icon={AlertTriangle}
          trend={`Attendance under ${ATTENDANCE_RISK_THRESHOLD}% or marks under ${SCORE_RISK_THRESHOLD}%`}
          trendTone={atRisk.length > 0 ? "down" : "up"}
        />
        <StatCard
          label="Mean score"
          value={`${meanScore}%`}
          icon={BadgeCheck}
          trend="Across every graded assessment"
          trendTone="up"
        />
        <StatCard
          label="Improving attendance"
          value={String(improving)}
          icon={TrendingUp}
          trend="Up week on week across the term"
          trendTone="up"
        />
      </div>

      {atRisk.length > 0 && (
        <Alert className="border-amber-600/30 bg-amber-50">
          <AlertTriangle className="text-amber-700" />
          <AlertTitle>
            {atRisk.length} trainee{atRisk.length === 1 ? "" : "s"} need a mentor check-in
          </AlertTitle>
          <AlertDescription>
            <span className="space-y-1">
              {atRisk.map((trainee) => (
                <span key={trainee.id} className="flex flex-wrap gap-1.5">
                  <span className="font-medium text-foreground">{trainee.name}</span>
                  <span className="font-mono text-xs text-amber-800">
                    {trainee.attendancePct}% attendance &middot; {trainee.avgScorePct}% marks
                  </span>
                  <span className="text-amber-800">{trainee.atRiskReason}</span>
                </span>
              ))}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-heading text-base">Cohort register</CardTitle>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative lg:max-w-64 lg:flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, ID or district"
                  aria-label="Search trainees"
                  className="pl-8"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={classFilter} onValueChange={(value) => value && setClassFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Filter by class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {trainerClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={(value) => value && setRiskFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Filter by risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="watch">Needs watching</SelectItem>
                    <SelectItem value="risk">At risk only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {exporting && (
              <div className="flex flex-col gap-2" aria-live="polite">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
                <span className="icon-tile-red size-11">
                  <UserRoundSearch className="size-5" />
                </span>
                <p className="font-heading text-sm font-semibold text-foreground">
                  No trainee matches that search
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  No one in the cohort matches the current filters. Try a different batch, widen the
                  risk filter, or clear the search box.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setClassFilter("all");
                    setRiskFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {filtered.map((trainee) => {
                  const open = trainee.id === selectedId;
                  const band = attendanceBand(trainee.attendancePct);
                  return (
                    <li key={trainee.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(trainee.id)}
                        aria-expanded={open}
                        className={cn(
                          "flex w-full flex-col gap-3 p-3 text-left transition-colors lg:flex-row lg:items-center lg:justify-between",
                          open ? "bg-primary/5" : "hover:bg-muted/50",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-md font-heading text-sm font-semibold",
                              open ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            {trainee.name.slice(0, 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                              {trainee.name}
                              {trainee.atRiskReason && (
                                <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
                              )}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {trainee.enrolmentId} &middot; {trainee.batch}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-6">
                          <div className="flex flex-col gap-1 lg:w-32">
                            <span className="text-xs text-muted-foreground">Attendance</span>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={trainee.attendancePct}
                                className={cn(
                                  "flex-1 [&_[data-slot=progress-indicator]]:",
                                  barColor(trainee.attendancePct, ATTENDANCE_RISK_THRESHOLD),
                                )}
                              />
                              <span className="font-mono text-xs text-foreground">
                                {trainee.attendancePct}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:flex-col sm:items-start lg:flex-row">
                            <span className="text-xs text-muted-foreground lg:hidden">Marks</span>
                            <span className="font-mono text-sm text-foreground">
                              {trainee.avgScorePct}%
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 text-xs",
                                band === "healthy"
                                  ? attendanceTone.up
                                  : band === "watch"
                                    ? "text-amber-700"
                                    : attendanceTone.down,
                              )}
                            >
                              {band === "healthy" ? (
                                <TrendingUp className="size-3" />
                              ) : (
                                <TrendingDown className="size-3" />
                              )}
                              {band === "healthy" ? "On track" : band === "watch" ? "Watch" : "At risk"}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="font-heading text-base">Trainee detail</CardTitle>
            {selected && <p className="text-sm text-muted-foreground">{selectedClass?.title}</p>}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!selected ? (
              <p className="text-sm text-muted-foreground">
                Select a trainee from the register to see their trend history.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {selected.name}
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      {selected.enrolmentId} &middot; {selected.batch}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((skill) => (
                      <Badge
                        key={skill.name}
                        variant="secondary"
                        className={skillTone[skill.level] ?? "bg-muted text-muted-foreground"}
                      >
                        {skill.name}: {skill.level}
                      </Badge>
                    ))}
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <dt className="sr-only">District</dt>
                      <dd className="truncate">{selected.district}</dd>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {selected.scanMethod === "Face" ? (
                        <ScanLine className="size-3.5" />
                      ) : (
                        <QrCode className="size-3.5" />
                      )}
                      <dt className="sr-only">Last scan</dt>
                      <dd className="font-mono text-xs">
                        {selected.lastScanAt} {selected.scanMethod ?? "no scan"}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="size-3.5" />
                      <dt className="sr-only">Contact</dt>
                      <dd className="font-mono text-xs">+91 98XXX mark on file</dd>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="size-3.5" />
                      <dt className="sr-only">Email</dt>
                      <dd className="truncate text-xs">on file with the institute</dd>
                    </div>
                  </dl>
                </div>

                {selected.atRiskReason && (
                  <Alert className="border-amber-600/30 bg-amber-50">
                    <AlertTriangle className="text-amber-700" />
                    <AlertTitle>Flagged at risk</AlertTitle>
                    <AlertDescription className="text-amber-800">
                      {selected.atRiskReason}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm font-semibold text-foreground">
                      Attendance, last six weeks
                    </h4>
                    <span className="font-mono text-xs text-muted-foreground">
                      {selected.attendancePct}% term average
                    </span>
                  </div>
                  <div className="h-40">
                    <TrendLineChart
                      data={selectedTrend}
                      xKey="week"
                      height={150}
                      series={[
                        { key: "attendance", label: "Attendance %", color: "var(--primary)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="font-heading text-sm font-semibold text-foreground">
                    Marks by assessment
                  </h4>
                  <ul className="flex flex-col gap-2">
                    {selectedScores.map((score) => (
                      <li key={score.label} className="flex items-center gap-3">
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {score.label}
                        </span>
                        <Progress
                          value={score.score}
                          className={cn(
                            "w-24 [&_[data-slot=progress-indicator]]:",
                            barColor(score.score, SCORE_RISK_THRESHOLD),
                          )}
                        />
                        <span className="w-12 shrink-0 text-right font-mono text-xs text-foreground">
                          {score.score}%
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Marks below {SCORE_RISK_THRESHOLD}% are shown in red.{" "}
                    {scoreBand(selected.avgScorePct) === "risk"
                      ? "This trainee needs a re-sit plan."
                      : scoreBand(selected.avgScorePct) === "watch"
                        ? "Close to the re-sit line, worth a check-in."
                        : "Comfortably above the pass line."}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Filter className="mt-0.5 size-3.5 shrink-0" />
        <span>
          <span className="demo-data-tag mr-1">Sample cohort</span>
          {trainees.length} trainees across {trainerClasses.length} classes come from the CoopSetu demo
          dataset. Contact details are deliberately withheld; the real roster, marks and guardian
          numbers load from the FastAPI service.
        </span>
      </p>
    </div>
  );
}
