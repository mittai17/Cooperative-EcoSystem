"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/trainer/states";
import { fmtIst, TYPE_LABEL, type AttemptDetail } from "@/components/trainer/assessments/types";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";

type Draft = { marks: string; feedback: string };

const REASON = "The response for this attempt is incomplete or malformed, so it cannot be graded here.";

function isRenderableAttempt(value: AttemptDetail | null): value is AttemptDetail {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AttemptDetail>;
  if (!Array.isArray(candidate.questions) || candidate.questions.length === 0) return false;
  if (!candidate.attempt || typeof candidate.attempt !== "object") return false;
  if (!candidate.trainee || typeof candidate.trainee.name !== "string") return false;
  if (!candidate.assessment || typeof candidate.assessment.title !== "string") return false;
  return candidate.questions.every(
    (q) =>
      q &&
      typeof q.id === "string" &&
      typeof q.position === "number" &&
      typeof q.max_marks === "number" &&
      Array.isArray(q.expected) &&
      q.expected.every((v) => typeof v === "string"),
  );
}

function answerText(q: AttemptDetail["questions"][number], value: unknown): string {
  if (value === undefined || value === null || value === "") return "No answer";
  const arr = Array.isArray(value) ? value : [value];
  if (q.options?.length) return arr.map((id) => q.options?.find((o) => o.id === String(id))?.text ?? String(id)).join(", ");
  return arr.join(", ");
}

export default function ReviewAttemptPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const { data, loading, error, refetch } = useTrainerQuery<AttemptDetail>(`/assessments/${id}/attempts/${attemptId}`);
  if (loading) return <div className="flex flex-col gap-4"><Skeleton className="h-10 w-64" />{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;
  if (!isRenderableAttempt(data)) return <ErrorState message={REASON} onRetry={refetch} />;
  return <ReviewBody id={id} attemptId={attemptId} data={data} refetch={refetch} />;
}

function ReviewBody({ id, attemptId, data, refetch }: { id: string; attemptId: string; data: AttemptDetail; refetch: () => void }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const d: Record<string, Draft> = {};
    data.questions.filter((q) => !q.auto_graded).forEach((q) => {
      d[q.id] = { marks: q.manual_grade ? String(q.manual_grade.marks) : "", feedback: q.manual_grade?.feedback ?? "" };
    });
    return d;
  });
  const [overall, setOverall] = useState(data.overall_feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const manual = data.questions.filter((q) => !q.auto_graded);

  async function save() {
    setSaveError(null);
    setSaved(null);
    const grades = [];
    for (const q of manual) {
      const d = drafts[q.id];
      if (!d || d.marks.trim() === "") continue;
      const m = Number(d.marks);
      if (!Number.isInteger(m) || m < 0 || m > q.max_marks) return setSaveError(`Question ${q.position}: marks must be a whole number between 0 and ${q.max_marks}`);
      grades.push({ question_id: q.id, marks: m, feedback: d.feedback.trim() || null });
    }
    if (grades.length === 0) return setSaveError("Enter marks for at least one question");
    setSaving(true);
    try {
      const r = await trainerPost<{ score: number; result: string; fully_graded: boolean }>(`/assessments/${id}/grade`, {
        attempt_id: attemptId, grades, overall_feedback: overall.trim() || null,
      });
      setSaved(r.fully_graded ? `Evaluation saved. Final score ${r.score}% (${r.result}). Skill Passport updated.` : `Partially saved. Score so far ${r.score}%; grade the remaining questions to finalise.`);
      refetch();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const { attempt } = data;
  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" render={<Link href={`/trainer/assessments/${id}`}><ArrowLeft className="mr-1.5 size-4" />Back to results</Link>} />
      <PageHeader
        title={`${data.trainee.name} — ${data.assessment.title}`}
        description={`Attempt ${attempt.attempt_no} · submitted ${fmtIst(attempt.submitted_at)} · score ${attempt.score ?? "—"}% (pass at ${data.assessment.passing_score}%)`}
        action={<Badge variant={attempt.result === "Needs Review" ? "outline" : "secondary"}>{attempt.result}</Badge>}
      />
      <div className="flex flex-col gap-4">
        {data.questions.map((q) => {
          const d = drafts[q.id];
          return (
            <section key={q.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{q.position}. {q.prompt}</p>
                <Badge variant="outline" className="shrink-0">{TYPE_LABEL[q.type]} · {q.max_marks} mark{q.max_marks > 1 ? "s" : ""}</Badge>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Trainee answer</p>
                <p className="mt-0.5 whitespace-pre-wrap">{answerText(q, q.trainee_answer)}</p>
              </div>
              {q.auto_graded ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {q.auto_marks && q.auto_marks > 0 ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}
                  <span>Auto-graded: {q.auto_marks}/{q.max_marks}</span>
                  <span className="text-muted-foreground">Correct: {answerText(q, q.expected)}</span>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-dashed border-border p-3 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">Expected answer / rubric</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{q.expected.join("\n") || "—"}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`m-${q.id}`}>Marks (0–{q.max_marks})</Label>
                      <Input id={`m-${q.id}`} type="number" min={0} max={q.max_marks} value={d?.marks ?? ""}
                        onChange={(e) => setDrafts((s) => ({ ...s, [q.id]: { ...(s[q.id] ?? { feedback: "" }), marks: e.target.value } }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`f-${q.id}`}>Feedback</Label>
                      <Textarea id={`f-${q.id}`} rows={2} value={d?.feedback ?? ""} placeholder="Feedback shown to the trainee"
                        onChange={(e) => setDrafts((s) => ({ ...s, [q.id]: { ...(s[q.id] ?? { marks: "" }), feedback: e.target.value } }))} />
                    </div>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>
      {manual.length > 0 ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <Label htmlFor="overall">Overall feedback</Label>
          <Textarea id="overall" rows={3} value={overall} onChange={(e) => setOverall(e.target.value)} />
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
          {saved && <p role="status" className="text-sm text-success">{saved}</p>}
          <div className="flex justify-end">
            <Button onClick={() => void save()} disabled={saving}>{saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}Save Evaluation</Button>
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">All questions in this assessment are auto-graded; nothing to evaluate manually.</p>
      )}
    </div>
  );
}
