"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Copy,
  Eye,
  MoreHorizontal,
  Pause,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createEmployerJob,
  closeEmployerJob,
  getEmployerJob,
  JOB_STATUS_LABEL,
  listEmployerJobs,
  pauseEmployerJob,
  publishEmployerJob,
  setJobRequirements,
  toEmploymentType,
  type EmployerJob,
  type JobStatus,
} from "@/lib/employer/jobs-api";
import { ConfirmDialog } from "./confirm-dialog";
import { JobStatusChip } from "./job-status-chip";
import { formatDate, formatRelativeDays } from "./format";

export interface JobListFilterState {
  q: string;
  status: JobStatus | "all";
  department: string;
  location: string;
  employmentType: string;
  postedWithin: string;
}

export const EMPTY_JOB_FILTERS: JobListFilterState = {
  q: "",
  status: "all",
  department: "all",
  location: "all",
  employmentType: "all",
  postedWithin: "any",
};

const POSTED_WINDOWS: { label: string; value: string; days: number | null }[] = [
  { label: "Any time", value: "any", days: null },
  { label: "Last 7 days", value: "7", days: 7 },
  { label: "Last 30 days", value: "30", days: 30 },
  { label: "Last 90 days", value: "90", days: 90 },
];

/** Pure filter used by the list; exported so the rules are easy to reason about and test. */
export function filterEmployerJobs(
  jobs: EmployerJob[],
  filters: JobListFilterState,
  now: Date = new Date(),
): EmployerJob[] {
  const query = filters.q.trim().toLowerCase();
  const postedDays = POSTED_WINDOWS.find((w) => w.value === filters.postedWithin)?.days ?? null;
  return jobs.filter((job) => {
    if (query) {
      const haystack = `${job.title} ${job.department ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.status !== "all" && job.status !== filters.status) return false;
    if (filters.department !== "all" && job.department !== filters.department) return false;
    if (filters.location !== "all" && job.location !== filters.location) return false;
    if (filters.employmentType !== "all" && job.employment_type !== filters.employmentType) return false;
    if (postedDays !== null) {
      if (!job.posted_at) return false;
      const posted = new Date(job.posted_at).getTime();
      if (Number.isNaN(posted) || now.getTime() - posted > postedDays * 86_400_000) return false;
    }
    return true;
  });
}

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b));
}

type PendingAction = { job: EmployerJob; action: "pause" | "close" } | null;

export function JobsListView() {
  const router = useRouter();
  const [jobs, setJobs] = useState<EmployerJob[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobListFilterState>(EMPTY_JOB_FILTERS);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setJobs(await listEmployerJobs());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load job postings.");
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const departments = useMemo(() => uniqueSorted((jobs ?? []).map((j) => j.department)), [jobs]);
  const locations = useMemo(() => uniqueSorted((jobs ?? []).map((j) => j.location)), [jobs]);
  const employmentTypes = useMemo(() => uniqueSorted((jobs ?? []).map((j) => j.employment_type)), [jobs]);
  const visible = useMemo(() => (jobs ? filterEmployerJobs(jobs, filters) : []), [jobs, filters]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_JOB_FILTERS);

  function patchFilters(next: Partial<JobListFilterState>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  async function runStatusAction(job: EmployerJob, action: "pause" | "close") {
    setActionError(null);
    setNotice(null);
    setBusyId(job.id);
    try {
      if (action === "pause") await pauseEmployerJob(job.id);
      else await closeEmployerJob(job.id);
      setNotice(`"${job.title}" is now ${action === "pause" ? "paused" : "closed"}.`);
      await load();
    } catch (err) {
      // Rethrow so the confirm dialog stays open and shows the failure.
      throw err instanceof Error ? err : new Error("Could not update the job status.");
    } finally {
      setBusyId(null);
    }
  }

  async function resumeJob(job: EmployerJob) {
    setActionError(null);
    setNotice(null);
    setBusyId(job.id);
    try {
      await publishEmployerJob(job.id);
      setNotice(`"${job.title}" is active again.`);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not resume the job.");
    } finally {
      setBusyId(null);
    }
  }

  async function duplicateJob(job: EmployerJob) {
    setActionError(null);
    setNotice(null);
    setBusyId(job.id);
    try {
      const detail = await getEmployerJob(job.id);
      const created = await createEmployerJob({
        title: `${detail.title} (copy)`,
        sector: detail.sector ?? "Cooperative",
        department: detail.department ?? "",
        location: detail.location ?? "",
        employment_type: toEmploymentType(detail.employment_type),
        salary_min: detail.salary_min,
        salary_max: detail.salary_max,
        experience_required: detail.experience_required ?? "",
        education: detail.education,
        description: detail.description ?? "",
        responsibilities: detail.responsibilities,
        certifications: detail.certifications,
        languages: detail.languages,
        deadline: null,
        openings: detail.openings ?? 1,
        status: "draft",
      });
      if (detail.requirements.length > 0) {
        await setJobRequirements(created.id, detail.requirements);
      }
      router.push(`/employer/jobs/${created.id}/edit`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not duplicate the job.");
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jobs Management"
        description="Create, publish and manage job postings. Each posting's requirements feed the AI matching engine."
        action={
          <Button render={<Link href="/employer/jobs/new" />}>
              <Plus className="size-4" /> Create New Job
            </Button>
        }
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not load job postings</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{loadError}</span>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <p className="rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-sm text-success" role="status">
          {notice}
        </p>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => patchFilters({ q: e.target.value })}
              placeholder="Search jobs by title or department"
              aria-label="Search jobs"
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => patchFilters({ status: v as JobStatus | "all" })}
              options={[
                { label: "All statuses", value: "all" },
                ...(["draft", "open", "paused", "closed"] as JobStatus[]).map((s) => ({
                  label: JOB_STATUS_LABEL[s],
                  value: s,
                })),
              ]}
            />
            <FilterSelect
              label="Department"
              value={filters.department}
              onChange={(v) => patchFilters({ department: v })}
              options={[{ label: "All departments", value: "all" }, ...departments.map((d) => ({ label: d, value: d }))]}
            />
            <FilterSelect
              label="Location"
              value={filters.location}
              onChange={(v) => patchFilters({ location: v })}
              options={[{ label: "All locations", value: "all" }, ...locations.map((l) => ({ label: l, value: l }))]}
            />
            <FilterSelect
              label="Employment type"
              value={filters.employmentType}
              onChange={(v) => patchFilters({ employmentType: v })}
              options={[
                { label: "All types", value: "all" },
                ...employmentTypes.map((t) => ({ label: t, value: t })),
              ]}
            />
            <FilterSelect
              label="Posted"
              value={filters.postedWithin}
              onChange={(v) => patchFilters({ postedWithin: v })}
              options={POSTED_WINDOWS.map((w) => ({ label: w.label, value: w.value }))}
            />
          </div>
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_JOB_FILTERS)}>
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {jobs === null ? (
            <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading job postings">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            loadError ? null : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-12 text-center">
                <p className="text-sm font-medium text-foreground">No job postings yet</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Create your first posting. Trainees with matching verified skills will see it in their matches.
                </p>
                <Button size="sm" render={<Link href="/employer/jobs/new" />}>
                    <Plus className="size-4" /> Create New Job
                  </Button>
              </div>
            )
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No jobs match these filters</p>
              <Button size="sm" variant="outline" onClick={() => setFilters(EMPTY_JOB_FILTERS)}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Match Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-foreground">
                        <Link href={`/employer/jobs/${job.id}`} className="hover:text-primary hover:underline">
                          {job.title}
                        </Link>
                      </TableCell>
                      <TableCell>{job.department ?? "—"}</TableCell>
                      <TableCell>{job.location ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{job.applications_count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {job.match_rate === null ? "—" : `${job.match_rate}%`}
                      </TableCell>
                      <TableCell>
                        <JobStatusChip status={job.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap" title={formatDate(job.posted_at)}>
                        {formatRelativeDays(job.posted_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" render={<Link href={`/employer/jobs/${job.id}`} />}>
                              <Eye className="size-4" /> View
                            </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={busyId === job.id}
                              render={
                                <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${job.title}`}>
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem render={<Link href={`/employer/jobs/${job.id}/edit`} />}>
                                <Pencil className="size-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void duplicateJob(job)}>
                                <Copy className="size-3.5" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {job.status === "open" && (
                                <DropdownMenuItem onClick={() => setPending({ job, action: "pause" })}>
                                  <Pause className="size-3.5" /> Pause
                                </DropdownMenuItem>
                              )}
                              {job.status === "paused" && (
                                <DropdownMenuItem onClick={() => void resumeJob(job)}>
                                  <RotateCcw className="size-3.5" /> Resume
                                </DropdownMenuItem>
                              )}
                              {(job.status === "open" || job.status === "paused") && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setPending({ job, action: "close" })}
                                >
                                  <XCircle className="size-3.5" /> Close
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.action === "pause" ? "Pause this job?" : "Close this job?"}
        description={
          pending?.action === "pause"
            ? `"${pending.job.title}" will stop accepting new applications until you resume it.`
            : `"${pending?.job.title ?? ""}" will be closed. Existing applications are kept, but no new ones can be added.`
        }
        confirmLabel={pending?.action === "pause" ? "Pause job" : "Close job"}
        destructive={pending?.action === "close"}
        onConfirm={async () => {
          if (pending) await runStatusAction(pending.job, pending.action);
        }}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v && onChange(String(v))}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
