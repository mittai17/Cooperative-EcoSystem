"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, ExternalLink, Eye, MapPin, RefreshCw, Trash2, UserRound, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Api, Interview } from "@/lib/employer/workflow-api";
import { formatDate, formatTime } from "@/lib/employer/workflow-format";
import { CancelInterviewDialog } from "./cancel-interview-dialog";
import { RescheduleDialog } from "./reschedule-dialog";
import { InterviewStatusBadge } from "./interview-status";

interface InterviewCardProps {
  api: Api;
  interview: Interview;
  onChanged: () => void;
}

export function InterviewCard({ api, interview, onChanged }: InterviewCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const isOnline = interview.mode === "online";
  const canAct = interview.status === "scheduled";
  const hasLink = isOnline && !!interview.meeting_link;
  const day = new Date(interview.scheduled_at);

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4 lg:w-56 lg:shrink-0">
          <div className="flex size-14 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="font-heading text-lg font-bold leading-none">{day.getDate()}</span>
            <span className="text-[11px] uppercase tracking-wide">
              {day.toLocaleDateString("en-IN", { month: "short" })}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{formatTime(interview.scheduled_at)}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(interview.scheduled_at)} · {interview.duration_minutes} min
            </p>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <p className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium text-foreground">{interview.candidate_name}</span>
          </p>
          <p className="min-w-0 truncate text-muted-foreground">{interview.job_title}</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            {isOnline ? <Video className="size-4" /> : <MapPin className="size-4" />}
            {isOnline ? "Online" : "On-site"}
          </p>
          <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" />
            <span className="truncate">{interview.interviewer_name || "Interviewer not set"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          <InterviewStatusBadge status={interview.status} />
          {canAct &&
            (hasLink ? (
              <Button size="sm" render={<a href={interview.meeting_link ?? undefined} target="_blank" rel="noopener noreferrer" />}>
                <ExternalLink />
                Join
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled title={isOnline ? "No meeting link saved" : "On-site interview"}>
                <ExternalLink />
                Join
              </Button>
            ))}
          <Button size="sm" variant="outline" render={<Link href={`/employer/interviews/${interview.id}`} />}>
            <Eye />
            View
          </Button>
          {canAct && (
            <>
              <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)}>
                <RefreshCw />
                Reschedule
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}>
                <Trash2 />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>

      {rescheduleOpen && (
        <RescheduleDialog
          api={api}
          interview={interview}
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          onRescheduled={onChanged}
        />
      )}
      {cancelOpen && (
        <CancelInterviewDialog
          api={api}
          interview={interview}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          onCancelled={onChanged}
        />
      )}
    </Card>
  );
}
