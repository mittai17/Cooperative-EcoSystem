"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trainerPost } from "@/lib/trainer/api";

export type GeneratedQuestion = {
  type: "mcq_single" | "true_false" | "short_answer";
  prompt: string;
  options?: { id: string; text: string }[];
  correct: string[];
  explanation?: string;
};

type Task = "quiz" | "lesson_plan" | "explain" | "activities" | "struggling_summary" | "course_summary";
type Section = { heading: string; body: string };
type Item = GeneratedQuestion & { key: string; editing: boolean; busy?: boolean };
type SectionItem = Section & { key: string; editing: boolean };
type Result = { source: "gemini" | "fallback"; title: string; questions?: GeneratedQuestion[]; sections?: Section[] };

const TASKS: { value: Task; label: string }[] = [
  { value: "quiz", label: "Quiz questions" },
  { value: "lesson_plan", label: "Lesson plan" },
  { value: "explain", label: "Explain a concept" },
  { value: "activities", label: "Class activities" },
  { value: "struggling_summary", label: "Struggling trainees summary" },
  { value: "course_summary", label: "Class summary" },
];

const CHIPS: { text: string; task: Task }[] = [
  { text: "Create 5 MCQs for Cooperative Governance", task: "quiz" },
  { text: "Lesson plan for Module 3", task: "lesson_plan" },
  { text: "Summarise struggling trainees", task: "struggling_summary" },
  { text: "Class activities on member rights", task: "activities" },
];

const METRIC_TASKS: Task[] = ["struggling_summary", "course_summary"];
const TYPE_LABEL = { mcq_single: "Multiple choice", true_false: "True / False", short_answer: "Short answer" } as const;
let seq = 0;
const nextKey = () => `k${++seq}`;

function questionsToText(qs: GeneratedQuestion[]): string {
  return qs
    .map((q, i) => {
      const opts = q.options?.map((o) => `   ${o.id}) ${o.text}`).join("\n");
      return `${i + 1}. ${q.prompt}\n${opts ? opts + "\n" : ""}   Answer: ${q.correct.join(", ")}${q.explanation ? `\n   Explanation: ${q.explanation}` : ""}`;
    })
    .join("\n\n");
}

