"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { InterviewForm } from "@/components/employer/interviews/interview-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApplicationSummary, type ApplicationSummary } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

function ScheduleInterviewContent() {
  const api = useApi();
  const router = useRouter();
  const applicationId = useSearchParams().get("application");
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(applicationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getApplicationSummary(api, applicationId);
        if (!cancelled) setApplication(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load this application."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Schedule Interview"
        description="Book a time with a shortlisted candidate. The candidate's application moves to Interview."
        action={
          <Button variant="outline" render={<Link href="/employer/interviews" />}>
            <ArrowLeft />
            Back to interviews
          </Button>
        }
      />

      {!applicationId && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Choose a candidate first</AlertTitle>
          <AlertDescription>
            Interviews are booked from an application. Open{" "}
            <Link href="/employer/applications" className="font-medium text-primary underline-offset-4 hover:underline">
              Applications
            </Link>{" "}
            and pick a candidate to schedule.
          </AlertDescription>
        </Alert>
      )}

      {applicationId && loading && <Skeleton className="h-96 w-full rounded-2xl" />}

      {applicationId && !loading && error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Application not available</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" render={<Link href="/employer/applications" />}>
              Go to applications
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {application && (
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <InterviewForm
              api={api}
              application={application}
              onScheduled={() => router.push("/employer/interviews")}
            />
          </CardContent>
        </Card>
      )}

      {!applicationId && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <CalendarPlus className="size-5" />
            Scheduling needs an application so the interview stays linked to the candidate and job.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ScheduleInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading
        </div>
      }
    >
      <ScheduleInterviewContent />
    </Suspense>
  );
}
