"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Inbox, ShieldCheck, Ban, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSelect } from "@/components/employer/candidates/filter-select";
import { useResource } from "@/components/employer/candidates/use-resource";
import { PipelineCard } from "@/components/employer/applications/pipeline-card";
import { PIPELINE_STAGES, isTerminal, stageLabel, stageTone } from "@/components/employer/applications/pipeline-stages";
import {
  type EmployerApplication,
  errorMessage,
  listApplications,
  listMyJobs,
  updateApplicationStatus,
} from "@/lib/employer/candidates-api";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/use-api";

const ALL = "all";

function HiringPipelineContent() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedJob = searchParams.get("job") ?? "";

  const [selectedJob, setSelectedJob] = useState(requestedJob || ALL);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const jobs = useResource(() => listMyJobs(api), []);
  const jobId = selectedJob === ALL ? "" : selectedJob;
  const applications = useResource(() => listApplications(api, { jobId: jobId || undefined }), [jobId]);
  const records = useMemo(() => applications.data ?? [], [applications.data]);

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const application of records) byStatus[application.status] = (byStatus[application.status] ?? 0) + 1;
    return byStatus;
  }, [records]);

  async function move(application: EmployerApplication, status: string) {
    if (status === "rejected" && !window.confirm(`Reject ${application.name}? The candidate will be notified.`)) return;
    setBusyId(application.id);
    setActionError(null);
    setNotice(null);
    try {
      await updateApplicationStatus(api, application.id, { status });
      setNotice(`${application.name} moved to ${stageLabel(status)}.`);
      applications.reload();
    } catch (err) {
      setActionError(errorMessage(err, "Could not update this application."));
    } finally {
      setBusyId(null);
    }
  }

  function selectJob(value: string) {
    setSelectedJob(value);
    router.replace(value === ALL ? "/employer/applications" : `/employer/applications?job=${encodeURIComponent(value)}`);
  }

  const jobOptions = [
    { value: ALL, label: "All postings" },
    ...(jobs.data ?? []).map((job) => ({ value: job.id, label: job.title })),
  ];
  const hired = counts.hired ?? 0;
  const inPipeline = records.filter((application) => !isTerminal(application.status)).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hiring Pipeline"
        description="Move candidates through each stage. Interviews and offers continue on their own pages."
        action={
          <Link href="/employer/candidates" className={buttonVariants({ variant: "outline" })}>
            Find candidates
          </Link>
        }
      />

      {(applications.error || actionError) && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{actionError ?? applications.error}</AlertDescription>
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
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {jobs.loading && !jobs.data ? (
            <Skeleton className="h-16 w-72" />
          ) : (
            <FilterSelect
              id="pipeline-job"
              label="Posting"
              value={selectedJob}
              options={jobOptions}
              onChange={selectJob}
            />
          )}
          {jobs.error && <p className="text-xs text-muted-foreground">Postings could not be loaded: {jobs.error}</p>}
        </CardContent>
      </Card>

      {applications.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : applications.error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-foreground">The pipeline could not be loaded</p>
            <Button variant="outline" onClick={applications.reload}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </span>
            <p className="text-base font-semibold text-foreground">No applications received yet.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Applications appear here once trainees apply. Use Candidates to reach out to verified Skill Passports in the meantime.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Applications" value={String(records.length)} icon={Inbox} trend="All stages" trendTone="neutral" />
            <StatCard label="In progress" value={String(inPipeline)} icon={Users} trend="Not yet hired or closed" trendTone="neutral" />
            <StatCard label="Hired" value={String(hired)} icon={ShieldCheck} trend="Confirmed" trendTone="up" />
            <StatCard label="Closed out" value={String((counts.rejected ?? 0) + (counts.withdrawn ?? 0))} icon={Ban} trend="Rejected or withdrawn" trendTone="neutral" />
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[72rem] grid-cols-6 gap-3">
              {PIPELINE_STAGES.map((stage) => {
                const cards = records.filter((application) =>
                  stage.key === "rejected"
                    ? application.status === "rejected" || application.status === "withdrawn"
                    : application.status === stage.key,
                );
                return (
                  <section key={stage.key} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3" aria-label={stage.label}>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading text-sm font-semibold text-foreground">{stage.label}</h2>
                      <span className={cn("rounded-4xl px-1.5 py-0.5 font-mono text-[11px] font-semibold", stageTone(stage.key))}>
                        {cards.length}
                      </span>
                    </div>
                    {cards.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Nothing at this stage.</p>
                    ) : (
                      cards.map((application) => (
                        <PipelineCard
                          key={application.id}
                          application={application}
                          busy={busyId === application.id}
                          onMove={move}
                        />
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <HiringPipelineContent />
    </Suspense>
  );
}
