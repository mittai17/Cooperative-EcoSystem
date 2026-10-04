"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Briefcase, MapPin, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/api";
import { useT } from "@/i18n";

// Shape returned by GET /api/v1/jobs/ (backend/app/api/v1/jobs.py, list_jobs).
interface ApiJob {
  id: string;
  title: string;
  employer: string | null;
  location: string | null;
}

interface JobsResponse {
  jobs?: ApiJob[];
  total?: number;
}

export default function TraineeJobsPage() {
  const t = useT();
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth("/api/v1/jobs/")
      .then((data: JobsResponse | null) => {
        if (!cancelled) setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setJobs([]);
        setError(err instanceof Error ? err.message : "");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("trainee.jobs.title")}
        description={t("trainee.jobs.description")}
        action={
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
            {t("trainee.common.refresh")}
          </Button>
        }
      />

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error !== null && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("trainee.jobs.loadFailed")}</AlertTitle>
          <AlertDescription>
            {error || t("trainee.jobs.loadFailedDetail")} {t("trainee.common.checkConnection")}
          </AlertDescription>
        </Alert>
      )}

      {!loading && error === null && jobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Briefcase className="size-8 text-muted-foreground" />
            <p className="font-medium text-foreground">{t("trainee.jobs.noneTitle")}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("trainee.jobs.noneHint")}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && error === null && jobs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="text-lg leading-tight">{job.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                {job.employer && <p>{job.employer}</p>}
                {job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {job.location}
                  </span>
                )}
              </CardContent>
              <CardFooter>
                <Link className="contents" href={`/jobs/${job.id}`}>
                  <Button variant="outline" size="sm" className="w-full" nativeButton={false}>
                    {t("trainee.jobs.viewDetails")}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
