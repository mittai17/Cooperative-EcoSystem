"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Check,
  CircleAlert,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Inbox,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  certificationThresholds,
  institutionAssessmentsSeed,
  institutionBatchesSeed,
  institutionCoursesSeed,
  INSTITUTION_DEMO_TODAY,
  type Assessment,
  type AssessmentStatus,
  type AssessmentType,
  type Batch,
} from "@/lib/mock-data/institution";

type LoadState = "loading" | "ready" | "error";
type TypeFilter = AssessmentType | "All";
type StatusFilter = AssessmentStatus | "All";

const TYPE_FILTERS: TypeFilter[] = ["All", "Quiz", "Practical", "Project", "Viva"];
const STATUS_FILTERS: StatusFilter[] = ["All", "Scheduled", "Grading", "Completed"];

const TYPE_TONE: Record<AssessmentType, string> = {
  Quiz: "bg-primary/10 text-primary",
  Practical: "bg-tint-amber-bg text-tint-amber-fg",
  Project: "bg-tint-violet-bg text-tint-violet-fg",
  Viva: "bg-tint-green-bg text-tint-green-fg",
};

const STATUS_TONE: Record<AssessmentStatus, string> = {
  Scheduled: "bg-secondary text-secondary-foreground",
  Grading: "bg-warning/10 text-warning",
  Completed: "bg-success/10 text-success",
};

/** Certification gates that can be derived from the demo dataset. */
const DERIVED_GATES = [
  { key: "attendance", label: "Attendance", min: 75, rule: "Minimum 75% across every mapped session" },
  { key: "completion", label: "Course completion", min: 80, rule: "Minimum 80% completion on all mapped LMS courses" },
  { key: "assessment", label: "Assessment", min: 60, rule: "At least the pass mark in every graded assessment" },
] as const;

type GateKey = (typeof DERIVED_GATES)[number]["key"];

