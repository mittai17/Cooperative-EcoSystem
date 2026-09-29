"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Calendar, CheckCircle, CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ApiError, useApi } from "@/lib/use-api";

interface AssessmentSummary {
  id: string;
  title: string;
  duration_minutes: number;
  passing_score: number;
  due_date: string | null;
  status: "upcoming" | "in_progress" | "completed";
  open_attempt_id: string | null;
  best_score: number | null;
  attempts_left: number;
}

interface Question {
  id: string;
  position: number;
  type: "mcq_single" | "mcq_multi" | "true_false";
  prompt: string;
  options: { id: string; text: string }[];
  marks: number;
  topic: string | null;
}

interface AttemptState {
  attemptId: string;
  assessmentTitle: string;
  expiresAt: string;
  questions: Question[];
  answers: Record<string, (string | boolean)[]>;
}

interface SubmitResult {
  score: number;
  passed: boolean;
  skill_updated: string | null;
}

function isMissed(item: AssessmentSummary): boolean {
  return item.status === "upcoming" && !!item.due_date && new Date(item.due_date) < new Date();
}

function formatDue(value: string | null): string {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AssessmentsPage() {
  const api = useApi();
  const [tab, setTab] = useState<"Upcoming" | "Completed" | "Missed">("Upcoming");
  const [assessments, setAssessments] = useState<AssessmentSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadAssessments() {
    setLoadError(null);
    try {
      const data = await api.get<{ assessments: AssessmentSummary[] }>("/api/v1/assessments/my");
      setAssessments(data.assessments);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.detail : "Could not reach the CoopSetu API");
      setAssessments([]);
    }
  }

  useEffect(() => {
    // Deferred to a macrotask so the initial fetch's setState does not fire
    // synchronously inside the effect body (react-hooks/set-state-in-effect).
    const id = window.setTimeout(() => void loadAssessments(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!attempt) return;
    const expiresMs = new Date(attempt.expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((expiresMs - Date.now()) / 1000)));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt]);

  async function startAssessment(item: AssessmentSummary) {
    setStarting(item.id);
    setAttemptError(null);
    setResult(null);
    try {
      const data = await api.post<{ attempt_id: string; expires_at: string; questions: Question[] }>(
        `/api/v1/assessments/${item.id}/attempts`,
      );
      setAttempt({ attemptId: data.attempt_id, assessmentTitle: item.title, expiresAt: data.expires_at, questions: data.questions, answers: {} });
    } catch (err) {
      setAttemptError(err instanceof ApiError ? err.detail : "Could not start this assessment.");
    } finally {
      setStarting(null);
    }
  }

  async function resumeAssessment(item: AssessmentSummary) {
    if (!item.open_attempt_id) return;
    setStarting(item.id);
    setAttemptError(null);
    setResult(null);
    try {
      const data = await api.get<{ attempt_id: string; expires_at: string; questions: Question[]; answers: Record<string, (string | boolean)[]> }>(
        `/api/v1/assessments/attempts/${item.open_attempt_id}`,
      );
      setAttempt({ attemptId: data.attempt_id, assessmentTitle: item.title, expiresAt: data.expires_at, questions: data.questions, answers: data.answers ?? {} });
    } catch (err) {
      setAttemptError(err instanceof ApiError ? err.detail : "Could not resume this attempt.");
    } finally {
      setStarting(null);
    }
  }

  async function selectAnswer(questionId: string, answer: (string | boolean)[]) {
    if (!attempt) return;
    setAttempt((prev) => (prev ? { ...prev, answers: { ...prev.answers, [questionId]: answer } } : prev));
    try {
      await api.put(`/api/v1/assessments/attempts/${attempt.attemptId}/answers`, { question_id: questionId, answer });
    } catch {
      // Answer stays saved locally; the submit call will send it via the
      // attempt's saved state on the server the next time it succeeds.
    }
  }

  async function submitAttempt() {
    if (!attempt) return;
    setSubmitting(true);
    setAttemptError(null);
    try {
      const data = await api.post<SubmitResult>(`/api/v1/assessments/attempts/${attempt.attemptId}/submit`);
      setResult(data);
      await loadAssessments();
      window.setTimeout(() => {
        setAttempt(null);
        setResult(null);
      }, 2200);
    } catch (err) {
      setAttemptError(err instanceof ApiError ? err.detail : "Could not submit this attempt.");
    } finally {
      setSubmitting(false);
    }
  }

  const upcomingList = useMemo(() => (assessments ?? []).filter((a) => (a.status === "upcoming" || a.status === "in_progress") && !isMissed(a)), [assessments]);
  const completedList = useMemo(() => (assessments ?? []).filter((a) => a.status === "completed"), [assessments]);
  const missedList = useMemo(() => (assessments ?? []).filter((a) => isMissed(a)), [assessments]);

  const answeredCount = attempt ? Object.keys(attempt.answers).length : 0;
  const windowClosed = attempt !== null && remaining <= 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assessments Hub"
        description="Take timed module quizzes and proficiency evaluations, graded instantly by the server."
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load assessments</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {(["Upcoming", "Completed", "Missed"] as const).map((t) => (
          <Button key={t} variant={t === tab ? "default" : "ghost"} size="sm" onClick={() => setTab(t)}>
            {t}
            {t === "Completed" && completedList.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">
                {completedList.length}
              </span>
            )}
            {t === "Missed" && missedList.length > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive/20 px-1.5 py-0.2 text-[10px] font-bold text-destructive">
                {missedList.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assessments === null ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : tab === "Upcoming" ? (
          upcomingList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No upcoming assessments right now.
            </div>
          ) : (
            upcomingList.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">{a.duration_minutes} min</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" /> Due: {formatDue(a.due_date)}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.attempts_left} attempt{a.attempts_left === 1 ? "" : "s"} left</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.status === "in_progress" ? (
                      <Button onClick={() => resumeAssessment(a)} disabled={starting === a.id}>
                        {starting === a.id && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Resume Assessment
                      </Button>
                    ) : (
                      <Button onClick={() => startAssessment(a)} disabled={starting === a.id || a.attempts_left === 0}>
                        {starting === a.id && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Start Assessment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )
        ) : tab === "Completed" ? (
          completedList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No completed assessments yet. Start an upcoming assessment to test your knowledge!
            </div>
          ) : (
            completedList.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-xs font-medium", (a.best_score ?? 0) >= a.passing_score ? "text-emerald-600" : "text-destructive")}>
                        {(a.best_score ?? 0) >= a.passing_score ? "Passed" : "Not yet passed"}
                      </span>
                      {a.attempts_left > 0 && (a.best_score ?? 0) < a.passing_score && (
                        <Button size="sm" variant="outline" onClick={() => startAssessment(a)} disabled={starting === a.id}>
                          Retake
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="size-5" />
                    <span className="font-bold text-base">{a.best_score ?? 0}%</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        ) : missedList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No missed assessments. Keep up the good work!
          </div>
        ) : (
          missedList.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <Calendar className="size-3" /> Was due {formatDue(a.due_date)}
                  </span>
                </div>
                <Badge variant="outline" className="text-destructive border-destructive/40">Missed</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={Boolean(attempt)} onOpenChange={(open) => !open && !submitting && setAttempt(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">{attempt?.assessmentTitle}</DialogTitle>
              {attempt && (
                <Badge variant="secondary" className={cn(windowClosed ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary")}>
                  <Clock className="mr-1 size-3.5" />
                  {formatCountdown(remaining)}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs">
              {attempt ? `${answeredCount} of ${attempt.questions.length} answered. Answers save automatically.` : ""}
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className={cn("size-12 rounded-full flex items-center justify-center mb-3", result.passed ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600")}>
                <CheckCircle2 className="size-8" />
              </div>
              <h4 className="font-bold text-foreground">
                {result.passed ? "Assessment passed!" : "Assessment submitted"}
              </h4>
              <p className="text-2xl font-bold mt-1 text-foreground">{result.score}%</p>
              {result.skill_updated && (
                <p className="text-xs text-muted-foreground mt-1">Skill Passport updated: {result.skill_updated}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {attemptError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{attemptError}</AlertDescription>
                </Alert>
              )}
              {windowClosed && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Time&apos;s up</AlertTitle>
                  <AlertDescription>Submit now — the server will only grade answers saved before the timer ran out.</AlertDescription>
                </Alert>
              )}
              {attempt?.questions.map((question, index) => (
                <div key={question.id} className="rounded-xl bg-muted/40 p-3 border border-border">
                  <p className="text-sm font-medium text-foreground">
                    {index + 1}. {question.prompt}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">({question.marks} mark{question.marks === 1 ? "" : "s"})</span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {question.type === "true_false"
                      ? [true, false].map((value) => {
                          const selected = attempt.answers[question.id]?.[0] === value;
                          return (
                            <button
                              key={String(value)}
                              type="button"
                              onClick={() => selectAnswer(question.id, [value])}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center justify-between",
                                selected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted/50 text-foreground",
                              )}
                            >
                              <span>{value ? "True" : "False"}</span>
                              {selected && <CheckCircle2 className="size-4" />}
                            </button>
                          );
                        })
                      : question.options.map((option) => {
                          const current = attempt.answers[question.id] ?? [];
                          const selected = current.includes(option.id);
                          const multi = question.type === "mcq_multi";
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                if (multi) {
                                  const next = selected ? current.filter((v) => v !== option.id) : [...current, option.id];
                                  selectAnswer(question.id, next);
                                } else {
                                  selectAnswer(question.id, [option.id]);
                                }
                              }}
                              className={cn(
                                "w-full text-left p-3 rounded-lg border text-sm transition-all flex items-center justify-between",
                                selected ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted/50 text-foreground",
                              )}
                            >
                              <span>{option.text}</span>
                              {selected && <CheckCircle2 className="size-4" />}
                            </button>
                          );
                        })}
                  </div>
                </div>
              ))}

              <Progress value={attempt ? (answeredCount / Math.max(1, attempt.questions.length)) * 100 : 0} />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAttempt(null)} disabled={submitting}>
                  Save &amp; close
                </Button>
                <Button onClick={submitAttempt} disabled={submitting} className="gap-1.5">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Submit Evaluation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
