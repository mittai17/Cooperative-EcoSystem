"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Eye, Loader2, MapPin, RefreshCw, Trash2, Video } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CancelInterviewDialog } from "@/components/employer/interviews/cancel-interview-dialog";
import { EvaluationForm } from "@/components/employer/interviews/evaluation-form";
import { InterviewDecisionBadge, InterviewStatusBadge } from "@/components/employer/interviews/interview-status";
import { RescheduleDialog } from "@/components/employer/interviews/reschedule-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInterview,
  updateInterview,
  type Interview,
  type InterviewDecision,
} from "@/lib/employer/workflow-api";
import { errorMessage, formatDate, formatTime } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

const DECISIONS: { value: InterviewDecision; label: string; hint: string }[] = [
  { value: "proceed", label: "Proceed", hint: "Move the candidate forward in your process." },
  { value: "hold", label: "Hold", hint: "Keep the candidate open while you decide." },
  { value: "reject", label: "Reject", hint: "Close this candidate for this role." },
];

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

export default function InterviewReviewPage() {
  const api = useApi();
  const params = useParams();
  const id = String(params.id);

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setInterview(await getInterview(api, id));
    } catch (err) {
      setLoadError(errorMessage(err, "Could not load this interview."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      await load();
    } catch (err) {
      setActionError(errorMessage(err, "That change did not save. Try again."));
    } finally {
      setBusy(null);
    }
  }

  const backLink = (
    <Button variant="outline" render={<Link href="/employer/interviews" />}>
      <ArrowLeft />
      All interviews
    </Button>
  );

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Interview review" description="Review the interview and record your evaluation." action={backLink} />
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Interview not available</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {loadError}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const isScheduled = interview.status === "scheduled";
  const isOnline = interview.mode === "online";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Interview — ${interview.candidate_name}`}
        description={`${interview.job_title} · ${formatDate(interview.scheduled_at)}, ${formatTime(interview.scheduled_at)}`}
        action={
          <>
            <InterviewStatusBadge status={interview.status} />
            {backLink}
          </>
        }
      />

      {notice && (
        <Alert>
          <CheckCircle2 className="text-success" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <DetailRow label="Date">{formatDate(interview.scheduled_at)}</DetailRow>
                <DetailRow label="Time">{formatTime(interview.scheduled_at)}</DetailRow>
                <DetailRow label="Duration">{interview.duration_minutes} minutes</DetailRow>
                <DetailRow label="Type">
                  <span className="inline-flex items-center gap-1.5">
                    {isOnline ? <Video className="size-4" /> : <MapPin className="size-4" />}
                    {isOnline ? "Online" : "On-site"}
                  </span>
                </DetailRow>
                <DetailRow label="Interviewer">{interview.interviewer_name || "Not set"}</DetailRow>
                <DetailRow label="Candidate">{interview.candidate_name}</DetailRow>
                <DetailRow label="Job">{interview.job_title}</DetailRow>
              </dl>
              {isOnline && interview.meeting_link && (
                <a
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-4" />
                  Open meeting link
                </a>
              )}
              {interview.notes && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{interview.notes}</div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/employer/candidates/${interview.trainee_id}`} />}>
                  <Eye />
                  View profile
                </Button>
                {isScheduled && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)} disabled={busy !== null}>
                      <RefreshCw />
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => run("complete", () => updateInterview(api, id, { status: "completed" }), "Interview marked as completed.")}
                      disabled={busy !== null}
                    >
                      {busy === "complete" && <Loader2 className="animate-spin" />}
                      Mark as Completed
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)} disabled={busy !== null}>
                      <Trash2 />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-base">Decision</CardTitle>
              <CardDescription>
                Decisions are made and recorded by your team. CoopSetu does not make hiring decisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <InterviewDecisionBadge decision={interview.decision} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DECISIONS.map((d) => (
                  <Button
                    key={d.value}
                    variant={interview.decision === d.value ? "default" : "outline"}
                    className="justify-start"
                    disabled={busy !== null}
                    onClick={() =>
                      run(`decision-${d.value}`, () => updateInterview(api, id, { decision: d.value }), `Decision recorded: ${d.label}.`)
                    }
                  >
                    {busy === `decision-${d.value}` && <Loader2 className="animate-spin" />}
                    {d.label}
                    <span className="ml-auto text-xs font-normal opacity-80">{d.hint}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Evaluation</CardTitle>
            <CardDescription>Score each area from 1 (weak) to 5 (excellent), then add your notes.</CardDescription>
          </CardHeader>
          <CardContent>
            <EvaluationForm
              key={interview.id}
              api={api}
              interview={interview}
              onSaved={(updated) => setInterview((prev) => (prev ? { ...prev, ...updated } : updated))}
            />
          </CardContent>
        </Card>
      </div>

      {rescheduleOpen && (
        <RescheduleDialog
          api={api}
          interview={interview}
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          onRescheduled={() => {
            setNotice("Interview rescheduled.");
            void load();
          }}
        />
      )}
      {cancelOpen && (
        <CancelInterviewDialog
          api={api}
          interview={interview}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          onCancelled={() => {
            setNotice("Interview cancelled.");
            void load();
          }}
        />
      )}
    </div>
  );
}
