"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Info, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnswerComposer } from "@/components/ai-interview/answer-composer";
import { EvaluationPanel } from "@/components/ai-interview/evaluation-panel";
import { nextMessageId, toHistory } from "@/components/ai-interview/history";
import { Transcript, type TranscriptMessage } from "@/components/ai-interview/transcript";
import { useCamera } from "@/components/ai-interview/use-camera";
import { useSpeech } from "@/components/ai-interview/use-speech";
import { VideoPanel } from "@/components/ai-interview/video-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  describeApiError,
  evaluateInterview,
  listInterviewJobs,
  startInterviewSession,
  submitInterviewTurn,
  type EvaluateResponse,
  type InterviewJob,
  type InterviewSource,
} from "@/lib/employer/ai-interview-api";

type Phase = "idle" | "starting" | "active" | "complete" | "ended";

interface ActiveSession {
  id: string;
  jobId: string;
  jobTitle: string;
  source: InterviewSource;
  disclaimer: string;
}

export default function AiInterviewPage() {
  const [jobs, setJobs] = useState<InterviewJob[] | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobsReloadKey, setJobsReloadKey] = useState(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [turnError, setTurnError] = useState<string | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  const [evaluation, setEvaluation] = useState<EvaluateResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const camera = useCamera();
  const speech = useSpeech(
    useCallback((text: string) => {
      setDraft((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    listInterviewJobs()
      .then((data) => {
        if (cancelled) return;
        const active = data.jobs.filter((job) => job.status === "open");
        setJobs(active);
        setSelectedJobId((current) => current ?? active[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setJobsError(describeApiError(err, "Could not load your job postings."));
      });
    return () => {
      cancelled = true;
    };
  }, [jobsReloadKey]);

  function retryLoadJobs() {
    setJobsError(null);
    setJobs(null);
    setJobsReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerOn]);

  /** Stops camera, speech recognition and the timer. Used by End, completion and unmount paths. */
  const endSession = useCallback(
    (nextPhase: Phase) => {
      camera.stop();
      speech.stop();
      setTimerOn(false);
      setPhase(nextPhase);
    },
    [camera, speech],
  );

  const requestEvaluation = useCallback(
    async (active: ActiveSession, history: TranscriptMessage[]) => {
      setEvaluating(true);
      setEvaluationError(null);
      try {
        const result = await evaluateInterview(active.id, {
          job_id: active.jobId,
          history: toHistory(history),
        });
        setEvaluation(result);
      } catch (err) {
        setEvaluationError(describeApiError(err, "Could not generate the AI summary."));
      } finally {
        setEvaluating(false);
      }
    },
    [],
  );

  const selectedJob = jobs?.find((job) => job.id === selectedJobId) ?? null;

  async function startInterview() {
    if (!selectedJob) return;
    setStartError(null);
    setEvaluation(null);
    setEvaluationError(null);
    setTurnError(null);
    setPhase("starting");
    try {
      const started = await startInterviewSession(selectedJob.id);
      const welcome: TranscriptMessage = {
        id: nextMessageId("welcome"),
        kind: "welcome",
        role: "ai",
        title: `Welcome to your AI mock interview for ${started.job.title}.`,
        text: "I will ask you real interview questions and listen to your answers.",
      };
      const firstQuestion: TranscriptMessage = {
        id: nextMessageId("ai"),
        role: "ai",
        text: started.first_question,
      };
      setSession({
        id: started.session_id,
        jobId: started.job.id,
        jobTitle: started.job.title,
        source: started.source,
        disclaimer: started.disclaimer,
      });
      setMessages([welcome, firstQuestion]);
      setDraft("");
      setElapsed(0);
      setTimerOn(true);
      setPhase("active");
      // Camera is requested only after the session exists; a denial does not block text answers.
      void camera.start();
    } catch (err) {
      setPhase("idle");
      setStartError(describeApiError(err, "Could not start the interview."));
    }
  }

  async function submitAnswer() {
    const answer = draft.trim();
    if (!session || phase !== "active" || submitting || !answer) return;

    speech.stop();
    const historyBefore = messages;
    const candidateMessage: TranscriptMessage = {
      id: nextMessageId("candidate"),
      role: "candidate",
      text: answer,
    };
    setMessages([...historyBefore, candidateMessage]);
    setDraft("");
    setSubmitting(true);
    setTurnError(null);

    try {
      const turn = await submitInterviewTurn(session.id, {
        job_id: session.jobId,
        history: toHistory(historyBefore),
        answer,
      });
      const nextQuestion: TranscriptMessage | null = turn.next_question
        ? { id: nextMessageId("ai"), role: "ai", text: turn.next_question }
        : null;
      const updated = nextQuestion
        ? [...historyBefore, candidateMessage, nextQuestion]
        : [...historyBefore, candidateMessage];
      setMessages(updated);
      if (turn.source === "fallback") {
        setSession((current) => (current ? { ...current, source: "fallback" } : current));
      }
      setSubmitting(false);

      if (turn.done || !nextQuestion) {
        endSession("complete");
        await requestEvaluation(session, updated);
      }
    } catch (err) {
      // Restore the answer so the candidate does not lose what they said.
      setMessages(historyBefore);
      setDraft(answer);
      setSubmitting(false);
      setTurnError(describeApiError(err, "Your answer could not be sent. Please try again."));
    }
  }

  function handleEnd() {
    endSession("ended");
  }

  function resetForNewInterview() {
    setSession(null);
    setMessages([]);
    setDraft("");
    setTurnError(null);
    setStartError(null);
    setEvaluation(null);
    setEvaluationError(null);
    setElapsed(0);
    setPhase("idle");
  }

  const isActive = phase === "active";
  const hasAnswers = messages.some((message) => message.role === "candidate");
  const transcriptEmpty =
    phase === "idle" || phase === "starting"
      ? "Pick a job and start the interview. The AI interviewer's questions will appear here."
      : "No messages yet.";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Mock Interview Studio"
        description="Practise real interview questions for an open role, then review an AI-generated summary."
      />

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-slate-700">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          Your camera feed stays in your browser. Only typed or transcribed answers are sent to NURVEX
          AI for questions and evaluation.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-800">Job</span>
            {jobs === null && !jobsError && <Skeleton className="h-9 w-full" />}
            {jobsError && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4" aria-hidden />
                  {jobsError}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={retryLoadJobs}>
                  <RotateCcw aria-hidden />
                  Retry
                </Button>
              </div>
            )}
            {jobs !== null && jobs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any active job postings yet.{" "}
                <Link href="/employer/jobs/new" className="font-medium text-primary underline-offset-4 hover:underline">
                  Create a job posting
                </Link>
              </p>
            )}
            {jobs !== null && jobs.length > 0 && (
              <Select
                items={jobs.map((job) => ({ label: job.title, value: job.id }))}
                value={selectedJobId}
                onValueChange={(value) => value && setSelectedJobId(value)}
                disabled={phase !== "idle"}
              >
                <SelectTrigger className="w-full" aria-label="Job for the mock interview">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {startError && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" aria-hidden />
                {startError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {phase === "idle" || phase === "starting" ? (
              <Button
                type="button"
                onClick={() => void startInterview()}
                disabled={!selectedJob || phase === "starting"}
              >
                {phase === "starting" ? "Starting..." : "Start interview"}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={resetForNewInterview} disabled={isActive}>
                New interview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-3">
          <VideoPanel
            stream={camera.stream}
            cameraStatus={camera.status}
            cameraMessage={camera.message}
            live={isActive}
            elapsedSeconds={elapsed}
            onEnd={handleEnd}
          />
          <p className="text-center text-xs text-muted-foreground">
            Recording stops when you end the interview. Video is never uploaded.
          </p>
        </div>

        <Card className="flex min-h-[28rem] flex-col p-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              {session ? session.jobTitle : "Interview transcript"}
            </CardTitle>
            {session?.source === "fallback" && <Badge variant="secondary">Fallback questions</Badge>}
          </CardHeader>

          <Transcript messages={messages} emptyMessage={transcriptEmpty} />

          {turnError && (
            <p className="px-4 pb-2 text-sm text-destructive">{turnError}</p>
          )}

          {isActive && (
            <AnswerComposer
              draft={draft}
              onDraftChange={setDraft}
              onSubmit={() => void submitAnswer()}
              submitting={submitting}
              disabled={!isActive}
              speechSupported={speech.supported}
              listening={speech.listening}
              interim={speech.interim}
              speechError={speech.error}
              onToggleListening={() => (speech.listening ? speech.stop() : speech.start())}
            />
          )}

          {(phase === "ended" || phase === "complete") && (
            <div className="flex flex-col gap-3 border-t border-border p-4 text-sm text-muted-foreground">
              <p>
                {phase === "ended"
                  ? "Interview ended. Recording has stopped and the camera is off."
                  : "Interview complete. The camera is off."}
              </p>
              {phase === "ended" && hasAnswers && !evaluation && !evaluating && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => session && void requestEvaluation(session, messages)}
                  >
                    Generate AI summary
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {session && (
        <p className="text-xs text-muted-foreground">{session.disclaimer}</p>
      )}

      {(evaluating || evaluation || evaluationError) && (
        <EvaluationPanel
          evaluation={evaluation}
          evaluating={evaluating}
          error={evaluationError}
          onRetry={() => session && void requestEvaluation(session, messages)}
        />
      )}
    </div>
  );
}
