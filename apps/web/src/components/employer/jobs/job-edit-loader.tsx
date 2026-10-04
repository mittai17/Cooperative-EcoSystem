"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmployerJob, JobsApiError, type EmployerJobDetail } from "@/lib/employer/jobs-api";
import { JobForm } from "./job-form";

/** Loads one job for /employer/jobs/[id]/edit and renders the shared form in edit mode. */
export function JobEditLoader({ jobId, savedNotice }: { jobId: string; savedNotice?: string | null }) {
  const [job, setJob] = useState<EmployerJobDetail | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployerJob(jobId);
      setJob(data);
    } catch (err) {
      const status = err instanceof JobsApiError ? err.status : 0;
      const message = err instanceof Error ? err.message : "Could not load this job.";
      setError({ status, message });
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading job">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
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
              ? "This posting does not exist or does not belong to your organisation. Pick another posting from the jobs list."
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

  return <JobForm key={job.id} mode="edit" job={job} notice={savedNotice === "draft" ? "Draft saved." : null} />;
}
