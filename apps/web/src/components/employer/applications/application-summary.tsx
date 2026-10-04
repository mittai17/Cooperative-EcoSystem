import Link from "next/link";
import { CalendarPlus, FileSignature, Check, UserRound, X, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate, type EmployerApplicationDetail } from "@/lib/employer/candidates-api";
import { CandidateAvatar } from "@/components/employer/candidates/candidate-avatar";
import { MatchScoreRing } from "@/components/employer/matching/match-score-ring";
import { stageActions, stageLabel, stageTone } from "./pipeline-stages";
import { cn } from "@/lib/utils";

interface ApplicationSummaryProps {
  application: EmployerApplicationDetail;
  busy: boolean;
  onShortlist: () => void;
  onReject: () => void;
}

export function ApplicationSummary({ application, busy, onShortlist, onReject }: ApplicationSummaryProps) {
  const actions = stageActions(application.status);
  const jobId = application.job?.id ?? application.job_id ?? "";
  const profileHref = `/employer/candidates/${application.trainee_id}${jobId ? `?job=${encodeURIComponent(jobId)}` : ""}`;
  return (
    <header className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
      <Link href="/employer/applications" className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit" })}>
        <ArrowLeft /> Back to pipeline
      </Link>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <CandidateAvatar name={application.name} photoUrl={application.photo_url} className="size-16 text-lg" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{application.name}</h2>
              <Badge className={cn("hover:bg-transparent", stageTone(application.status))}>{stageLabel(application.status)}</Badge>
            </div>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Applied for: </span>
              {application.job?.title ?? application.job_title ?? "Not available"}
            </p>
            <p className="text-xs text-muted-foreground">
              Applied {formatDate(application.applied_at)}
              {application.updated_at ? ` · Last updated ${formatDate(application.updated_at)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          {application.match_score !== null ? (
            <MatchScoreRing score={application.match_score} size={84} />
          ) : (
            <p className="text-xs text-muted-foreground">Match score not available</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={!actions.shortlist || busy} onClick={onShortlist}>
              <Check /> Shortlist
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" disabled={!actions.reject || busy} onClick={onReject}>
              <X /> Reject
            </Button>
            {actions.schedule ? (
              <Link href={`/employer/interviews/new?application=${application.id}`} className={buttonVariants({ size: "sm" })}>
                <CalendarPlus /> Schedule Interview
              </Link>
            ) : (
              <Button size="sm" disabled>
                <CalendarPlus /> Schedule Interview
              </Button>
            )}
            {actions.offer ? (
              <Link href={`/employer/offers/new?application=${application.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <FileSignature /> Make Offer
              </Link>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                <FileSignature /> Make Offer
              </Button>
            )}
            <Link href={profileHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <UserRound /> Candidate profile
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
