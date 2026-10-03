import Link from "next/link";
import { CalendarClock, ClipboardList, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtIst, type AssessmentListItem } from "./types";

const GROUP_LABEL = { upcoming: "Upcoming", drafts: "Draft", published: "Published", completed: "Completed" } as const;

export function AssessmentCard({ a, onPublish, busy }: { a: AssessmentListItem; onPublish?: (id: string) => void; busy?: boolean }) {
  const isDraft = a.status === "draft";
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold">{a.title}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {a.course ?? "—"}
            {a.module ? ` · ${a.module}` : ""}
          </p>
        </div>
        <Badge variant={isDraft ? "outline" : a.group === "completed" ? "secondary" : "default"}>{GROUP_LABEL[a.group]}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-4" /> {a.batch ?? "—"}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ClipboardList className="size-4" /> {a.questions} questions
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4" /> {a.duration_minutes} min
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarClock className="size-4" /> {fmtIst(a.scheduled_at)}
        </div>
      </dl>
      {!isDraft && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center">
          <div>
            <p className="font-heading text-lg font-bold">
              {a.submitted}/{a.total}
            </p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <div>
            <p className="font-heading text-lg font-bold">{a.avg_score === null ? "—" : `${a.avg_score}%`}</p>
            <p className="text-xs text-muted-foreground">Avg score</p>
          </div>
          <div>
            <p className={`font-heading text-lg font-bold ${a.needs_review ? "text-warning" : ""}`}>{a.needs_review}</p>
            <p className="text-xs text-muted-foreground">To review</p>
          </div>
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {isDraft ? (
          <>
            <Button size="sm" variant="outline" render={<Link href={`/trainer/assessments/new?draft=${a.id}`}>Edit draft</Link>} />
            <Button size="sm" disabled={busy || a.questions === 0} onClick={() => onPublish?.(a.id)}>
              {busy ? "Publishing…" : "Publish"}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" render={<Link href={`/trainer/assessments/${a.id}`}>View results</Link>} />
        )}
      </div>
    </div>
  );
}
