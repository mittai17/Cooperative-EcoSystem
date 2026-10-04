"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Briefcase, MapPin, RefreshCw, CheckCircle2, Building2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { jobs as mockJobs } from "@/lib/mock-data/jobs";
import { getJobMatch } from "@/lib/job-match";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export default function TraineeJobsPage() {
  const t = useT();
  const [jobs, setJobs] = useState(mockJobs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [applySuccessNotice, setApplySuccessNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nurvex_applications");
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{ jobId?: string; id?: string | number }>;
        const map: Record<string, boolean> = {};
        parsed.forEach((item) => {
          if (item.jobId) map[item.jobId] = true;
        });
        window.setTimeout(() => setAppliedJobs(map), 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      try {
        setJobs(mockJobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [reloadKey]);

  const handleApply = (job: (typeof mockJobs)[number]) => {
    const today = new Date().toISOString().split("T")[0];
    const newApp = {
      id: `app-${job.id}-${today}`,
      jobId: job.id,
      title: job.title,
      employer: job.employer || "Cooperative Union",
      date: today,
      status: "Applied",
      location: job.location || undefined,
    };

    try {
      const stored = localStorage.getItem("nurvex_applications");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newApp);
      localStorage.setItem("nurvex_applications", JSON.stringify(list));
    } catch {}

    setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
    setApplySuccessNotice(`Application submitted for ${job.title}! Track it in your Applications tab.`);
    setTimeout(() => setApplySuccessNotice(null), 4000);
  };

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

      {applySuccessNotice && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertDescription className="text-xs sm:text-sm font-medium">{applySuccessNotice}</AlertDescription>
          </div>
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && error !== null && jobs.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("trainee.jobs.loadFailed")}</AlertTitle>
          <AlertDescription>
            {error || t("trainee.jobs.loadFailedDetail")} {t("trainee.common.checkConnection")}
          </AlertDescription>
        </Alert>
      )}

      {!loading && jobs.length === 0 && (
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

      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const hasApplied = appliedJobs[job.id];
            const match = getJobMatch(job);
            return (
              <Card key={job.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold leading-tight text-foreground">{job.title}</CardTitle>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="secondary" className="text-[10px] font-medium">
                          {job.type}
                        </Badge>
                        <span
                          className={cn(
                            "text-[10px] font-semibold",
                            match.percent >= 70 ? "text-emerald-600" : match.percent >= 40 ? "text-amber-600" : "text-muted-foreground",
                          )}
                        >
                          {match.percent}% skill match
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2.5 text-sm text-muted-foreground pt-0">
                    {job.employer && (
                      <p className="font-medium text-foreground flex items-center gap-1.5 text-xs">
                        <Building2 className="size-3.5 text-primary" /> {job.employer}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {job.location && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="size-3.5 text-primary" /> {job.location}
                        </span>
                      )}
                      {job.salaryRange && (
                        <span className="font-medium text-foreground">
                          {job.salaryRange}
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {job.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skillsRequired.map((skill) => {
                        const hasSkill = match.matched.some((entry) => entry.toLowerCase() === skill.toLowerCase());
                        return (
                          <Badge
                            key={skill}
                            variant="outline"
                            className={cn(
                              "text-[10px] py-0 px-1.5 font-normal",
                              hasSkill && "border-success/40 bg-success/10 text-success",
                            )}
                          >
                            {skill}
                          </Badge>
                        );
                      })}
                    </div>
                    {match.missing.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Missing: {match.missing.join(", ")}
                      </p>
                    )}
                  </CardContent>
                </div>
                <CardFooter className="pt-3 border-t flex gap-2">
                  <Link className="contents flex-1" href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs" nativeButton={false}>
                      {t("trainee.jobs.viewDetails")}
                    </Button>
                  </Link>
                  {hasApplied ? (
                    <Button size="sm" variant="secondary" className="flex-1 text-xs gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" disabled>
                      <CheckCircle2 className="size-3.5" /> Applied
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1 text-xs" onClick={() => handleApply(job)}>
                      Apply Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
