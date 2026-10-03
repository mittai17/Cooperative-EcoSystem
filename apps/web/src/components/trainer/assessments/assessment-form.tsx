"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { AiAssistantPanel, type GeneratedQuestion } from "@/components/trainer/ai-assistant";
import { trainerPost, trainerPut, useTrainerQuery } from "@/lib/trainer/api";
import { blankQuestion, newKey, QuestionBuilder, toPayload, validateQuestions, type DraftQuestion } from "./question-builder";
import { toIstInput, type AssessmentDetail, type ClassOption } from "./types";

export function AssessmentForm({ draftId }: { draftId?: string }) {
  const opts = useTrainerQuery<{ classes: ClassOption[] }>("/assessments/options");
  const draft = useTrainerQuery<AssessmentDetail>(draftId ? `/assessments/${draftId}` : null);
  if (opts.loading || (draftId && draft.loading)) return <LoadingBlock rows={5} />;
  if (opts.error) return <ErrorState message={opts.error} onRetry={opts.refetch} />;
  if (draftId && draft.error) return <ErrorState message={draft.error} onRetry={draft.refetch} />;
  if (draftId && draft.data && draft.data.assessment.status !== "draft")
    return <EmptyState title="Only drafts can be edited" hint="This assessment is already published." />;
  const classes = opts.data?.classes ?? [];
  if (classes.length === 0) return <EmptyState title="No classes assigned" hint="You need a batch and course assigned to create an assessment." />;
  return <AssessmentFormBody draftId={draftId} classes={classes} initial={draft.data?.assessment ?? null} />;
}

function AssessmentFormBody({ draftId, classes, initial }: { draftId?: string; classes: ClassOption[]; initial: AssessmentDetail["assessment"] | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [classKey, setClassKey] = useState(initial ? `${initial.batch_id}|${initial.course_id}` : ""); // batch_id|course_id
  const [module, setModule] = useState(initial?.module ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 30);
  const [passing, setPassing] = useState(initial?.passing_score ?? 50);
  const [scheduled, setScheduled] = useState(toIstInput(initial?.scheduled_at));
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    (initial?.questions ?? []).map((q) => ({
      key: newKey(), type: q.type, prompt: q.prompt, options: q.options ?? [], correct: q.correct ?? [],
      explanation: q.explanation ?? "", marks: q.marks,
    }))
  );
  const [saving, setSaving] = useState<"draft" | "published" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [batchId, courseId] = classKey.split("|");
  const courseName = classes.find((c) => c.course_id === courseId)?.course;

  function addGenerated(qs: GeneratedQuestion[]) {
    setQuestions((cur) => [
      ...cur,
      ...qs.map((g) => ({
        ...blankQuestion(g.type),
        prompt: g.prompt,
        options: g.type === "mcq_single" ? (g.options ?? []) : [],
        correct: g.type === "true_false" ? [String(g.correct[0]).toLowerCase()] : g.type === "short_answer" ? [g.correct.join("; ")] : g.correct,
        explanation: g.explanation ?? "",
      })),
    ]);
  }

  async function submit(status: "draft" | "published") {
    setError(null);
    if (!title.trim()) return setError("Enter a title");
    if (!batchId || !courseId) return setError("Choose a batch and course");
    if (status === "published" && questions.length === 0) return setError("Add at least one question before publishing");
    const qErr = validateQuestions(questions);
    if (qErr) return setError(qErr);
    const body = {
      title: title.trim(), course_id: courseId, batch_id: batchId, module_title: module.trim() || null,
      description: description.trim() || null, instructions: instructions.trim() || null,
      duration_minutes: duration, passing_score: passing, scheduled_at: scheduled || null, status,
      questions: toPayload(questions),
    };
    setSaving(status);
    try {
      if (draftId) await trainerPut(`/assessments/${draftId}`, body);
      else await trainerPost("/assessments", body);
      router.push("/trainer/assessments");
    } catch (e) {
      setError((e as Error).message);
      setSaving(null);
    }
  }

  const card = "rounded-2xl border border-border/60 bg-card p-5 shadow-sm";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={draftId ? "Edit assessment draft" : "Create assessment"} description="Define details, build the questions, then save as a draft or publish to the batch." />
      <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); void submit("published"); }}>
        <section className={`${card} grid gap-4 md:grid-cols-2`}>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="a-title">Title</Label>
            <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} placeholder="e.g. Cooperative Accounting — Module 5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Batch and course</Label>
            <select value={classKey} onChange={(e) => setClassKey(e.target.value)} aria-label="Batch and course"
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <option value="">Select batch · course</option>
              {classes.map((c) => (
                <option key={`${c.batch_id}|${c.course_id}`} value={`${c.batch_id}|${c.course_id}`}>{c.batch} · {c.course}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-module">Module</Label>
            <Input id="a-module" value={module} onChange={(e) => setModule(e.target.value)} placeholder="e.g. Module 5" maxLength={255} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="a-desc">Description</Label>
            <Textarea id="a-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="a-ins">Instructions for trainees</Label>
            <Textarea id="a-ins" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-dur">Duration (minutes)</Label>
            <Input id="a-dur" type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-pass">Passing score (%)</Label>
            <Input id="a-pass" type="number" min={0} max={100} value={passing} onChange={(e) => setPassing(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-sched">Schedule (IST)</Label>
            <Input id="a-sched" type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-4 font-heading text-lg font-semibold">Questions ({questions.length})</h2>
          <QuestionBuilder questions={questions} onChange={setQuestions} />
        </section>

        <AiAssistantPanel course={courseName} courseId={courseId || undefined} batchId={batchId || undefined} onAddQuestions={addGenerated} />

        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/trainer/assessments")} disabled={saving !== null}>Cancel</Button>
          <Button type="button" variant="outline" disabled={saving !== null} onClick={() => void submit("draft")}>
            {saving === "draft" && <Loader2 className="mr-1.5 size-4 animate-spin" />}Save Draft
          </Button>
          <Button type="submit" disabled={saving !== null}>
            {saving === "published" && <Loader2 className="mr-1.5 size-4 animate-spin" />}Publish
          </Button>
        </div>
      </form>
    </div>
  );
}
