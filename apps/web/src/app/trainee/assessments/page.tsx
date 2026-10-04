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
import {
  buildTraineeAssessments,
  getQuestionBank,
  gradeAttempt,
  isPassingScore,
  type AssessmentSummary,
  type Question,
} from "@/lib/trainee/assessments-data";

interface AttemptState {
  attemptId: string;
  assessment: AssessmentSummary;
  expiresAt: string;
  questions: Question[];
  answers: Record<string, (string | boolean)[]>;
}

interface SubmitResult {
  score: number;
  passed: boolean;
  skill_updated: string | null;
}

const TAB_LABELS: Record<"Upcoming" | "Completed" | "Missed", string> = {
  Upcoming: "Upcoming",
  Completed: "Completed",
  Missed: "Missed",
};

function isMissed(item: AssessmentSummary): boolean {
  return item.status === "upcoming" && !!item.due_date && new Date(item.due_date) < new Date();
}

function formatDue(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AssessmentsPage() {
  const [tab, setTab] = useState<"Upcoming" | "Completed" | "Missed">("Upcoming");
  const [assessments, setAssessments] = useState<AssessmentSummary[] | null>(null);

  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setAssessments(buildTraineeAssessments()), 0);
    return () => window.clearTimeout(id);
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

  function openAttempt(item: AssessmentSummary, resume: boolean) {
    const questions = getQuestionBank(item.id);
    if (questions.length === 0) {
      setAttemptError(`No question bank is published yet for ${item.title}.`);
      return;
    }
    setStarting(item.id);
    setAttemptError(null);
    setResult(null);
    window.setTimeout(() => {
      setAttempt({
        attemptId: resume && item.open_attempt_id ? item.open_attempt_id : `att-${item.id}-1`,
        assessment: item,
        expiresAt: new Date(Date.now() + item.duration_minutes * 60 * 1000).toISOString(),
        questions,
        answers: {},
      });
      setStarting(null);
    }, 200);
  }

  function selectAnswer(questionId: string, answer: (string | boolean)[]) {
    setAttempt((prev) => (prev ? { ...prev, answers: { ...prev.answers, [questionId]: answer } } : prev));
  }

  function submitAttempt() {
    if (!attempt) return;
    setSubmitting(true);
    const graded = gradeAttempt(attempt.questions, attempt.answers, attempt.assessment.passing_score);
    setResult({
      score: graded.score,
      passed: graded.passed,
      skill_updated: `${attempt.assessment.skillFocus} (+${Math.max(4, Math.round(graded.score / 8))}%)`,
    });

    setAssessments((prev) =>
      (prev ?? []).map((item) =>
        item.id === attempt.assessment.id
          ? {
              ...item,
              status: "completed" as const,
              open_attempt_id: null,
              best_score: Math.max(item.best_score ?? 0, graded.score),
              attempts_left: Math.max(0, item.attempts_left - 1),
            }
          : item,
      ),
    );

    window.setTimeout(() => {
      setAttempt(null);
      setResult(null);
      setSubmitting(false);
      setTab("Completed");
    }, 2400);
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
        description="Pre-register for sector skill tests, attempt them online, and track the score each one adds to your Skill Passport."
      />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {(["Upcoming", "Completed", "Missed"] as const).map((name) => (
          <Button key={name} variant={name === tab ? "default" : "ghost"} size="sm" onClick={() => setTab(name)}>
            {TAB_LABELS[name]}
            {name === "Upcoming" && upcomingList.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                {upcomingList.length}
              </span>
            )}
            {name === "Completed" && completedList.length > 0 && (
              <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">
                {completedList.length}
              </span>
            )}
            {name === "Missed" && missedList.length > 0 && (
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
              No upcoming assessments
            </div>
          ) : (
            upcomingList.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.programme} &middot; {a.skillFocus}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">{a.duration_minutes} min</Badge>
                      <Badge variant="outline">Pass mark {a.passing_score}%</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" /> Due: {formatDue(a.due_date) || "No due date"}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.attempts_left} {a.attempts_left === 1 ? "attempt" : "attempts"} left</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.status === "in_progress" ? (
                      <Button onClick={() => openAttempt(a, true)} disabled={starting === a.id}>
                        {starting === a.id && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Resume
                      </Button>
                    ) : (
                      <Button onClick={() => openAttempt(a, false)} disabled={starting === a.id || a.attempts_left === 0}>
                        {starting === a.id && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                        Start
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
              No completed assessments
            </div>
          ) : (
            completedList.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.programme} &middot; {a.skillFocus}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("text-xs font-medium", isPassingScore(a, a.best_score) ? "text-emerald-600" : "text-destructive")}>
                        {isPassingScore(a, a.best_score) ? "Passed" : "Not yet passed"}
                      </span>
                      {a.attempts_left > 0 && !isPassingScore(a, a.best_score) && (
                        <Button size="sm" variant="outline" onClick={() => openAttempt(a, false)} disabled={starting === a.id}>
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
            No missed assessments
          </div>
        ) : (
          missedList.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.programme} &middot; {a.skillFocus}</p>
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <Calendar className="size-3" /> Was due {formatDue(a.due_date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-destructive border-destructive/40">Missed</Badge>
                  {a.attempts_left > 0 && (
                    <Button size="sm" variant="outline" onClick={() => openAttempt(a, false)} disabled={starting === a.id}>
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={Boolean(attempt)} onOpenChange={(open) => !open && !submitting && setAttempt(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">{attempt?.assessment.title}</DialogTitle>
              {attempt && (
                <Badge variant="secondary" className={cn(windowClosed ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary")}>
                  <Clock className="mr-1 size-3.5" />
                  {formatCountdown(remaining)}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs">
              {attempt ? `${answeredCount} of ${attempt.questions.length} answered` : ""}
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className={cn("size-12 rounded-full flex items-center justify-center mb-3", result.passed ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600")}>
                <CheckCircle2 className="size-8" />
              </div>
              <h4 className="font-bold text-foreground">
                {result.passed ? "Assessment passed" : "Assessment submitted"}
              </h4>
              <p className="text-2xl font-bold mt-1 text-foreground">{result.score}%</p>
              {result.skill_updated && (
                <p className="text-xs text-muted-foreground mt-1">Skill updated: {result.skill_updated}</p>
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
                  <AlertTitle>Time is up</AlertTitle>
                  <AlertDescription>The attempt window has closed. Submit your answers to see the result, or close and start a fresh attempt.</AlertDescription>
                </Alert>
              )}
              {attempt?.questions.map((question, index) => (
                <div key={question.id} className="rounded-xl bg-muted/40 p-3 border border-border">
                  <p className="text-sm font-medium text-foreground">
                    {index + 1}. {question.prompt}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">({question.marks} {question.marks === 1 ? "mark" : "marks"})</span>
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{question.topic}</p>
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
                  Save & Close
                </Button>
                <Button onClick={submitAttempt} disabled={submitting || windowClosed} className="gap-1.5">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Submit Assessment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}