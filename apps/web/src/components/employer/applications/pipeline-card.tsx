"use client";

import Link from "next/link";
import { CalendarClock, CalendarPlus, FileSignature, ShieldCheck, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate, type EmployerApplication } from "@/lib/employer/candidates-api";
import { CandidateAvatar, scoreChipClass } from "@/components/employer/candidates/candidate-avatar";
import { cn } from "@/lib/utils";
import { stageActions } from "./pipeline-stages";

interface PipelineCardProps {
  application: EmployerApplication;
  busy: boolean;
  onMove: (application: EmployerApplication, status: string) => void;
}

/** One candidate on the hiring board. Interview and offer actions link out to their own pages. */
export function PipelineCard({ application, busy, onMove }: PipelineCardProps) {
  const actions = stageActions(application.status);
  const matched = application.matched_skills.map((item) => item.skill);
  const missing = application.missing_skills.map((item) => item.skill);
  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <CandidateAvatar name={application.name} photoUrl={application.photo_url} className="size-9 text-xs" />
        <div className="min-w-0 flex-1">
          <Link href={`/employer/applications/${application.id}`} className="block truncate text-sm font-semibold text-foreground hover:text-primary hover:underline">
            {application.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{application.role ?? application.job_title ?? "Role not set"}</p>
        </div>
        {application.match_score !== null && (
          <span className={cn("shrink-0 rounded-4xl px-1.5 py-0.5 font-mono text-[11px] font-semibold", scoreChipClass(application.match_score))}>
            {application.match_score}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3" /> Applied {formatDate(application.applied_at)}
        </span>
        {application.verified_skill_count > 0 && (
          <span className="inline-flex items-center gap-1 text-success">
            <ShieldCheck className="size-3" /> {application.verified_skill_count} verified
          </span>
        )}
      </div>

      {(matched.length > 0 || missing.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {matched.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-[10px]">{skill}</Badge>
          ))}
          {missing.slice(0, 2).map((skill) => (
            <Badge key={skill} variant="outline" className="border-warning/40 text-[10px] text-warning">Missing: {skill}</Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
        {actions.shortlist && (
          <Button size="sm" className="h-7 px-2 text-xs" disabled={busy} onClick={() => onMove(application, "shortlisted")}>
            <Check /> Shortlist
          </Button>
        )}
        {actions.schedule && (
          <Link href={`/employer/interviews/new?application=${application.id}`} className={buttonVariants({ size: "sm", className: "h-7 px-2 text-xs" })}>
            <CalendarPlus /> Schedule
          </Link>
        )}
        {actions.offer && (
          <Link href={`/employer/offers/new?application=${application.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2 text-xs" })}>
            <FileSignature /> Offer
          </Link>
        )}
        {actions.reject && (
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" disabled={busy} onClick={() => onMove(application, "rejected")}>
            <X /> Reject
          </Button>
        )}
      </div>
    </article>
  );
}
