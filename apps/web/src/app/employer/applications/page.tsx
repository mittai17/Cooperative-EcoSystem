"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Ban,
  CalendarClock,
  Inbox,
  MapPin,
  SearchX,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ApiError, useApi } from "@/lib/use-api";

interface JobOption {
  id: string;
  title: string;
  status: string;
}

interface SkillMatchEntry {
  skill: string;
  status?: string;
  confidence?: number;
  required?: string | null;
  current?: string | null;
}

interface Application {
  id: string;
  trainee_id: string;
  name: string;
  status: string;
  applied_at: string | null;
  match_score: number | null;
  matched_skills: SkillMatchEntry[];
  missing_skills: SkillMatchEntry[];
  verified_skill_count: number;
}

function skillNames(entries: SkillMatchEntry[]): string {
  return entries.map((entry) => entry.skill).join(", ");
}

const STAGES = ["applied", "shortlisted", "interview", "offered", "hired"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABEL: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const TRANSITIONS: Record<string, string[]> = {
  applied: ["shortlisted", "rejected"],
  shortlisted: ["interview", "offered", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

function stageTone(status: string): string {
  if (status === "hired") return "bg-success/10 text-success";
  if (status === "rejected" || status === "withdrawn") return "bg-destructive/10 text-destructive";
  if (status === "offered" || status === "interview") return "bg-warning/10 text-warning";
  return "bg-primary/10 text-primary";
}

function ApplicationsPageContent() {
  const api = useApi();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobOption[] | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ jobs: JobOption[] }>("/api/v1/jobs/mine");
        setJobs(data.jobs);
        const preset = searchParams.get("job");
        if (preset && data.jobs.some((j) => j.id === preset)) {
          setSelectedJob(preset);
        } else if (data.jobs.length > 0) {
          setSelectedJob(data.jobs[0].id);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : "Could not reach the CoopSetu API");
        setJobs([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadApplications(jobId: string) {
    setApplications(null);
    setError(null);
    try {
      const data = await api.get<{ applications: Application[] }>(`/api/v1/jobs/${jobId}/applications`);
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not load applications for this job.");
      setApplications([]);
    }
  }

  useEffect(() => {
    if (!selectedJob) return;
    const id = window.setTimeout(() => void loadApplications(selectedJob), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob]);

  async function transition(application: Application, status: string) {
    setBusyId(application.id);
    setActionError(null);
    try {
      await api.patch(`/api/v1/jobs/applications/${application.id}`, { status });
      setNotice(`${application.name} moved to ${STAGE_LABEL[status] ?? status}.`);
      await loadApplications(selectedJob);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.detail : "Could not update this application.");
    } finally {
      setBusyId(null);
    }
  }

  const active = useMemo(() => (applications ?? []).filter((a) => !["rejected", "withdrawn"].includes(a.status)), [applications]);
  const closedOut = useMemo(() => (applications ?? []).filter((a) => ["rejected", "withdrawn"].includes(a.status)), [applications]);

  const stats = useMemo(() => {
    const all = applications ?? [];
    const engaged = all.filter((a) => STAGES.indexOf(a.status as Stage) >= 1).length;
    const hires = all.filter((a) => a.status === "hired").length;
    const scores = all.map((a) => a.match_score).filter((v): v is number => v !== null);
    const median = scores.length
      ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)]
      : 0;
    return { total: all.length, engaged, hires, median };
  }, [applications]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications & Hiring Pipeline"
        description="Move candidates through the pipeline for a posting and review their AI-explained skill match."
      />

      {(error || actionError) && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error ?? actionError}</AlertDescription>
        </Alert>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-foreground">{notice}</p>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Posting</CardTitle>
          {jobs === null ? (
            <Skeleton className="h-9 w-64" />
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No postings yet — create one first.</p>
          ) : (
            <Select
              items={jobs.map((job) => ({ label: job.title, value: job.id }))}
              value={selectedJob}
              onValueChange={(v) => v && setSelectedJob(String(v))}
            >
              <SelectTrigger className="w-full sm:w-72" aria-label="Select posting">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>
      </Card>

      {selectedJob && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Applications" value={String(stats.total)} icon={Inbox} trend={`Median match ${stats.median}/100`} trendTone="neutral" />
            <StatCard label="Engaged" value={String(stats.engaged)} icon={Users} trend="Shortlisted or beyond" trendTone="up" />
            <StatCard label="Hires" value={String(stats.hires)} icon={ShieldCheck} trend="Confirmed for this posting" trendTone="up" />
            <StatCard label="Closed out" value={String(closedOut.length)} icon={Ban} trend="Rejected or withdrawn" trendTone="neutral" />
          </div>

          {applications === null ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {STAGES.map((stage) => (
                <div key={stage} className="rounded-lg border border-border bg-muted/30 p-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-20 w-full" />
                </div>
              ))}
            </div>
          ) : active.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <SearchX className="size-6" />
                </span>
                <p className="text-base font-semibold text-foreground">No active applications</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Nobody has applied to this posting yet, or every application has been rejected or withdrawn.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[64rem] grid-cols-5 gap-3">
                {STAGES.map((stage) => {
                  const cards = active.filter((a) => a.status === stage);
                  return (
                    <section key={stage} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-sm font-semibold text-foreground">{STAGE_LABEL[stage]}</h2>
                        <span className={cn("rounded-4xl px-1.5 py-0.5 font-mono text-[11px] font-semibold", stageTone(stage))}>
                          {cards.length}
                        </span>
                      </div>
                      {cards.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                          Nothing at this stage.
                        </p>
                      ) : (
                        cards.map((application) => {
                          const options = TRANSITIONS[application.status] ?? [];
                          const forward = options.find((s) => s !== "rejected");
                          return (
                            <article key={application.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">{application.name}</p>
                                {application.match_score !== null && (
                                  <span className="shrink-0 rounded-4xl bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                                    {application.match_score}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <CalendarClock className="size-3" />
                                Applied {formatDate(application.applied_at)}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="gap-1 text-[11px]">
                                  <BadgeCheck className="size-3" />
                                  {application.verified_skill_count} verified skill{application.verified_skill_count === 1 ? "" : "s"}
                                </Badge>
                              </div>
                              {application.matched_skills.length > 0 && (
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  Matched: {skillNames(application.matched_skills)}
                                </p>
                              )}
                              {application.missing_skills.length > 0 && (
                                <p className="mt-1 text-[11px] text-warning">
                                  Missing: {skillNames(application.missing_skills)}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-1.5">
                                {forward && (
                                  <Button
                                    size="sm"
                                    className="h-7 flex-1 px-2 text-xs"
                                    disabled={busyId === application.id}
                                    onClick={() => transition(application, forward)}
                                  >
                                    {STAGE_LABEL[forward]}
                                    <ArrowRight className="size-3.5" />
                                  </Button>
                                )}
                                {options.includes("rejected") && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-destructive"
                                    disabled={busyId === application.id}
                                    onClick={() => transition(application, "rejected")}
                                  >
                                    Reject
                                  </Button>
                                )}
                              </div>
                            </article>
                          );
                        })
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {closedOut.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rejected &amp; withdrawn ({closedOut.length})</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {closedOut.map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span className="text-foreground">{application.name}</span>
                    </div>
                    <Badge className={stageTone(application.status)}>{STAGE_LABEL[application.status]}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Loading applications...</div>}>
      <ApplicationsPageContent />
    </Suspense>
  );
}