async function loadAssessments(): Promise<Assessment[]> {
  return institutionAssessmentsSeed.map((row) => ({
    ...row,
    questions: row.questions.map((question) => ({ ...question })),
  }));
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Certification readiness for one batch, derived from batches + courses + assessments. */
function readinessFor(
  batch: Batch,
  rows: Assessment[],
): Record<GateKey, number | null> {
  const courses = institutionCoursesSeed.filter(
    (course) => course.programmeCode === batch.programmeCode && course.enrolled > 0,
  );
  const completion = average(courses.map((course) => course.completionPct));

  const scored = rows.filter(
    (row) => row.batchCode === batch.code && row.avgScorePct !== null,
  );
  const assessment = average(scored.map((row) => row.avgScorePct ?? 0));

  return { attendance: batch.avgAttendance, completion, assessment };
}

function csvCell(value: string | number | null): string {
  if (value === null) return "Not graded";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function AssessmentsPage() {
  const [rows, setRows] = useState<Assessment[]>(() =>
    institutionAssessmentsSeed.map((row) => ({
      ...row,
      questions: row.questions.map((question) => ({ ...question })),
    })),
  );
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [batchFilter, setBatchFilter] = useState<string>("all-batches");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [readinessBatch, setReadinessBatch] = useState<string>(institutionBatchesSeed[0].code);

  const counts = useMemo(
    () => ({
      scheduled: rows.filter((row) => row.status === "Scheduled").length,
      grading: rows.filter((row) => row.status === "Grading").length,
      completed: rows.filter((row) => row.status === "Completed").length,
      submissions: rows.reduce((sum, row) => sum + row.submissions, 0),
    }),
    [rows],
  );

  const overallPassRate = useMemo(() => {
    const rates = rows
      .filter((row) => row.passRatePct !== null)
      .map((row) => row.passRatePct ?? 0);
    return average(rates);
  }, [rows]);

  const batchCodes = useMemo(
    () => Array.from(new Set(rows.map((row) => row.batchCode))).sort(),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "All" && row.type !== typeFilter) return false;
      if (statusFilter !== "All" && row.status !== statusFilter) return false;
      if (batchFilter !== "all-batches" && row.batchCode !== batchFilter) return false;
      if (!needle) return true;
      return (
        row.title.toLowerCase().includes(needle) ||
        row.programme.toLowerCase().includes(needle) ||
        row.course.toLowerCase().includes(needle)
      );
    });
  }, [rows, typeFilter, statusFilter, batchFilter, query]);

  const open = rows.find((row) => row.id === openId) ?? null;
  const isFiltered =
    typeFilter !== "All" || statusFilter !== "All" || batchFilter !== "all-batches" || query.trim() !== "";
  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.includes(row.id));

  const readinessBatchRow =
    institutionBatchesSeed.find((batch) => batch.code === readinessBatch) ?? institutionBatchesSeed[0];
  const readiness = readinessFor(readinessBatchRow, rows);
  const metGates = DERIVED_GATES.filter((gate) => {
    const value = readiness[gate.key];
    return value !== null && value >= gate.min;
  });
  const pendingGates = DERIVED_GATES.length - metGates.length;
  const eligible = pendingGates === 0;

  async function refresh() {
    setLoadState("loading");
    try {
      const next = await loadAssessments();
      setRows(next);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  function clearFilters() {
    setTypeFilter("All");
    setStatusFilter("All");
    setBatchFilter("all-batches");
    setQuery("");
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((item) => item !== id)));
  }

  function toggleAllVisible(checked: boolean) {
    const ids = visible.map((row) => row.id);
    setSelected((prev) =>
      checked
        ? Array.from(new Set([...prev, ...ids]))
        : prev.filter((id) => !ids.includes(id)),
    );
  }

  function saveComment(assessmentId: string, questionId: string) {
    const key = `${assessmentId}:${questionId}`;
    if (!comments[key]?.trim()) return;
    setNotice("Reviewer note saved to this assessment. Stored in the browser for this session only.");
  }

  function exportMarkSheet() {
    const chosen = rows.filter((row) => selected.includes(row.id));
    const header = [
      "Assessment",
      "Type",
      "Programme",
      "Batch",
      "Status",
      "Due",
      "Max marks",
      "Pass marks",
      "Submissions",
      "Graded",
      "Average %",
      "Pass rate %",
    ];
    const body = chosen.map((row) => [
      row.title,
      row.type,
      row.programme,
      row.batchCode,
      row.status,
      row.dueDate,
      row.maxMarks,
      row.passMarks,
      row.submissions,
      row.graded,
      row.avgScorePct,
      row.passRatePct,
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => csvCell(cell)).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `marksheet-${chosen.length}-assessment${chosen.length === 1 ? "" : "s"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSelected([]);
    setNotice(`Exported ${chosen.length} assessment${chosen.length === 1 ? "" : "s"} to a CSV mark sheet.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments &amp; Certification"
        description="Every graded and upcoming paper, its question-level distribution, and the gates a batch must clear before a certificate is issued."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Demo dataset · {rows.length} assessments</span>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loadState === "loading"}
              aria-label="Refresh assessments"
            >
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-success" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting grading"
          value={String(counts.grading)}
          icon={ClipboardCheck}
          trend={`${counts.scheduled} scheduled ahead`}
          trendTone="neutral"
        />
        <StatCard
          label="Completed"
          value={String(counts.completed)}
          icon={FileText}
          trend={`${rows.length} assessments in the plan`}
          trendTone="neutral"
        />
        <StatCard
          label="Scripts submitted"
          value={String(counts.submissions)}
          icon={GraduationCap}
          trend="Across all live cohorts"
          trendTone="neutral"
        />
        <StatCard
          label="Mean pass rate"
          value={overallPassRate === null ? "—" : `${Math.round(overallPassRate)}%`}
          icon={Award}
          trend={
            overallPassRate === null
              ? "No graded paper yet"
              : `Pass mark is ~50% on every paper`
          }
          trendTone={overallPassRate !== null && overallPassRate >= 70 ? "up" : "down"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-base">Assessment register</CardTitle>
                <CardDescription>
                  Select papers to export a mark sheet, or open one to inspect its question set.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-52">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search paper or course"
                    aria-label="Search assessments"
                    className="h-9 pl-9"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(String(value) as TypeFilter)}
                >
                  <SelectTrigger size="sm" className="h-9 w-full sm:w-36" aria-label="Filter by type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "All" ? "All types" : item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={batchFilter}
                  onValueChange={(value) => setBatchFilter(String(value))}
                >
                  <SelectTrigger size="sm" className="h-9 w-full sm:w-52" aria-label="Filter by batch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-batches">All batches</SelectItem>
                    {batchCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadState === "error" ? (
              <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Could not load the assessment register
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      Grading data did not resolve. Check your connection and try again.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Try again
                </Button>
              </div>
            ) : loadState === "loading" ? (
              <div className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-4 rounded-[4px]" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="ml-auto h-4 w-24" />
                  </div>
                ))}
                <p className="pt-1 text-xs text-foreground/60">Loading assessment register…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                  {STATUS_FILTERS.map((item) => (
                    <Button
                      key={item}
                      variant={statusFilter === item ? "secondary" : "ghost"}
                      size="sm"
                      aria-pressed={statusFilter === item}
                      onClick={() => setStatusFilter(item)}
                    >
                      {item}
                      <span className="ml-1.5 font-mono text-xs">
                        {item === "All"
                          ? rows.length
                          : rows.filter((row) => row.status === item).length}
                      </span>
                    </Button>
                  ))}
                  {isFiltered && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>

                {selected.length > 0 && (
                  <div className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-foreground">
                      <span className="font-mono font-semibold">{selected.length}</span> assessment
                      {selected.length === 1 ? "" : "s"} selected
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={exportMarkSheet}>
                        <Download className="mr-1.5 size-4" />
                        Export mark sheet
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                        <X className="mr-1.5 size-4" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {visible.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
                    <span className="icon-tile-red size-10">
                      <Inbox className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isFiltered ? "No assessment matches this filter" : "No assessment scheduled"}
                      </p>
                      <p className="mx-auto mt-1 max-w-md text-sm text-foreground/70">
                        {isFiltered
                          ? "Try a different type, status, batch, or search term."
                          : "Once the assessment plan is published, papers appear here with their question set."}
                      </p>
                    </div>
                    {isFiltered && (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table className="min-w-[1000px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allVisibleSelected}
                              onCheckedChange={toggleAllVisible}
                              aria-label="Select all visible assessments"
                            />
                          </TableHead>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Scripts</TableHead>
                          <TableHead>Average</TableHead>
                          <TableHead>Pass rate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((row) => {
                          const overdue =
                            row.status !== "Completed" && row.dueDate < INSTITUTION_DEMO_TODAY;
                          return (
                            <TableRow key={row.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selected.includes(row.id)}
                                  onCheckedChange={(checked) => toggleSelected(row.id, checked)}
                                  aria-label={`Select ${row.title}`}
                                />
                              </TableCell>
                              <TableCell>
                                <p className="max-w-[280px] text-sm font-medium text-foreground">
                                  {row.title}
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-xs text-foreground/60">
                                  <Badge variant="secondary" className={TYPE_TONE[row.type]}>
                                    {row.type}
                                  </Badge>
                                  <span className="max-w-[150px] truncate">{row.course}</span>
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="font-mono text-xs text-foreground">{row.batchCode}</p>
                                <p className="mt-1 max-w-[180px] truncate text-xs text-foreground/60">
                                  {row.programme}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p
                                  className={cn(
                                    "font-mono text-xs",
                                    overdue ? "font-semibold text-destructive" : "text-foreground",
                                  )}
                                >
                                  {formatDate(row.dueDate)}
                                </p>
                                {overdue && (
                                  <p className="mt-1 text-xs text-destructive">Past due</p>
                                )}
                              </TableCell>
                              <TableCell>
                                <p className="font-mono text-sm text-foreground">
                                  {row.graded}/{row.submissions}
                                </p>
                                <p className="mt-1 text-xs text-foreground/60">graded</p>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-foreground">
                                {row.avgScorePct === null ? "—" : `${row.avgScorePct}%`}
                              </TableCell>
                              <TableCell>
                                <p
                                  className={cn(
                                    "font-mono text-sm",
                                    row.passRatePct === null
                                      ? "text-foreground/40"
                                      : row.passRatePct >= 75
                                        ? "text-success"
                                        : "text-warning",
                                  )}
                                >
                                  {row.passRatePct === null ? "—" : `${row.passRatePct}%`}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={STATUS_TONE[row.status]}>
                                  {row.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setOpenId(row.id)}
                                >
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Certification readiness</CardTitle>
            <CardDescription>
              Grading is only one gate. Pick a batch to see where it stands on all of them.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <Label htmlFor="readiness-batch">Batch</Label>
              <Select value={readinessBatch} onValueChange={(value) => setReadinessBatch(String(value))}>
                <SelectTrigger id="readiness-batch" size="sm" className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {institutionBatchesSeed.map((batch) => (
                    <SelectItem key={batch.code} value={batch.code}>
                      {batch.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className={cn(
                "rounded-lg border p-4",
                eligible ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5",
              )}
            >
              <div className="flex items-start gap-2">
                {eligible ? (
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
                ) : (
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {eligible
                      ? "Eligible for certificate of completion"
                      : `${pendingGates} gate${pendingGates === 1 ? "" : "s"} still outstanding`}
                  </p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {readinessBatchRow.programme} · {readinessBatchRow.enrolled} trainees ·{" "}
                    {readinessBatchRow.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {DERIVED_GATES.map((gate) => {
                const value = readiness[gate.key];
                const met = value !== null && value >= gate.min;
                return (
                  <div key={gate.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        {met ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <X className="size-3.5 text-destructive" />
                        )}
                        {gate.label}
                      </p>
                      <p className="font-mono text-xs text-foreground">
                        {value === null ? "—" : `${Math.round(value)}%`}
                        <span className="text-foreground/60"> / {gate.min}%</span>
                      </p>
                    </div>
                    <Progress value={value ?? 0} className="h-1.5" />
                    <p className="text-xs text-foreground/60">
                      {value === null
                        ? "Not enough sessions held to measure this yet."
                        : gate.rule}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-foreground">All certification gates</p>
              <ul className="flex flex-col gap-2.5">
                {certificationThresholds.map((threshold) => {
                  const gate = DERIVED_GATES.find((item) => item.label === threshold.label);
                  const value = gate ? readiness[gate.key] : null;
                  const met = gate ? value !== null && value >= gate.min : false;
                  return (
                    <li key={threshold.label} className="flex items-start gap-2">
                      {met ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                      ) : (
                        <X className="mt-0.5 size-3.5 shrink-0 text-foreground/40" />
                      )}
                      <div>
                        <p className="text-sm text-foreground">{threshold.label}</p>
                        <p className="text-xs text-foreground/60">{threshold.rule}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-foreground/60">
                Verification is a manual check by the institution office and is never inferred from
                this dataset.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpenId(null);
        }}
      >
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.title}</SheetTitle>
                <SheetDescription>
                  {open.programme} · {open.batchCode} · {formatDate(open.dueDate)}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-5 px-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={TYPE_TONE[open.type]}>
                    {open.type}
                  </Badge>
                  <Badge variant="secondary" className={STATUS_TONE[open.status]}>
                    {open.status}
                  </Badge>
                  <Badge variant="outline" className="text-foreground/70">
                    Pass at {open.passMarks}/{open.maxMarks}
                  </Badge>
                  <span className="font-mono text-xs text-foreground/60">
                    {open.graded}/{open.submissions} scripts graded
                  </span>
                </div>

                <dl className="grid grid-cols-3 gap-3">
                  <MetricCell
                    label="Average"
                    value={open.avgScorePct === null ? "—" : `${open.avgScorePct}%`}
                  />
                  <MetricCell
                    label="Pass rate"
                    value={open.passRatePct === null ? "—" : `${open.passRatePct}%`}
                  />
                  <MetricCell
                    label="Max marks"
                    value={String(open.maxMarks)}
                    mono
                  />
                </dl>

                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Score distribution</p>
                  {open.graded === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-foreground/70">
                      No script has been graded for this paper yet. Distribution appears once
                      marking starts.
                    </p>
                  ) : (
                    <HorizontalBarList
                      items={open.bands.map((band) => ({
                        label: `${band.band}%`,
                        value: band.count,
                      }))}
                      barColorClassName="bg-chart-2"
                      valueFormatter={(value) => `${value} script${value === 1 ? "" : "s"}`}
                    />
                  )}
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">
                    Question set ({open.questions.length})
                  </p>
                  <div className="flex flex-col gap-3">
                    {open.questions.map((question, index) => {
                      const key = `${open.id}:${question.id}`;
                      return (
                        <div key={question.id} className="rounded-lg border border-border p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <p className="text-sm text-foreground">
                              <span className="font-mono text-xs text-foreground/60">
                                Q{index + 1}
                              </span>{" "}
                              {question.label}
                            </p>
                            <p className="shrink-0 font-mono text-xs text-foreground/70">
                              {question.maxMarks} marks
                            </p>
                          </div>

                          {open.graded === 0 ? (
                            <p className="mt-2 text-xs text-foreground/60">
                              Awaiting grading — average and pass rate are not available.
                            </p>
                          ) : (
                            <div className="mt-2.5 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground/60">Average marks</span>
                                <span className="font-mono text-foreground">
                                  {question.avgMarks === null ? "—" : question.avgMarks} /{" "}
                                  {question.maxMarks}
                                </span>
                              </div>
                              <Progress
                                value={
                                  question.avgMarks === null
                                    ? 0
                                    : (question.avgMarks / question.maxMarks) * 100
                                }
                                className="h-1.5"
                              />
                              <p className="text-xs text-foreground/60">
                                {question.passRatePct === null
                                  ? "Pass rate not available"
                                  : `${question.passRatePct}% of scripts cleared half marks`}
                              </p>
                            </div>
                          )}

                          <div className="mt-3">
                            <Label
                              htmlFor={`comment-${question.id}`}
                              className="text-xs text-foreground/60"
                            >
                              Reviewer note
                            </Label>
                            <Textarea
                              id={`comment-${question.id}`}
                              value={comments[key] ?? ""}
                              onChange={(event) =>
                                setComments((prev) => ({
                                  ...prev,
                                  [key]: event.target.value,
                                }))
                              }
                              onBlur={() => saveComment(open.id, question.id)}
                              placeholder="Note a recurring misconception for the re-teach plan"
                              className="mt-1.5 min-h-16 text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground/70">
                  Prototype view. Reviewer notes and this sheet are held in browser memory for this
                  session only — nothing is written back to the grading service.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MetricCell({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-xs text-foreground/60">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-base font-semibold text-foreground",
          mono ? "font-mono" : "font-sans",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
