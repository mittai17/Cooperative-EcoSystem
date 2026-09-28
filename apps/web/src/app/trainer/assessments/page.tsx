"use client";

import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Download,
  FileCheck2,
  Filter,
  Loader2,
  Plus,
  Search,
  Target,
  TriangleAlert,
} from "lucide-react";
import { TrendBarChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  TRAINER_TODAY,
  assessmentTypes,
  assessments as seedAssessments,
  gradingQueue as seedQueue,
  trainerClasses,
  type AssessmentRecord,
  type AssessmentStatus,
  type AssessmentType,
  type GradingSubmission,
} from "@/lib/mock-data/trainer";

/* -------------------------------------------------------------------------- */
/* Grading model                                                               */
/* -------------------------------------------------------------------------- */

type RubricRating = "Exceeds" | "Meets" | "Needs work";

const rubricOptions: { value: RubricRating; weight: number; short: string }[] = [
  { value: "Exceeds", weight: 1, short: "Exceeds" },
  { value: "Meets", weight: 0.8, short: "Meets" },
  { value: "Needs work", weight: 0.5, short: "Needs work" },
];

interface GradeDraft {
  rubric: RubricRating[];
  score: string;
  feedback: string;
}

function emptyDraft(criteria: number): GradeDraft {
  return {
    rubric: Array.from({ length: criteria }, () => "Meets" as RubricRating),
    score: "",
    feedback: "",
  };
}