export function AiAssistantPanel(props: {
  course?: string;
  onAddQuestions?: (qs: GeneratedQuestion[]) => void;
  courseId?: string;
  batchId?: string;
}) {
  const { course, onAddQuestions, courseId, batchId } = props;
  const [task, setTask] = useState<Task>("quiz");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<"gemini" | "fallback" | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  const call = (extra: Record<string, unknown> = {}) =>
    trainerPost<Result>("/ai/assist", {
      task,
      prompt: prompt.trim() || (course ? `${TASKS.find((t) => t.value === task)?.label} for ${course}` : ""),
      course_id: courseId || undefined,
      batch_id: batchId || undefined,
      count,
      ...extra,
    });

  async function generate() {
    if (!METRIC_TASKS.includes(task) && !prompt.trim() && !course) {
      setError("Describe what you want to generate, or pick one of the suggestions.");
      return;
    }
    setLoading(true);
    setError(null);
    setAdded(false);
    try {
      const r = await call({ question_types: task === "quiz" ? ["mcq_single"] : undefined });
      setTitle(r.title);
      setSource(r.source);
      setItems((r.questions ?? []).map((q) => ({ ...q, key: nextKey(), editing: false })));
      setSections((r.sections ?? []).map((s) => ({ ...s, key: nextKey(), editing: false })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(key: string) {
    const cur = items.find((i) => i.key === key);
    if (!cur) return;
    setItems((p) => p.map((i) => (i.key === key ? { ...i, busy: true } : i)));
    try {
      const r = await call({ count: 1, question_types: [cur.type], exclude: items.map((i) => i.prompt) });
      const q = r.questions?.[0];
      if (!q) throw new Error("No alternative question available");
      setItems((p) => p.map((i) => (i.key === key ? { ...q, key, editing: false } : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
      setItems((p) => p.map((i) => (i.key === key ? { ...i, busy: false } : i)));
    }
  }

  const patch = (key: string, fn: (i: Item) => Partial<Item>) =>
    setItems((p) => p.map((i) => (i.key === key ? { ...i, ...fn(i) } : i)));

  const plain = (): GeneratedQuestion[] =>
    items.map(({ key: _k, editing: _e, busy: _b, ...q }) => q); // eslint-disable-line @typescript-eslint/no-unused-vars

  async function copy() {
    const text = items.length
      ? questionsToText(plain())
      : `${title}\n\n${sections.map((s) => `${s.heading}\n${s.body}`).join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't access the clipboard; select the text and copy manually.");
    }
  }

  const hasResult = items.length > 0 || sections.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.text}
              type="button"
              onClick={() => {
                setPrompt(c.text);
                setTask(c.task);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-[#E31B23]/40 hover:text-foreground"
            >
              {c.text}
            </button>
          ))}
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          aria-label="What should the assistant generate?"
          placeholder={
            METRIC_TASKS.includes(task)
              ? "Optional: add a note. The summary is built from your stored class metrics."
              : course
                ? `e.g. Create 5 MCQs for ${course}`
                : "e.g. Create 5 MCQs for Cooperative Governance"
          }
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            Task
            <select
              value={task}
              onChange={(e) => setTask(e.target.value as Task)}
              className="block h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            >
              {TASKS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {task === "quiz" && (
            <label className="space-y-1 text-xs text-muted-foreground">
              Questions
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                className="h-9 w-20"
              />
            </label>
          )}
          <Button onClick={generate} disabled={loading} className="bg-[#E31B23] text-white hover:bg-[#c8161d]">
            <Sparkles className="size-4" />
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && !hasResult && <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" aria-busy="true" />}

      {!loading && !hasResult && !error && (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Pick a suggestion or describe what you need. Drafts appear here for you to edit.
        </p>
      )}

      {hasResult && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <Sparkles className="size-3.5" />
            <span className="font-medium">AI-generated draft — review before use</span>
            <Badge variant="outline" className="ml-auto text-[10px]">
              {source === "gemini" ? "Source: Gemini" : "Source: built-in templates"}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>

          {items.map((q, idx) => (
            <div key={q.key} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Q{idx + 1}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {TYPE_LABEL[q.type]}
                </Badge>
                <div className="ml-auto flex gap-1">
                  <Button size="xs" variant="outline" onClick={() => patch(q.key, (i) => ({ editing: !i.editing }))}>
                    {q.editing ? <Check /> : <Pencil />}
                    {q.editing ? "Done" : "Edit"}
                  </Button>
                  <Button size="xs" variant="outline" disabled={q.busy} onClick={() => regenerate(q.key)}>
                    <RefreshCw className={q.busy ? "animate-spin" : ""} />
                    Regenerate
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setItems((p) => p.filter((i) => i.key !== q.key))}>
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </div>

              {q.editing ? (
                <div className="space-y-2">
                  <Textarea value={q.prompt} rows={2} aria-label="Question" onChange={(e) => patch(q.key, () => ({ prompt: e.target.value }))} />
                  {q.options?.map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      {q.type !== "true_false" && (
                        <input
                          type="radio"
                          name={`c-${q.key}`}
                          checked={q.correct.includes(o.id)}
                          aria-label={`Mark option ${o.id} correct`}
                          onChange={() => patch(q.key, () => ({ correct: [o.id] }))}
                        />
                      )}
                      {q.type === "true_false" ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input type="radio" name={`c-${q.key}`} checked={q.correct.includes(o.id)} onChange={() => patch(q.key, () => ({ correct: [o.id] }))} />
                          {o.text}
                        </label>
                      ) : (
                        <Input
                          value={o.text}
                          aria-label={`Option ${o.id}`}
                          onChange={(e) =>
                            patch(q.key, (i) => ({ options: i.options?.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) }))
                          }
                        />
                      )}
                    </div>
                  ))}
                  {q.type === "short_answer" && (
                    <Textarea
                      rows={2}
                      value={q.correct.join("\n")}
                      aria-label="Model answer"
                      onChange={(e) => patch(q.key, () => ({ correct: [e.target.value] }))}
                    />
                  )}
                  <Textarea
                    rows={2}
                    value={q.explanation ?? ""}
                    placeholder="Explanation"
                    aria-label="Explanation"
                    onChange={(e) => patch(q.key, () => ({ explanation: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p className="font-medium">{q.prompt}</p>
                  {q.options?.map((o) => (
                    <p key={o.id} className={q.correct.includes(o.id) ? "font-medium text-emerald-700" : "text-muted-foreground"}>
                      {o.id.length === 1 ? `${o.id.toUpperCase()}. ` : ""}
                      {o.text}
                      {q.correct.includes(o.id) && " (correct)"}
                    </p>
                  ))}
                  {q.type === "short_answer" && <p className="text-emerald-700">Model answer: {q.correct.join(" ")}</p>}
                  {q.explanation && <p className="text-xs text-muted-foreground">Why: {q.explanation}</p>}
                </div>
              )}
            </div>
          ))}

          {sections.map((s) => (
            <div key={s.key} className="space-y-1.5 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                {s.editing ? (
                  <Input
                    value={s.heading}
                    aria-label="Heading"
                    onChange={(e) => setSections((p) => p.map((x) => (x.key === s.key ? { ...x, heading: e.target.value } : x)))}
                  />
                ) : (
                  <p className="text-sm font-medium">{s.heading}</p>
                )}
                <div className="ml-auto flex gap-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setSections((p) => p.map((x) => (x.key === s.key ? { ...x, editing: !x.editing } : x)))}
                  >
                    {s.editing ? <Check /> : <Pencil />}
                    {s.editing ? "Done" : "Edit"}
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => setSections((p) => p.filter((x) => x.key !== s.key))}>
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              </div>
              {s.editing ? (
                <Textarea
                  rows={5}
                  value={s.body}
                  aria-label="Body"
                  onChange={(e) => setSections((p) => p.map((x) => (x.key === s.key ? { ...x, body: e.target.value } : x)))}
                />
              ) : (
                <p className="whitespace-pre-line text-sm text-muted-foreground">{s.body}</p>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {items.length > 0 && onAddQuestions && (
              <Button
                className="bg-[#E31B23] text-white hover:bg-[#c8161d]"
                onClick={() => {
                  onAddQuestions(plain());
                  setAdded(true);
                }}
              >
                <Plus className="size-4" />
                {added ? "Added to assessment" : `Add ${items.length} to Assessment`}
              </Button>
            )}
            <Button variant="outline" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy to clipboard"}
            </Button>
            {items.length > 0 && !onAddQuestions && (
              <Link href="/trainer/assessments/new" className="text-sm font-medium text-[#E31B23] hover:underline">
                Create an assessment
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
