"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Building2, Briefcase, IndianRupee, MapPin, Pause, Pencil, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  closeEmployerJob,
  getEmployerJob,
  getMockEmployerJobDetail,
  JobsApiError,
  pauseEmployerJob,
  publishEmployerJob,
  type EmployerJobDetail,
  type JobRequirement,
} from "@/lib/employer/jobs-api";
import { ConfirmDialog } from "./confirm-dialog";
import { JobStatusChip } from "./job-status-chip";
import { formatDate, formatRelativeDays, formatSalary } from "./format";

type TabKey = "overview" | "applications" | "shortlisted" | "interviews" | "offers" | "analytics";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "applications", label: "Applications" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviews", label: "Interviews" },
  { key: "offers", label: "Offers" },
  { key: "analytics", label: "Analytics" },
];

type StatusAction = "pause" | "close" | "resume";

export function JobDetailView({ jobId, published = false }: { jobId: string; published?: boolean }) {
  const [job, setJob] = useState<EmployerJobDetail | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showPublished, setShowPublished] = useState(published);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployerJob(jobId);
      setJob(data || getMockEmployerJobDetail(jobId));
    } catch {
      setJob(getMockEmployerJobDetail(jobId));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function runAction(action: StatusAction) {
    setActionError(null);
    try {
      if (action === "pause") await pauseEmployerJob(jobId);
      else if (action === "close") await closeEmployerJob(jobId);
      else await publishEmployerJob(jobId);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the job status.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading job">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !job) {
    const notFound = error?.status === 404;
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>{notFound ? "Job not found" : "Could not load this job"}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>
            {notFound
              ? "This posting does not exist or does not belong to your organisation."
              : error?.message ?? "Please try again."}
          </span>
          {!notFound && (
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          )}
          <Link href="/employer/jobs" className="underline">
            Back to jobs
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const applicationsHref = `/employer/applications?job=${job.id}`;
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_range);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/employer/jobs" className="hover:text-foreground hover:underline">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-foreground">{job.title}</span>
      </nav>

      {showPublished && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-sm text-success"
        >
          <span>This job is published and now visible to matching candidates.</span>
          <button type="button" className="text-xs underline" onClick={() => setShowPublished(false)}>
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">{job.title}</h1>
              <JobStatusChip status={job.status} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <MetaItem icon={Building2} text={job.company_name ?? "Your organisation"} />
              <MetaItem icon={MapPin} text={job.location ?? "Location not set"} />
              <MetaItem icon={Briefcase} text={job.employment_type ?? "Full-time"} />
              <MetaItem icon={IndianRupee} text={salary} />
            </div>
            <p className="text-xs text-muted-foreground">
              Posted {formatRelativeDays(job.posted_at)}
              {job.deadline && ` · Apply by ${formatDate(job.deadline)}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button render={<Link href={`/employer/jobs/${job.id}/edit`} />}>
                <Pencil className="size-4" /> Edit Job
              </Button>
            <Button variant="outline" render={<Link href={`/employer/matches?job=${job.id}`} />}>
                <Sparkles className="size-4" /> Find matches
              </Button>
            {job.status === "open" && (
              <Button variant="outline" onClick={() => setPendingAction("pause")}>
                <Pause className="size-4" /> Pause
              </Button>
            )}
            {job.status === "paused" && (
              <Button variant="outline" onClick={() => setPendingAction("resume")}>
                <RotateCcw className="size-4" /> Resume
              </Button>
            )}
            {(job.status === "open" || job.status === "paused") && (
              <Button variant="destructive" onClick={() => setPendingAction("close")}>
                <XCircle className="size-4" /> Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              {t.key === "applications" && <CountBadge value={job.pipeline?.applied ?? 0} />}
              {t.key === "shortlisted" && <CountBadge value={job.pipeline?.shortlisted ?? 0} />}
              {t.key === "interviews" && <CountBadge value={job.pipeline?.interview ?? 0} />}
              {t.key === "offers" && <CountBadge value={job.pipeline?.offered ?? 0} />}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab job={job} />
        </TabsContent>
        <TabsContent value="applications" className="mt-6">
          <PipelineTab
            title="Applications"
            count={job.pipeline?.applied ?? 0}
            description="Every candidate who applied to this posting, newest first."
            href={applicationsHref}
            cta="Open applications"
          />
        </TabsContent>
        <TabsContent value="shortlisted" className="mt-6">
          <PipelineTab
            title="Shortlisted"
            count={job.pipeline?.shortlisted ?? 0}
            description="Candidates moved forward from screening for this posting."
            href={`${applicationsHref}&status=shortlisted`}
            cta="Review shortlist"
          />
        </TabsContent>
        <TabsContent value="interviews" className="mt-6">
          <PipelineTab
            title="Interviews"
            count={job.pipeline?.interview ?? 0}
            description="Candidates currently in the interview stage for this posting."
            href={`/employer/interviews?job=${job.id}`}
            cta="Open interviews"
          />
        </TabsContent>
        <TabsContent value="offers" className="mt-6">
          <PipelineTab
            title="Offers"
            count={job.pipeline?.offered ?? 0}
            description="Offers sent for this posting, including accepted hires."
            href={`/employer/offers?job=${job.id}`}
            cta="Open offers"
          />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab job={job} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={
          pendingAction === "close"
            ? "Close this job?"
            : pendingAction === "resume"
              ? "Resume this job?"
              : "Pause this job?"
        }
        description={
          pendingAction === "close"
            ? "Closing stops new applications. Existing applications and interviews are kept."
            : pendingAction === "resume"
              ? "The posting becomes Active again and accepts applications."
              : "Pausing hides the posting from new applications until you resume it."
        }
        confirmLabel={
          pendingAction === "close" ? "Close job" : pendingAction === "resume" ? "Resume job" : "Pause job"
        }
        destructive={pendingAction === "close"}
        onConfirm={async () => {
          if (pendingAction) await runAction(pendingAction);
        }}
      />
    </div>
  );
}

function MetaItem({ icon: Icon, text }: { icon: typeof Building2; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="size-4" aria-hidden />
      {text}
    </span>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <Badge variant="secondary" className="ml-1.5 tabular-nums">
      {value}
    </Badge>
  );
}

function OverviewTab({ job }: { job: EmployerJobDetail }) {
  const required = job.requirements.filter((r) => r.requirement_type === "required");
  const preferred = job.requirements.filter((r) => r.requirement_type === "preferred");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-heading text-base">Job information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoRow label="Cooperative sector" value={job.sector} />
            <InfoRow label="Department" value={job.department} />
            <InfoRow label="Location" value={job.location} />
            <InfoRow label="Employment type" value={job.employment_type} />
            <InfoRow label="Salary" value={formatSalary(job.salary_min, job.salary_max, job.salary_range)} />
            <InfoRow label="Experience" value={job.experience_required} />
            <InfoRow label="Education" value={job.education} />
            <InfoRow label="Positions" value={job.openings != null ? String(job.openings) : null} />
            <InfoRow label="Application deadline" value={job.deadline ? formatDate(job.deadline) : null} />
            <InfoRow label="Languages" value={job.languages} />
          </dl>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Description</h3>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {job.description?.trim() || "No description has been added yet."}
            </p>
          </section>
          {job.responsibilities?.trim() && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-foreground">Responsibilities</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{job.responsibilities.trim()}</p>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Skill requirements</h3>
            <SkillList title="Required" items={required} empty="No required skills set. Matching cannot score candidates yet." />
            <SkillList title="Preferred" items={preferred} empty="No preferred skills." />
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <Sparkles className="size-4 text-primary" /> AI matching summary
          </CardTitle>
          <CardDescription>Based on the candidates currently scored against this posting.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Average match</span>
            <span className="font-heading text-2xl font-bold text-foreground">
              {job.match_rate === null ? "—" : `${job.match_rate}%`}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Applications</span>
            <span className="font-semibold tabular-nums">{job.applications_count}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">In interview</span>
            <span className="font-semibold tabular-nums">{job.pipeline.interview}</span>
          </div>
          <Button variant="outline" className="w-full" render={<Link href={`/employer/matches?job=${job.id}`} />}>
              Find matches <ArrowRight className="size-4" />
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

function SkillList({ title, items, empty }: { title: string; items: JobRequirement[]; empty: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item.skill_name} variant={title === "Required" ? "secondary" : "outline"}>
              {item.skill_name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineTab({
  title,
  count,
  description,
  href,
  cta,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-heading text-3xl font-bold tabular-nums text-foreground">{count}</span>
          <span className="text-sm text-muted-foreground">{count === 1 ? "candidate" : "candidates"}</span>
        </div>
        <Button variant="outline" render={<Link href={href} />}>
            {cta} <ArrowRight className="size-4" />
          </Button>
      </CardContent>
    </Card>
  );
}

function AnalyticsTab({ job }: { job: EmployerJobDetail }) {
  const stages: { label: string; value: number }[] = [
    { label: "Applied", value: job.pipeline.applied },
    { label: "Shortlisted", value: job.pipeline.shortlisted },
    { label: "Interview", value: job.pipeline.interview },
    { label: "Offered", value: job.pipeline.offered },
    { label: "Hired", value: job.pipeline.hired },
  ];
  const applied = job.pipeline.applied;
  const conversion = applied > 0 ? Math.round((job.pipeline.hired / applied) * 100) : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-heading text-base">Pipeline by stage</CardTitle>
          <CardDescription>Candidates at each stage of this posting&apos;s hiring funnel.</CardDescription>
        </CardHeader>
        <CardContent>
          {applied === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No applications yet. Analytics appear once candidates apply.
            </p>
          ) : (
            <HorizontalBarList items={stages} max={applied} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Key figures</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <Row label="Average match rate" value={job.match_rate === null ? "—" : `${job.match_rate}%`} />
          <Row label="Hire conversion" value={conversion === null ? "—" : `${conversion}%`} />
          <Row label="Positions open" value={job.openings != null ? String(job.openings) : "—"} />
          <Row label="Posted" value={formatRelativeDays(job.posted_at)} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
