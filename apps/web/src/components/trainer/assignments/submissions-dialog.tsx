"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { fmtIst } from "@/components/trainer/assessments/types";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";
import type { AssignmentDetail } from "./types";

function GradeRow({ assignmentId, max, row, onSaved }: {
  assignmentId: string;
  max: number;
  row: AssignmentDetail["rows"][number];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState(row.marks === null ? "" : String(row.marks));
  const [feedback, setFeedback] = useState(row.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const m = Number(marks);
    if (marks.trim() === "" || !Number.isInteger(m) || m < 0 || m > max) return setError(`Marks must be a whole number between 0 and ${max}`);
    setSaving(true);
    setError(null);
    try {
      await trainerPost(`/assignments/${assignmentId}/grade`, { submission_id: row.submission_id, marks: m, feedback: feedback.trim() || null });
      setOpen(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const tone = row.status === "graded" ? "secondary" : row.status === "late" ? "destructive" : row.status === "pending" ? "outline" : "default";
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{row.trainee}</p>
          <p className="text-xs text-muted-foreground">{row.submitted_at ? `Submitted ${fmtIst(row.submitted_at)}` : "Not submitted"}</p>
        </div>
        <div className="flex items-center gap-2">
          {row.marks !== null && <span className="text-sm font-semibold">{row.marks}/{max}</span>}
          <Badge variant={tone} className="capitalize">{row.status}</Badge>
          {row.submission_id && <Button size="sm" variant={row.status === "graded" ? "outline" : "default"} onClick={() => setOpen((o) => !o)}>{open ? "Close" : row.status === "graded" ? "Regrade" : "Grade"}</Button>}
        </div>
      </div>
      {open && (
        <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
          {row.content && <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-2 text-sm">{row.content}</p>}
          {row.file_url && <a className="text-sm text-primary underline" href={row.file_url} target="_blank" rel="noreferrer noopener">Open attachment</a>}
          {!row.content && !row.file_url && <p className="text-xs text-muted-foreground">No content attached to this submission.</p>}
          <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
            <Input type="number" min={0} max={max} value={marks} onChange={(e) => setMarks(e.target.value)} aria-label={`Marks out of ${max}`} placeholder={`/ ${max}`} />
            <Textarea rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button size="sm" className="self-end" disabled={saving} onClick={() => void save()}>{saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}Save grade</Button>
        </div>
      )}
    </li>
  );
}

export function SubmissionsDialog({ assignmentId, onOpenChange, onChanged }: {
  assignmentId: string | null;
  onOpenChange: (o: boolean) => void;
  onChanged: () => void;
}) {
  const { data, loading, error, refetch } = useTrainerQuery<AssignmentDetail>(assignmentId ? `/assignments/${assignmentId}` : null);
  const [filter, setFilter] = useState<"all" | "to_grade" | "graded" | "pending">("all");
  const rows = (data?.rows ?? []).filter((r) => filter === "all" || (filter === "to_grade" ? r.status === "submitted" || r.status === "late" : r.status === filter));

  return (
    <Dialog open={assignmentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data?.assignment.title ?? "Submissions"}</DialogTitle>
          <DialogDescription>
            {data ? `${data.assignment.batch} · ${data.totals.submitted}/${data.totals.assigned} submitted · ${data.totals.graded} graded${data.totals.avg_marks !== null ? ` · avg ${data.totals.avg_marks}/${data.assignment.max_marks}` : ""}` : "Loading…"}
          </DialogDescription>
        </DialogHeader>
        {loading ? <LoadingBlock rows={4} /> : error ? <ErrorState message={error} onRetry={refetch} /> : data && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "to_grade", "graded", "pending"] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "to_grade" ? "To grade" : f === "graded" ? "Graded" : "Pending"}
                </Button>
              ))}
            </div>
            {data.assignment.resources.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Resources: {data.assignment.resources.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noreferrer noopener" className="mr-2 text-primary underline">{r.title}</a>)}
              </p>
            )}
            {rows.length === 0 ? <EmptyState title="No trainees match this filter" /> : (
              <ul className="flex flex-col gap-2">
                {rows.map((r) => <GradeRow key={r.trainee_id + (r.marks ?? "")} assignmentId={data.assignment.id} max={data.assignment.max_marks} row={r} onSaved={() => { refetch(); onChanged(); }} />)}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
