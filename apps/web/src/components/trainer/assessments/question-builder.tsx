"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilterSelect } from "@/components/trainer/filter-select";
import { TYPE_LABEL, type QuestionOption, type QuestionType } from "./types";

export interface DraftQuestion {
  key: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  /** option ids for MCQ, "true"/"false" for true_false, [rubric] for manual types */
  correct: string[];
  explanation: string;
  marks: number;
}

let seq = 0;
export const newKey = () => `q${Date.now().toString(36)}${++seq}`;

export function blankQuestion(type: QuestionType = "mcq_single"): DraftQuestion {
  return {
    key: newKey(),
    type,
    prompt: "",
    options: type === "mcq_single" || type === "mcq_multi" ? ["a", "b", "c", "d"].map((id) => ({ id, text: "" })) : [],
    correct: type === "true_false" ? ["true"] : [],
    explanation: "",
    marks: type === "short_answer" || type === "practical" ? 5 : 1,
  };
}

/** Returns an error message for the first invalid question, or null. */
export function validateQuestions(qs: DraftQuestion[]): string | null {
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const n = i + 1;
    if (!q.prompt.trim()) return `Question ${n}: enter the question text`;
    if (q.type === "mcq_single" || q.type === "mcq_multi") {
      if (q.options.filter((o) => o.text.trim()).length < 2) return `Question ${n}: add at least 2 options`;
      if (q.options.some((o) => !o.text.trim())) return `Question ${n}: fill in or remove empty options`;
      if (q.correct.length === 0) return `Question ${n}: mark the correct answer`;
    }
    if ((q.type === "short_answer" || q.type === "practical") && !(q.correct[0] ?? "").trim())
      return `Question ${n}: add an expected answer / rubric`;
    if (!Number.isInteger(q.marks) || q.marks < 1) return `Question ${n}: marks must be at least 1`;
  }
  return null;
}

export function toPayload(qs: DraftQuestion[]) {
  return qs.map((q) => ({
    type: q.type,
    prompt: q.prompt.trim(),
    options: q.type === "mcq_single" || q.type === "mcq_multi" ? q.options.map((o) => ({ id: o.id, text: o.text.trim() })) : undefined,
    correct: q.correct,
    explanation: q.explanation.trim() || undefined,
    marks: q.marks,
  }));
}

const TYPE_OPTIONS = (Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] }));

export function QuestionBuilder({ questions, onChange }: { questions: DraftQuestion[]; onChange: (q: DraftQuestion[]) => void }) {
  const update = (key: string, patch: Partial<DraftQuestion>) => onChange(questions.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const changeType = (q: DraftQuestion, type: QuestionType) => {
    const fresh = blankQuestion(type);
    update(q.key, { type, options: fresh.options, correct: fresh.correct, marks: fresh.marks });
  };

  const toggleCorrect = (q: DraftQuestion, id: string) => {
    if (q.type === "mcq_single") return update(q.key, { correct: [id] });
    update(q.key, { correct: q.correct.includes(id) ? q.correct.filter((c) => c !== id) : [...q.correct, id] });
  };

  const addOption = (q: DraftQuestion) => {
    const used = new Set(q.options.map((o) => o.id));
    const id = "abcdefghijkl".split("").find((c) => !used.has(c));
    if (id) update(q.key, { options: [...q.options, { id, text: "" }] });
  };

  const removeOption = (q: DraftQuestion, id: string) =>
    update(q.key, { options: q.options.filter((o) => o.id !== id), correct: q.correct.filter((c) => c !== id) });

  return (
    <div className="flex flex-col gap-4">
      {questions.length === 0 && <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No questions yet. Add one below or use the AI assistant.</p>}
      {questions.map((q, i) => (
        <div key={q.key} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <span className="text-sm font-semibold">Question {i + 1}</span>
            <div className="flex items-end gap-3">
              <FilterSelect label="Type" value={q.type} onChange={(v) => changeType(q, v as QuestionType)} options={TYPE_OPTIONS} />
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Marks
                <Input type="number" min={1} max={100} value={q.marks} className="h-9 w-20"
                  onChange={(e) => update(q.key, { marks: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
              </label>
              <Button type="button" size="icon" variant="ghost" aria-label={`Remove question ${i + 1}`} onClick={() => onChange(questions.filter((x) => x.key !== q.key))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <Textarea value={q.prompt} onChange={(e) => update(q.key, { prompt: e.target.value })} placeholder="Question text" rows={2} />

          {(q.type === "mcq_single" || q.type === "mcq_multi") && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Options — tick the correct {q.type === "mcq_single" ? "answer" : "answers"}
              </Label>
              {q.options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    type={q.type === "mcq_single" ? "radio" : "checkbox"}
                    name={`correct-${q.key}`}
                    checked={q.correct.includes(o.id)}
                    onChange={() => toggleCorrect(q, o.id)}
                    aria-label={`Option ${o.id} is correct`}
                    className="size-4 accent-[#16A34A]"
                  />
                  <span className="w-5 text-sm font-medium uppercase text-muted-foreground">{o.id}</span>
                  <Input value={o.text} placeholder={`Option ${o.id.toUpperCase()}`}
                    onChange={(e) => update(q.key, { options: q.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })} />
                  {q.options.length > 2 && (
                    <Button type="button" size="icon" variant="ghost" aria-label={`Remove option ${o.id}`} onClick={() => removeOption(q, o.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {q.options.length < 8 && (
                <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => addOption(q)}>
                  <Plus className="mr-1 size-4" /> Add option
                </Button>
              )}
            </div>
          )}

          {q.type === "true_false" && (
            <FilterSelect label="Correct answer" value={q.correct[0] ?? "true"} onChange={(v) => update(q.key, { correct: [v] })}
              options={[{ value: "true", label: "True" }, { value: "false", label: "False" }]} />
          )}

          {(q.type === "short_answer" || q.type === "practical") && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Expected answer / grading rubric (visible to you only)</Label>
              <Textarea value={q.correct[0] ?? ""} rows={2} placeholder="What a full-marks answer includes"
                onChange={(e) => update(q.key, { correct: [e.target.value] })} />
              <p className="text-xs text-muted-foreground">This question is graded manually after submission.</p>
            </div>
          )}

          <Textarea value={q.explanation} onChange={(e) => update(q.key, { explanation: e.target.value })} rows={1} placeholder="Explanation (optional)" />
        </div>
      ))}
      <Button type="button" variant="outline" className="self-start" onClick={() => onChange([...questions, blankQuestion()])}>
        <Plus className="mr-1.5 size-4" /> Add Question
      </Button>
    </div>
  );
}
