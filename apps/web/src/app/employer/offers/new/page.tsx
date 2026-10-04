"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { OfferForm } from "@/components/employer/offers/offer-form";
import { stageActions, stageLabel, stageTone } from "@/components/employer/applications/pipeline-stages";
import { CandidateAvatar } from "@/components/employer/candidates/candidate-avatar";
import { useResource } from "@/components/employer/candidates/use-resource";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listApplications } from "@/lib/employer/candidates-api";
import { getApplicationSummary, type ApplicationSummary } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";

function NewOfferContent() {
  const api = useApi();
  const router = useRouter();
  const applicationId = useSearchParams().get("application");
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(applicationId));
  const [error, setError] = useState<string | null>(null);
  const pipeline = useResource(() => listApplications(api), []);
  const offerable = useMemo(
    () => (pipeline.data ?? []).filter((item) => stageActions(item.status).offer),
    [pipeline.data],
  );

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
        title="Create Offer"
        description="Set the terms for a candidate. Save a draft to finish later, or send the offer now."
        action={
          <Button variant="outline" render={<Link href="/employer/offers" />}>
            <ArrowLeft />
            Back to offers
          </Button>
        }
      />

      {!applicationId && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-base">Candidates ready for an offer</CardTitle>
            <CardDescription>
              Offers are raised from an application so the terms stay linked to the candidate and posting.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pipeline.loading && (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            )}
            {!pipeline.loading && offerable.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No candidate is ready for an offer right now. Shortlist someone in{" "}
                <Link href="/employer/applications" className="font-medium text-primary underline-offset-4 hover:underline">
                  Applications
                </Link>{" "}
                and they will appear here.
              </p>
            )}
            {!pipeline.loading &&
              offerable.map((item) => (
                <Link
                  key={item.id}
                  href={`/employer/offers/new?application=${encodeURIComponent(item.id)}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <CandidateAvatar name={item.name} photoUrl={item.photo_url} className="size-10 text-sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{item.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.job_title ?? "Role not set"}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.match_score !== null && (
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">{item.match_score}% match</span>
                    )}
                    <Badge className={cn("hover:bg-transparent", stageTone(item.status))}>{stageLabel(item.status)}</Badge>
                  </span>
                </Link>
              ))}
          </CardContent>
        </Card>
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
            <OfferForm
              api={api}
              application={application}
              onSaved={() => router.push("/employer/offers")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NewOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading
        </div>
      }
    >
      <NewOfferContent />
    </Suspense>
  );
}
