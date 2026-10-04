"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, MessageSquarePlus, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { FeedbackForm } from "@/components/employer/feedback/feedback-form";
import { SkillDemandPanel } from "@/components/employer/feedback/skill-demand-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getFeedback,
  type FeedbackRecord,
  type FeedbackResponse,
  type HireRecord,
} from "@/lib/employer/workflow-api";
import { errorMessage, formatDate, formatDuration } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

/** Average of the six criteria, or the legacy single rating for feedback logged before the new form. */
function overallRating(item: FeedbackRecord): number | null {
  const values = Object.values(item.ratings ?? {}).filter((v): v is number => typeof v === "number");
  if (values.length > 0) return values.reduce((sum, v) => sum + v, 0) / values.length;
  return item.performance_rating;
}

function Stars({ value }: { value: number | null }) {
  const rounded = value === null ? 0 : Math.round(value);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-3", i <= rounded ? "fill-primary text-primary" : "text-muted-foreground")} />
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const api = useApi();
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeHire, setActiveHire] = useState<HireRecord | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getFeedback(api));
    } catch (err) {
      setError(errorMessage(err, "Could not load hired candidates. Check your connection and try again."));
      setData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const hires = data?.hires ?? [];
  const past = data?.feedback ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employer Feedback"
        description="Rate hired candidates after they start work. Your feedback helps improve cooperative training programmes."
      />

      {notice && (
        <Alert>
          <CheckCircle2 className="text-success" />
          <AlertTitle>Feedback submitted</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Hired candidates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!error && data === null && <Skeleton className="m-6 h-40 w-auto rounded-xl" />}

            {!error && data !== null && hires.length === 0 && (
              <p className="m-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No hired candidates yet. Hires appear here once an application reaches the &ldquo;Hired&rdquo; stage in
                Applications.
              </p>
            )}

            {!error && data !== null && hires.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Time Employed</TableHead>
                      <TableHead className="text-right">Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hires.map((hire) => (
                      <TableRow key={`${hire.job_id}-${hire.trainee_id}`}>
                        <TableCell className="font-medium">{hire.employee_name}</TableCell>
                        <TableCell className="text-muted-foreground">{hire.job_title}</TableCell>
                        <TableCell>{formatDate(hire.hired_at)}</TableCell>
                        <TableCell>{formatDuration(hire.hired_at)}</TableCell>
                        <TableCell className="text-right">
                          {hire.feedback_submitted ? (
                            <Badge className="border-0 bg-success/10 text-success">Submitted</Badge>
                          ) : (
                            <Button size="sm" onClick={() => setActiveHire(hire)}>
                              <MessageSquarePlus />
                              Give feedback
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <SkillDemandPanel api={api} />
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-base">Past feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!error && data === null && <Skeleton className="h-24 w-full" />}
              {!error && data !== null && past.length === 0 && (
                <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
              )}
              {!error &&
                past.map((item) => (
                  <div key={item.id} className="border-b pb-4 last:border-0">
                    <p className="text-sm font-medium">{item.employee_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.job_title}
                      {item.created_at ? ` • ${formatDate(item.created_at)}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={overallRating(item)} />
                      {overallRating(item) !== null && (
                        <span className="text-xs text-muted-foreground">{overallRating(item)?.toFixed(1)} / 5</span>
                      )}
                    </div>
                    {item.additional_skills_needed.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">Needs: {item.additional_skills_needed.join(", ")}</p>
                    )}
                    {item.comments && <p className="mt-1 text-sm text-muted-foreground">{item.comments}</p>}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={activeHire !== null} onOpenChange={(open) => !open && setActiveHire(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Post-hire feedback</DialogTitle>
            <DialogDescription>Rate each area from 1 (weak) to 5 (excellent).</DialogDescription>
          </DialogHeader>
          {activeHire && (
            <FeedbackForm
              api={api}
              hire={activeHire}
              onCancel={() => setActiveHire(null)}
              onSubmitted={() => {
                setNotice(`Feedback recorded for ${activeHire.employee_name}.`);
                setActiveHire(null);
                void load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
