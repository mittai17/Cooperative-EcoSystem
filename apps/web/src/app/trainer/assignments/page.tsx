"use client";

import { useState } from "react";
import { CalendarClock, ClipboardCheck, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/trainer/states";
import { fmtIst, type ClassOption } from "@/components/trainer/assessments/types";
import { CreateAssignmentDialog } from "@/components/trainer/assignments/create-assignment-dialog";
import { SubmissionsDialog } from "@/components/trainer/assignments/submissions-dialog";
import type { AssignmentItem } from "@/components/trainer/assignments/types";
import { useTrainerQuery } from "@/lib/trainer/api";

export default function TrainerAssignmentsPage() {
  const { data, loading, error, refetch } = useTrainerQuery<{ assignments: AssignmentItem[] }>("/assignments");
  const opts = useTrainerQuery<{ classes: ClassOption[] }>("/assignments/options");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const list = data?.assignments ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Set work for your batches, track submissions and grade them."
        action={<Button onClick={() => setCreating(true)} disabled={(opts.data?.classes.length ?? 0) === 0}><Plus className="mr-1.5 size-4" />Create Assignment</Button>}
      />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : list.length === 0 ? (
        <EmptyState title="No assignments yet" hint="Create one to assign work to a batch." icon={ClipboardCheck} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <div key={a.id} className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-base font-semibold">{a.title}</h3>
                  <p className="truncate text-sm text-muted-foreground">{a.course ?? "—"}</p>
                </div>
                <Badge variant={a.status === "draft" ? "outline" : a.overdue ? "secondary" : "default"}>
                  {a.status === "draft" ? "Draft" : a.overdue ? "Closed" : "Open"}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="size-4" />{a.batch ?? "—"} · {a.assigned} trainees</span>
                <span className="flex items-center gap-1.5"><CalendarClock className="size-4" />Due {fmtIst(a.deadline)}</span>
              </div>
              <div>
                <Progress value={a.assigned ? (a.submitted / a.assigned) * 100 : 0} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div><p className="font-heading text-lg font-bold">{a.submitted}</p><p className="text-xs text-muted-foreground">Submitted</p></div>
                  <div><p className="font-heading text-lg font-bold">{a.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                  <div><p className="font-heading text-lg font-bold text-success">{a.graded}</p><p className="text-xs text-muted-foreground">Graded</p></div>
                </div>
              </div>
              <Button className="mt-auto" variant={a.to_grade > 0 ? "default" : "outline"} onClick={() => setViewing(a.id)}>
                View submissions{a.to_grade > 0 ? ` · ${a.to_grade} to grade` : ""}
              </Button>
            </div>
          ))}
        </div>
      )}
      <CreateAssignmentDialog open={creating} onOpenChange={setCreating} classes={opts.data?.classes ?? []} onCreated={refetch} />
      <SubmissionsDialog assignmentId={viewing} onOpenChange={(o) => !o && setViewing(null)} onChanged={refetch} />
    </div>
  );
}