/** Marks implied by the rubric, used to seed the score box and to sanity check the trainer. */
function rubricScore(rubric: RubricRating[], maxMarks: number): number {
  if (rubric.length === 0) return 0;
  const total = rubric.reduce(
    (sum, rating) => sum + (rubricOptions.find((option) => option.value === rating)?.weight ?? 0),
    0,
  );
  return Math.round((total / rubric.length) * maxMarks);
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toCsvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function StatusBadge({ status }: { status: AssessmentStatus }) {
  if (status === "Published") {
    return (
      <Badge variant="secondary" className="bg-success/10 text-emerald-700">
        Published
      </Badge>
    );
  }
  if (status === "Draft") {
    return (
      <Badge variant="secondary" className="bg-tint-amber-bg text-amber-700">
        Draft
      </Badge>
    );
  }
  return <Badge variant="secondary">Closed</Badge>;
}

const typeTint: Record<AssessmentType, string> = {
  Quiz: "bg-tint-blue-bg text-primary",
  Practical: "bg-tint-violet-bg text-tint-violet-fg",
  Project: "bg-tint-green-bg text-tint-green-fg",
  Viva: "bg-tint-amber-bg text-amber-700",
};

export default function TrainerAssessmentsPage() {
  const [assessmentList, setAssessmentList] = useState<AssessmentRecord[]>(seedAssessments);
  const [queue, setQueue] = useState<GradingSubmission[]>(seedQueue);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(seedQueue[0]?.id ?? null);
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [gradedNotice, setGradedNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formClassId, setFormClassId] = useState(trainerClasses[0].id);
  const [formType, setFormType] = useState<AssessmentType>("Quiz");
  const [formDueDate, setFormDueDate] = useState("");
  const [formMaxMarks, setFormMaxMarks] = useState("20");
  const [formError, setFormError] = useState<string | null>(null);
  const created = useRef(0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assessmentList.filter((assessment) => {
      if (classFilter !== "all" && assessment.classId !== classFilter) return false;
      if (statusFilter !== "all" && assessment.status !== statusFilter) return false;
      if (typeFilter !== "all" && assessment.type !== typeFilter) return false;
      if (term && !`${assessment.title} ${assessment.classTitle}`.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [assessmentList, classFilter, search, statusFilter, typeFilter]);

  const selected = queue.find((item) => item.id === selectedId) ?? null;
  const selectedAssessment = selected
    ? (assessmentList.find((assessment) => assessment.id === selected.assessmentId) ?? null)
    : null;
  const selectedDraft = selected
    ? (drafts[selected.id] ?? emptyDraft(selectedAssessment?.rubricLabels.length ?? 0))
    : null;

  const activeCount = assessmentList.filter((item) => item.status === "Published").length;
  const gradedTotal = assessmentList.reduce((sum, item) => sum + item.gradedScores.length, 0);
  // Drafts have not been released to trainees yet, so they carry no backlog.
  const pendingTotal = assessmentList
    .filter((item) => item.status !== "Draft")
    .reduce((sum, item) => sum + Math.max(0, item.submissions - item.gradedScores.length), 0);
  const overdueCount = assessmentList.filter(
    (item) =>
      item.status !== "Draft" &&
      item.dueDate < TRAINER_TODAY &&
      item.gradedScores.length < item.submissions,
  ).length;
  const cohortAverage = useMemo(() => {
    const all = assessmentList.flatMap((item) => item.gradedScores);
    if (all.length === 0) return 0;
    const pct = assessmentList.flatMap((item) =>
      item.gradedScores.map((score) => (score / item.maxMarks) * 100),
    );
    return Math.round(pct.reduce((sum, value) => sum + value, 0) / Math.max(1, all.length));
  }, [assessmentList]);

  const distribution = useMemo(() => {
    const buckets = [
      { label: "0-39", min: 0, max: 39 },
      { label: "40-49", min: 40, max: 49 },
      { label: "50-59", min: 50, max: 59 },
      { label: "60-69", min: 60, max: 69 },
      { label: "70-79", min: 70, max: 79 },
      { label: "80-89", min: 80, max: 89 },
      { label: "90-100", min: 90, max: 100 },
    ];
    const pcts = assessmentList.flatMap((item) =>
      item.gradedScores.map((score) => (score / item.maxMarks) * 100),
    );
    return buckets.map((bucket) => ({
      label: bucket.label,
      trainees: pcts.filter((pct) => pct >= bucket.min && pct <= bucket.max).length,
    }));
  }, [assessmentList]);

  const classAverages = useMemo(
    () =>
      trainerClasses.map((cls) => {
        const pcts = assessmentList
          .filter((item) => item.classId === cls.id)
          .flatMap((item) => item.gradedScores.map((score) => (score / item.maxMarks) * 100));
        return {
          label: cls.batch.replace("Batch ", "B"),
          average: pcts.length
            ? Math.round(pcts.reduce((sum, value) => sum + value, 0) / pcts.length)
            : 0,
        };
      }),
    [assessmentList],
  );

  function setRating(submissionId: string, index: number, rating: RubricRating, maxMarks: number) {
    setDrafts((previous) => {
      const base = previous[submissionId] ?? emptyDraft(index + 1);
      const rubric = base.rubric.map((value, position) => (position === index ? rating : value));
      while (rubric.length <= index) rubric.push("Meets");
      return { ...previous, [submissionId]: { ...base, rubric, score: String(rubricScore(rubric, maxMarks)) } };
    });
  }

  function setDraftField(
    submissionId: string,
    field: "score" | "feedback",
    value: string,
    criteria: number,
  ) {
    setDrafts((previous) => ({
      ...previous,
      [submissionId]: { ...(previous[submissionId] ?? emptyDraft(criteria)), [field]: value },
    }));
  }

  function gradeSubmission() {
    if (!selected || !selectedAssessment || !selectedDraft) return;
    const parsed = Number(selectedDraft.score.trim());
    if (selectedDraft.score.trim() === "" || Number.isNaN(parsed)) {
      setScoreError("Enter a numeric score before grading.");
      return;
    }
    if (parsed < 0 || parsed > selectedAssessment.maxMarks) {
      setScoreError(`Score must sit between 0 and ${selectedAssessment.maxMarks} marks.`);
      return;
    }
    const next = queue.filter((item) => item.id !== selected.id);
    setQueue(next);
    setAssessmentList((previous) =>
      previous.map((assessment) =>
        assessment.id === selectedAssessment.id
          ? { ...assessment, gradedScores: [...assessment.gradedScores, Math.round(parsed)] }
          : assessment,
      ),
    );
    setGradedNotice(
      `${selected.traineeName} scored ${Math.round(parsed)}/${selectedAssessment.maxMarks} on ${selectedAssessment.title}. ${next.length} submission${next.length === 1 ? "" : "s"} left in the queue.`,
    );
    setScoreError(null);
    setSelectedId(next[0]?.id ?? null);
  }

  function exportCsv() {
    setExporting(true);
    const rows = [
      ["Assessment", "Class", "Type", "Status", "Due", "Max marks", "Submissions", "Graded", "Average %"],
      ...assessmentList.map((assessment) => {
        const graded = assessment.gradedScores;
        const avg = graded.length
          ? Math.round(
              (graded.reduce((sum, score) => sum + (score / assessment.maxMarks) * 100, 0) / graded.length) *
                10,
            ) / 10
          : 0;
        return [
          assessment.title,
          assessment.classTitle,
          assessment.type,
          assessment.status,
          assessment.dueDate,
          assessment.maxMarks,
          assessment.submissions,
          graded.length,
          avg,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "coopsetu-trainer-assessments.csv";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    window.setTimeout(() => setExporting(false), 400);
  }

  function createAssessment() {
    const title = formTitle.trim();
    const marks = Number(formMaxMarks);
    if (title.length < 5) {
      setFormError("Give the assessment a title of at least 5 characters.");
      return;
    }
    if (formDueDate === "" || Number.isNaN(Number(formDueDate.replace(/-/g, "")))) {
      setFormError("Pick a due date.");
      return;
    }
    if (formDueDate < TRAINER_TODAY) {
      setFormError(`Due date must be on or after ${formatDate(TRAINER_TODAY)}.`);
      return;
    }
    if (Number.isNaN(marks) || marks < 1 || marks > 100) {
      setFormError("Maximum marks must be a number between 1 and 100.");
      return;
    }
    const cls = trainerClasses.find((item) => item.id === formClassId) ?? trainerClasses[0];
    created.current += 1;
    const record: AssessmentRecord = {
      id: `asm-created-${created.current}`,
      title,
      classId: cls.id,
      classTitle: cls.title,
      type: formType,
      maxMarks: Math.round(marks),
      passMarks: Math.round(marks * 0.4),
      dueDate: formDueDate,
      status: "Draft",
      rubricLabels:
        formType === "Viva"
          ? ["Concept depth", "Local application", "Clarity"]
          : formType === "Quiz"
            ? ["Accuracy", "Reasoning", "Completeness"]
            : ["Method", "Execution", "Presentation"],
      submissions: cls.enrolled,
      gradedScores: [],
    };
    setAssessmentList((previous) => [record, ...previous]);
    setFormTitle("");
    setFormDueDate("");
    setFormMaxMarks("20");
    setFormError(null);
    setDialogOpen(false);
    setGradedNotice(`${record.title} is saved as a draft for ${cls.batch}. It is not visible to trainees yet.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments & grading"
        description="Publish theory and practical assessments, work through the grading queue with the rubric open, and export the marks sheet for NCCT submission."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Create assessment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active assessments"
          value={String(activeCount)}
          icon={ClipboardList}
          trend={`${assessmentList.length} total this term`}
          trendTone="neutral"
        />
        <StatCard
          label="Pending grading"
          value={String(pendingTotal)}
          icon={FileCheck2}
          trend={`${queue.length} in the open queue`}
          trendTone={pendingTotal > 0 ? "down" : "up"}
        />
        <StatCard
          label="Cohort average"
          value={`${cohortAverage}%`}
          icon={Target}
          trend={`${gradedTotal} submissions graded`}
          trendTone="up"
        />
        <StatCard
          label="Overdue assessments"
          value={String(overdueCount)}
          icon={TriangleAlert}
          trend={overdueCount > 0 ? "Past due and not fully graded" : "Nothing past due"}
          trendTone={overdueCount > 0 ? "down" : "up"}
        />
      </div>

      {gradedNotice && (
        <Alert>
          <CheckCircle2 className="text-emerald-700" />
          <AlertTitle>Marks recorded</AlertTitle>
          <AlertDescription>{gradedNotice}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <BarChart3 className="size-4 text-primary" />
              Score distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Every graded submission as a percentage of its own maximum marks.
            </p>
          </CardHeader>
          <CardContent className="h-72">
            <TrendBarChart
              data={distribution}
              xKey="label"
              height={240}
              series={[{ key: "trainees", label: "Submissions", color: "var(--primary)" }]}
            />
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <BarChart3 className="size-4 text-primary" />
              Average by batch
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Recomputed as you grade, so a new mark moves the bar immediately.
            </p>
          </CardHeader>
          <CardContent className="h-72">
            <TrendBarChart
              data={classAverages}
              xKey="label"
              height={240}
              series={[{ key: "average", label: "Average %", color: "var(--chart-2)" }]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-heading text-base">Assessment register</CardTitle>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative lg:max-w-64 lg:flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assessments"
                aria-label="Search assessments"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={classFilter} onValueChange={(value) => value && setClassFilter(value)}>
                <SelectTrigger className="w-full sm:w-56" aria-label="Filter by class">
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
              <Select value={typeFilter} onValueChange={(value) => value && setTypeFilter(value)}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Filter by type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {assessmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportCsv} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 size-4" />
                )}
                Export CSV
              </Button>
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
                <Filter className="size-5" />
              </span>
              <p className="font-heading text-sm font-semibold text-foreground">No assessment matches</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Nothing here for the current search, class, type and status combination. Clear the
                filters or create a new assessment for this cohort.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setClassFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((assessment) => {
                const graded = assessment.gradedScores.length;
                const avgPct = graded
                  ? Math.round(
                      assessment.gradedScores.reduce(
                        (sum, score) => sum + (score / assessment.maxMarks) * 100,
                        0,
                      ) / graded,
                    )
                  : 0;
                const awaiting = Math.max(0, assessment.submissions - graded);
                return (
                  <article
                    key={assessment.id}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-heading text-sm font-semibold text-foreground">
                          {assessment.title}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {assessment.classTitle}
                        </p>
                      </div>
                      <StatusBadge status={assessment.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={typeTint[assessment.type]}>
                        {assessment.type}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {assessment.maxMarks} marks
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        due {formatDate(assessment.dueDate)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {graded}/{assessment.submissions} graded
                        </span>
                        <span className="font-mono text-foreground">
                          avg {graded ? `${avgPct}%` : "n/a"}
                        </span>
                      </div>
                      <Progress
                        value={(graded / assessment.submissions) * 100}
                        className="[&_[data-slot=progress-indicator]]:bg-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {awaiting > 0
                        ? `${awaiting} submission${awaiting === 1 ? "" : "s"} waiting for marks`
                        : "All submissions graded"}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-heading text-base">Grading queue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a submission to open its rubric, then record marks and feedback.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <span className="icon-tile-red size-11">
                <CheckCircle2 className="size-5" />
              </span>
              <p className="font-heading text-sm font-semibold text-foreground">Queue cleared</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Every uploaded submission has marks against it. New uploads will appear here as soon
                as the FastAPI submission endpoint is connected.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {queue.map((submission) => {
                const assessment = assessmentList.find((item) => item.id === submission.assessmentId);
                const open = submission.id === selectedId;
                return (
                  <li key={submission.id} className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(submission.id);
                        setScoreError(null);
                      }}
                      aria-expanded={open}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors sm:flex-row sm:items-center sm:justify-between",
                        open ? "bg-primary/5" : "hover:bg-muted/50",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {submission.traineeName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {assessment?.title ?? "Unknown assessment"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {submission.submittedAt}
                        </span>
                        {assessment && <Badge variant="secondary">{assessment.type}</Badge>}
                      </div>
                    </button>

                    {open && assessment && selectedDraft && (
                      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
                        <div>
                          <p className="font-heading text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Rubric
                          </p>
                          <ul className="mt-2 flex flex-col gap-2">
                            {assessment.rubricLabels.map((label, index) => (
                              <li
                                key={label}
                                className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <span className="text-sm text-foreground">{label}</span>
                                <div
                                  className="flex gap-1"
                                  role="group"
                                  aria-label={`${label} rating`}
                                >
                                  {rubricOptions.map((option) => {
                                    const active = selectedDraft.rubric[index] === option.value;
                                    return (
                                      <Button
                                        key={option.value}
                                        size="xs"
                                        variant="outline"
                                        aria-pressed={active}
                                        onClick={() =>
                                          setRating(
                                            submission.id,
                                            index,
                                            option.value,
                                            assessment.maxMarks,
                                          )
                                        }
                                        className={cn(
                                          active && "border-primary bg-primary/10 text-primary",
                                          !active && "text-muted-foreground",
                                        )}
                                      >
                                        {option.short}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Rubric suggests{" "}
                            <span className="font-mono text-foreground">
                              {rubricScore(selectedDraft.rubric, assessment.maxMarks)}/
                              {assessment.maxMarks}
                            </span>
                            . Adjust the score below if the submission deserves it.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="flex flex-col gap-1.5 sm:w-40">
                            <Label htmlFor={`score-${submission.id}`}>Score (out of {assessment.maxMarks})</Label>
                            <Input
                              id={`score-${submission.id}`}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={assessment.maxMarks}
                              value={selectedDraft.score}
                              onChange={(event) => {
                                setScoreError(null);
                                setDraftField(
                                  submission.id,
                                  "score",
                                  event.target.value,
                                  assessment.rubricLabels.length,
                                );
                              }}
                              placeholder={String(rubricScore(selectedDraft.rubric, assessment.maxMarks))}
                              aria-invalid={scoreError !== null}
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-1.5">
                            <Label htmlFor={`feedback-${submission.id}`}>Feedback for the trainee</Label>
                            <Textarea
                              id={`feedback-${submission.id}`}
                              rows={2}
                              value={selectedDraft.feedback}
                              onChange={(event) =>
                                setDraftField(
                                  submission.id,
                                  "feedback",
                                  event.target.value,
                                  assessment.rubricLabels.length,
                                )
                              }
                              placeholder="What was strong, and what to rework before the next assessment"
                            />
                          </div>
                        </div>

                        {scoreError && (
                          <p className="text-sm text-red-700" role="alert">
                            {scoreError}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <Button onClick={gradeSubmission}>
                            <CheckCircle2 className="mr-1.5 size-4" />
                            Record grade
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedId(queue.find((item) => item.id !== submission.id)?.id ?? null)}
                          >
                            Skip to next
                          </Button>
                          <span className="ml-auto font-mono text-xs text-muted-foreground">
                            pass mark {assessment.passMarks}/{assessment.maxMarks}
                          </span>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            <span className="demo-data-tag mr-1">Simulated submissions</span>
            Uploads, rubrics and marks live in CoopSetu demo data. Nothing is written to the NCCT
            registry until the FastAPI assessment service is connected.
          </p>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create assessment</DialogTitle>
            <DialogDescription>
              New assessments start as drafts. Publish them from the register once the rubric looks
              right.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assessment-title">Title</Label>
              <Input
                id="assessment-title"
                value={formTitle}
                onChange={(event) => {
                  setFormTitle(event.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. Bylaw amendment drafting exercise"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assessment-class">Class</Label>
                <Select value={formClassId} onValueChange={(value) => value && setFormClassId(value)}>
                  <SelectTrigger id="assessment-class" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {trainerClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.batch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assessment-type">Type</Label>
                <Select
                  value={formType}
                  onValueChange={(value) => value && setFormType(value as AssessmentType)}
                >
                  <SelectTrigger id="assessment-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assessment-due">Due date</Label>
                <Input
                  id="assessment-due"
                  type="date"
                  value={formDueDate}
                  min={TRAINER_TODAY}
                  onChange={(event) => {
                    setFormDueDate(event.target.value);
                    setFormError(null);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assessment-marks">Maximum marks</Label>
                <Input
                  id="assessment-marks"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={formMaxMarks}
                  onChange={(event) => {
                    setFormMaxMarks(event.target.value);
                    setFormError(null);
                  }}
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={createAssessment}>
              <Plus className="mr-1.5 size-4" />
              Save draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
