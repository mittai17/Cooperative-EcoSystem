"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  CircleAlert,
  GraduationCap,
  Inbox,
  Layers,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INSTITUTION_DEMO_TODAY,
  institutionBatchesSeed,
  institutionProgrammes,
  type Batch,
  type BatchStatus,
  type ProgrammeCode,
} from "@/lib/mock-data/institution";

type LoadState = "loading" | "ready" | "error";
type StatusFilter = BatchStatus | "All";
type ModeFilter = Batch["mode"] | "All";

const STATUS_FILTERS: StatusFilter[] = ["All", "Running", "Upcoming", "Completed"];
const MODE_FILTERS: ModeFilter[] = ["All", "In-person", "Blended", "Online"];

const STATUS_TONE: Record<BatchStatus, string> = {
  Running: "bg-success/10 text-success",
  Upcoming: "bg-primary/10 text-primary",
  Completed: "bg-secondary text-secondary-foreground",
};

const BATCH_CODE_PATTERN = /^IRMA\/[A-Z]{3}\/\d{4}-B\d$/;

async function loadBatches(): Promise<Batch[]> {
  return institutionBatchesSeed.map((row) => ({ ...row }));
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface BatchFormState {
  code: string;
  programmeCode: ProgrammeCode | "";
  trainer: string;
  schedule: string;
  venue: string;
  mode: Batch["mode"];
  seats: string;
  enrolled: string;
  startDate: string;
  endDate: string;
}

interface BatchFormErrors {
  code?: string;
  programme?: string;
  trainer?: string;
  seats?: string;
  enrolled?: string;
  dates?: string;
}

const EMPTY_FORM: BatchFormState = {
  code: "",
  programmeCode: "",
  trainer: "",
  schedule: "",
  venue: "",
  mode: "In-person",
  seats: "40",
  enrolled: "0",
  startDate: "",
  endDate: "",
};

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>(() =>
    institutionBatchesSeed.map((row) => ({ ...row })),
  );
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [mode, setMode] = useState<ModeFilter>("All");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BatchFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<BatchFormErrors>({});
  const [created, setCreated] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return batches.filter((row) => {
      if (status !== "All" && row.status !== status) return false;
      if (mode !== "All" && row.mode !== mode) return false;
      if (!needle) return true;
      return (
        row.code.toLowerCase().includes(needle) ||
        row.programme.toLowerCase().includes(needle) ||
        row.trainer.toLowerCase().includes(needle) ||
        row.venue.toLowerCase().includes(needle)
      );
    });
  }, [batches, status, mode, query]);

  const running = batches.filter((row) => row.status === "Running");
  const totalSeats = batches.reduce((sum, row) => sum + row.seats, 0);
  const totalEnrolled = batches.reduce((sum, row) => sum + row.enrolled, 0);
  const attendanceValues = batches
    .map((row) => row.avgAttendance)
    .filter((value): value is number => value !== null);
  const scoreValues = batches
    .map((row) => row.avgScore)
    .filter((value): value is number => value !== null);
  const avgAttendance = attendanceValues.length
    ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
    : 0;
  const avgScore = scoreValues.length
    ? Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length)
    : 0;

  const fillByProgramme = useMemo(
    () =>
      institutionProgrammes.map((item) => {
        const seats = batches
          .filter((row) => row.programmeCode === item.code)
          .reduce((sum, row) => sum + row.seats, 0);
        const enrolled = batches
          .filter((row) => row.programmeCode === item.code)
          .reduce((sum, row) => sum + row.enrolled, 0);
        return {
          label: `${item.code} · ${item.title}`,
          value: seats === 0 ? 0 : Math.round((enrolled / seats) * 100),
        };
      }),
    [batches],
  );

  const overCapacity = batches.filter((row) => row.enrolled > row.seats);
  const isFiltered = status !== "All" || mode !== "All" || query.trim() !== "";

  function clearFilters() {
    setStatus("All");
    setMode("All");
    setQuery("");
  }

  async function refresh() {
    setLoadState("loading");
    try {
      setBatches(await loadBatches());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  function updateField<Key extends keyof BatchFormState>(key: Key, value: BatchFormState[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): BatchFormErrors {
    const next: BatchFormErrors = {};
    const code = form.code.trim().toUpperCase();
    if (!code) next.code = "Batch code is required.";
    else if (!BATCH_CODE_PATTERN.test(code))
      next.code = "Use the pattern IRMA/CMF/2026-B1.";
    else if (batches.some((row) => row.code.toUpperCase() === code))
      next.code = "A batch with this code already exists.";

    if (!form.programmeCode) next.programme = "Select the programme this batch runs.";
    if (!form.trainer.trim()) next.trainer = "Assign a trainer or faculty member.";

    const seats = Number(form.seats);
    if (!Number.isInteger(seats) || seats < 1) next.seats = "Seats must be a whole number above 0.";

    const enrolled = Number(form.enrolled);
    if (!Number.isInteger(enrolled) || enrolled < 0)
      next.enrolled = "Enrolled must be 0 or a positive whole number.";
    else if (Number.isInteger(seats) && enrolled > seats)
      next.enrolled = "Enrolled cannot be more than the sanctioned seats.";

    if (!form.startDate) next.dates = "Start date is required.";
    else if (!form.endDate) next.dates = "End date is required.";
    else if (form.endDate <= form.startDate)
      next.dates = "End date must fall after the start date.";

    return next;
  }

  function submitBatch() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const programme = institutionProgrammes.find((item) => item.code === form.programmeCode);
    if (!programme) return;

    const batch: Batch = {
      id: `bat-${form.code.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      code: form.code.trim().toUpperCase(),
      programme: programme.title,
      programmeCode: programme.code,
      trainer: form.trainer.trim(),
      schedule: form.schedule.trim() || "Schedule to be announced",
      venue: form.venue.trim() || "Venue to be allotted",
      mode: form.mode,
      seats: Number(form.seats),
      enrolled: Number(form.enrolled),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.startDate > INSTITUTION_DEMO_TODAY ? "Upcoming" : "Running",
      avgAttendance: null,
      avgScore: null,
    };

    setBatches((prev) => [batch, ...prev]);
    setCreated(batch.code);
    setForm(EMPTY_FORM);
    setErrors({});
    setStatus("All");
    setMode("All");
    setQuery("");
    setDialogOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Batch Management"
        description="Run every cohort your institution delivers: trainer assignment, schedule, seat capacity and roster outcomes."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Demo dataset · {batches.length} batches</span>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loadState === "loading"}
              aria-label="Refresh batch register"
            >
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create batch
            </Button>
          </div>
        }
      />

      {created && (
        <Alert>
          <CircleAlert className="size-4" />
          <AlertTitle>Batch created</AlertTitle>
          <AlertDescription>
            <span className="font-mono font-medium text-foreground">{created}</span> was added to the
            register. Session planning and the trainee roster stay empty until you schedule the
            first session.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Running batches"
          value={String(running.length)}
          icon={Layers}
          trend={`${batches.length - running.length} more scheduled or closed`}
          trendTone="neutral"
        />
        <StatCard
          label="Trainees enrolled"
          value={totalEnrolled.toLocaleString("en-IN")}
          icon={Users}
          trend={`of ${totalSeats.toLocaleString("en-IN")} sanctioned seats`}
          trendTone="neutral"
        />
        <StatCard
          label="Average attendance"
          value={`${avgAttendance}%`}
          icon={Percent}
          trend="Across batches that have started"
          trendTone="up"
        />
        <StatCard
          label="Average assessment score"
          value={`${avgScore}%`}
          icon={Award}
          trend="Mean of graded assessments per batch"
          trendTone="up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Seat capacity</CardTitle>
            <CardDescription>
              Sanctioned seats against enrolments across every batch on record.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-foreground">Overall utilisation</p>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {totalSeats === 0 ? 0 : Math.round((totalEnrolled / totalSeats) * 100)}%
                </p>
              </div>
              <Progress
                value={totalSeats === 0 ? 0 : (totalEnrolled / totalSeats) * 100}
                className="mt-2"
              />
              <p className="mt-2 text-xs text-foreground/60">
                {totalEnrolled.toLocaleString("en-IN")} of{" "}
                {totalSeats.toLocaleString("en-IN")} seats filled ·{" "}
                {(totalSeats - totalEnrolled).toLocaleString("en-IN")} still open
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-foreground">Fill rate by programme</p>
              <HorizontalBarList
                items={fillByProgramme}
                max={100}
                barColorClassName="bg-chart-1"
                valueFormatter={(value) => `${value}% full`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-base">Batch register</CardTitle>
                <CardDescription>
                  Capacity, schedule and window for each cohort you deliver.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-52">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search code, trainer, venue"
                    aria-label="Search batches"
                    className="h-9 pl-9"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(String(value) as StatusFilter)}
                >
                  <SelectTrigger size="sm" className="h-9 w-full sm:w-36" aria-label="Filter by status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "All" ? "All statuses" : item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={mode}
                  onValueChange={(value) => setMode(String(value) as ModeFilter)}
                >
                  <SelectTrigger size="sm" className="h-9 w-full sm:w-36" aria-label="Filter by mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_FILTERS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "All" ? "All modes" : item}
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
                    <p className="text-sm font-medium text-foreground">Could not load batches</p>
                    <p className="mt-1 text-sm text-foreground/70">
                      The register did not resolve. Check your connection and try again.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Try again
                </Button>
              </div>
            ) : loadState === "loading" ? (
              <div className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="ml-auto h-4 w-24" />
                  </div>
                ))}
                <p className="pt-1 text-xs text-foreground/60">Loading batch register…</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
                <span className="icon-tile-red size-10">
                  <Inbox className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isFiltered ? "No batches match this filter" : "No batches on record yet"}
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-foreground/70">
                    {isFiltered
                      ? "Try a different status, mode, or search term to widen the register."
                      : "Create your first batch to start enrolling approved nominations."}
                  </p>
                </div>
                {isFiltered ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-1.5 size-3.5" />
                    Create batch
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch code</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Trainer &amp; schedule</TableHead>
                      <TableHead className="w-48">Seats filled</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((row) => {
                      const fill = row.seats === 0 ? 0 : Math.round((row.enrolled / row.seats) * 100);
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <p className="font-mono text-xs font-semibold text-foreground">
                              {row.code}
                            </p>
                            <p className="text-xs text-foreground/60">{row.mode}</p>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-[220px] truncate font-medium text-foreground">
                              {row.programme}
                            </p>
                            <p className="max-w-[220px] truncate text-xs text-foreground/60">
                              {row.venue}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-foreground">{row.trainer}</p>
                            <p className="max-w-[220px] truncate text-xs text-foreground/60">
                              {row.schedule}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-mono text-xs font-semibold text-foreground">
                                {row.enrolled}/{row.seats}
                              </span>
                              <span className="font-mono text-xs text-foreground/60">{fill}%</span>
                            </div>
                            <Progress value={fill} className="mt-1.5" />
                          </TableCell>
                          <TableCell>
                            <p className="font-mono text-xs text-foreground">
                              {formatDate(row.startDate)}
                            </p>
                            <p className="font-mono text-xs text-foreground/60">
                              to {formatDate(row.endDate)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={STATUS_TONE[row.status]}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Roster summary</CardTitle>
          <CardDescription>
            Rolling figures for every batch with recorded sessions. Upcoming batches are excluded
            until their first session is marked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <RosterMetric
              icon={Users}
              label="Trainees on rosters"
              value={totalEnrolled.toLocaleString("en-IN")}
              hint={`Across ${batches.length} batches`}
            />
            <RosterMetric
              icon={GraduationCap}
              label="Cohorts with a live roster"
              value={String(batches.filter((row) => row.enrolled > 0).length)}
              hint={`${batches.filter((row) => row.enrolled === 0).length} awaiting first enrolment`}
            />
            <RosterMetric
              icon={Percent}
              label="Average attendance"
              value={`${avgAttendance}%`}
              hint="Across batches that have started"
            />
            <RosterMetric
              icon={Award}
              label="Average assessment score"
              value={`${avgScore}%`}
              hint="Graded assessments only"
            />
          </dl>
          {overCapacity.length > 0 && (
            <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-foreground">
              {overCapacity.length} batch{overCapacity.length === 1 ? "" : "es"} show enrolments above
              sanctioned seats:{" "}
              <span className="font-mono font-medium">{overCapacity.map((row) => row.code).join(", ")}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create batch</DialogTitle>
            <DialogDescription>
              Batch codes follow the institute pattern IRMA/PROG/YEAR-BN. Seats must be at least the
              number of trainees already enrolled.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submitBatch();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="batch-code">Batch code</Label>
                <Input
                  id="batch-code"
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value.toUpperCase())}
                  placeholder="IRMA/CMF/2026-B3"
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={errors.code ? "batch-code-error" : undefined}
                  className="mt-1.5 font-mono"
                />
                <FieldError id="batch-code-error" message={errors.code} />
              </div>
              <div>
                <Label htmlFor="batch-programme">Programme</Label>
                <Select
                  value={form.programmeCode || null}
                  onValueChange={(value) => updateField("programmeCode", String(value) as ProgrammeCode)}
                >
                  <SelectTrigger
                    id="batch-programme"
                    size="sm"
                    className="mt-1.5 w-full"
                    aria-label="Programme for this batch"
                    aria-invalid={Boolean(errors.programme)}
                  >
                    <SelectValue placeholder="Select a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionProgrammes.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="batch-programme-error" message={errors.programme} />
              </div>
            </div>

            <div>
              <Label htmlFor="batch-trainer">Trainer</Label>
              <Input
                id="batch-trainer"
                value={form.trainer}
                onChange={(event) => updateField("trainer", event.target.value)}
                placeholder="Dr. Rajesh Sharma"
                aria-invalid={Boolean(errors.trainer)}
                aria-describedby={errors.trainer ? "batch-trainer-error" : undefined}
                className="mt-1.5"
              />
              <FieldError id="batch-trainer-error" message={errors.trainer} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="batch-seats">Sanctioned seats</Label>
                <Input
                  id="batch-seats"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.seats}
                  onChange={(event) => updateField("seats", event.target.value)}
                  aria-invalid={Boolean(errors.seats)}
                  aria-describedby={errors.seats ? "batch-seats-error" : undefined}
                  className="mt-1.5 font-mono"
                />
                <FieldError id="batch-seats-error" message={errors.seats} />
              </div>
              <div>
                <Label htmlFor="batch-enrolled">Trainees enrolled</Label>
                <Input
                  id="batch-enrolled"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.enrolled}
                  onChange={(event) => updateField("enrolled", event.target.value)}
                  aria-invalid={Boolean(errors.enrolled)}
                  aria-describedby={errors.enrolled ? "batch-enrolled-error" : undefined}
                  className="mt-1.5 font-mono"
                />
                <FieldError id="batch-enrolled-error" message={errors.enrolled} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="batch-start">Start date</Label>
                <Input
                  id="batch-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => updateField("startDate", event.target.value)}
                  aria-invalid={Boolean(errors.dates)}
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="batch-end">End date</Label>
                <Input
                  id="batch-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => updateField("endDate", event.target.value)}
                  aria-invalid={Boolean(errors.dates)}
                  className="mt-1.5 font-mono"
                />
              </div>
            </div>
            <FieldError id="batch-dates-error" message={errors.dates} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="batch-schedule">Schedule</Label>
                <Input
                  id="batch-schedule"
                  value={form.schedule}
                  onChange={(event) => updateField("schedule", event.target.value)}
                  placeholder="Mon, Wed, Fri · 10:00 AM – 01:00 PM"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="batch-venue">Venue</Label>
                <Input
                  id="batch-venue"
                  value={form.venue}
                  onChange={(event) => updateField("venue", event.target.value)}
                  placeholder="Hall A, IRMA Campus"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="batch-mode">Delivery mode</Label>
              <Select
                value={form.mode}
                onValueChange={(value) => updateField("mode", String(value) as Batch["mode"])}
              >
                <SelectTrigger id="batch-mode" size="sm" className="mt-1.5 w-full" aria-label="Delivery mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_FILTERS.filter((item): item is Batch["mode"] => item !== "All").map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Plus className="mr-1.5 size-4" />
                Create batch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RosterMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <dt className="text-sm text-foreground/70">{label}</dt>
      </div>
      <dd className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </dd>
      <dd className="mt-1 text-xs text-foreground/60">{hint}</dd>
    </div>
  );
}
