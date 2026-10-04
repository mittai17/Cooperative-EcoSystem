"use client";

import { Suspense, use, useState } from "react";
import { AlertCircle, CalendarClock, CircleAlert, History, MessageSquare, ShieldCheck, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationSummary } from "@/components/employer/applications/application-summary";
import { ApplicationNotes } from "@/components/employer/applications/application-notes";
import { stageLabel } from "@/components/employer/applications/pipeline-stages";
import { CertificateList } from "@/components/employer/candidates/certificate-list";
import { useResource } from "@/components/employer/candidates/use-resource";
import { FactRow } from "@/components/employer/candidates/profile-panels";
import {
  type ApplicationHistoryEvent,
  type EmployerApplicationDetail,
  errorMessage,
  formatDate,
  getApplication,
  updateApplicationStatus,
} from "@/lib/employer/candidates-api";
import { useApi } from "@/lib/use-api";

function SectionCard({ title, icon: Icon, children }: { title: string; icon?: typeof History; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="size-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function HistoryList({ events }: { events: ApplicationHistoryEvent[] | undefined }) {
  if (!events) return <p className="text-sm text-muted-foreground">History is not available for this application.</p>;
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {events.map((event, index) => (
        <li key={`${event.at}-${index}`} className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{stageLabel(event.status)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(event.at)}
              {event.by ? ` · ${event.by}` : ""}
            </p>
            {event.note && <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function InterviewList({ items }: { items: EmployerApplicationDetail["interviews"] | undefined }) {
  if (!items) return <p className="text-sm text-muted-foreground">Interview history is not available for this application.</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No interviews scheduled for this application yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((interview) => (
        <li key={interview.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
          <div className="text-sm">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <CalendarClock className="size-3.5 text-muted-foreground" />
              {formatDate(interview.scheduled_at)}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Video className="size-3" /> {interview.mode ?? "Mode not available"}
              {interview.interviewer_name ? ` · ${interview.interviewer_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {typeof interview.overall_rating === "number" && (
              <Badge variant="outline">{interview.overall_rating}/5</Badge>
            )}
            <Badge variant="secondary" className="capitalize">{interview.decision ?? interview.status}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ApplicationDetailContent({ id }: { id: string }) {
  const api = useApi();
  const application = useResource(() => getApplication(api, id), [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function changeStatus(status: string, confirmText?: string) {
    const data = application.data;
    if (!data) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateApplicationStatus(api, data.id, { status });
      setNotice(`${data.name} moved to ${stageLabel(status)}.`);
      application.reload();
    } catch (err) {
      setActionError(errorMessage(err, "Could not update this application."));
    } finally {
      setBusy(false);
    }
  }

  if (application.loading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (application.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>This application could not be loaded</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{application.error}</span>
          <Button variant="outline" size="sm" className="w-fit" onClick={application.reload}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const data = application.data;
  if (!data) return null;

  const matched = data.matched_skills.map((item) => item.skill);
  const missing = data.missing_skills.map((item) => item.skill);

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-foreground">{notice}</p>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <ApplicationSummary
        application={data}
        busy={busy}
        onShortlist={() => changeStatus("shortlisted")}
        onReject={() => changeStatus("rejected", `Reject ${data.name}? The candidate will be notified.`)}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-6">
          <SectionCard title="Candidate and job">
            <dl>
              <FactRow label="Candidate" value={data.name} />
              <FactRow label="Contact" value={data.candidate_email ?? "Shared after the candidate applies"} />
              <FactRow label="Role" value={data.role} />
              <FactRow label="Location" value={data.location} />
              <FactRow label="Education" value={data.education_level} />
              <FactRow label="Posting" value={data.job?.title ?? data.job_title} />
              <FactRow label="Applied on" value={formatDate(data.applied_at)} />
            </dl>
          </SectionCard>

          <SectionCard title="Skills against this posting" icon={ShieldCheck}>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matched</p>
                {matched.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matched skills returned.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {data.matched_skills.map((item) => (
                      <Badge key={item.skill} variant="outline" className="gap-1 border-success/30 text-[11px] text-success">
                        {item.skill}
                        {typeof item.confidence === "number" ? ` · ${Math.round(item.confidence)}%` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing</p>
                {missing.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No gaps against required skills.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((skill) => (
                      <Badge key={skill} variant="outline" className="gap-1 border-warning/40 text-[11px] text-warning">
                        <CircleAlert className="size-3" /> {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{data.verified_skill_count} verified skill{data.verified_skill_count === 1 ? "" : "s"} on the Skill Passport.</p>
            </div>
          </SectionCard>

          <SectionCard title="Certificates">
            <CertificateList certificates={data.certificates ?? []} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard title="Recruiter notes">
            <ApplicationNotes application={data} onSaved={() => { setNotice("Note saved."); application.reload(); }} onError={setActionError} />
          </SectionCard>

          <SectionCard title="Interview history" icon={MessageSquare}>
            <InterviewList items={data.interviews} />
          </SectionCard>

          <SectionCard title="Application history" icon={History}>
            <HistoryList events={data.history} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<Skeleton className="h-44 w-full" />}>
      <ApplicationDetailContent id={id} />
    </Suspense>
  );
}
