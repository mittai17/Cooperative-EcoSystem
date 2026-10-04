"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnswerComposer } from "@/components/ai-interview/answer-composer";
import { EvaluationPanel } from "@/components/ai-interview/evaluation-panel";
import { nextMessageId, toHistory } from "@/components/ai-interview/history";
import { Transcript, type TranscriptMessage } from "@/components/ai-interview/transcript";
import { useCamera } from "@/components/ai-interview/use-camera";
import { useSpeech } from "@/components/ai-interview/use-speech";
import { useTTS } from "@/components/ai-interview/use-tts";
import { VideoPanel } from "@/components/ai-interview/video-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { describeApiError, type InterviewSource } from "@/lib/ai-interview/common";
import {
  evaluateTraineeInterview,
  getInterviewTarget,
  startTraineeSession,
  submitTraineeTurn,
  type TraineeEvaluation,
  type TraineeTarget,
} from "@/lib/trainee/ai-interview-api";
import { useT } from "@/i18n";

type Phase = "idle" | "starting" | "active" | "complete" | "ended";

interface ActiveSession {
  id: string;
  targetRole: string;
  source: InterviewSource;
  disclaimer: string;
}

export default function TraineeAiInterviewPage() {
  const t = useT();
  // Keeps the latest translator for the one-time target load without re-fetching on locale change.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const [target, setTarget] = useState<TraineeTarget | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [targetReloadKey, setTargetReloadKey] = useState(0);
  const [roleOverride, setRoleOverride] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [turnError, setTurnError] = useState<string | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  const [evaluation, setEvaluation] = useState<TraineeEvaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const camera = useCamera(t);
  const tts = useTTS();
  const speech = useSpeech(
    useCallback((text: string) => {
      setDraft((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
    }, []),
    t,
  );

  // Stop TTS if component unmounts
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, [tts]);

  useEffect(() => {
    let cancelled = false;
    getInterviewTarget()
      .then((data) => {
        if (cancelled) return;
        setTarget(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTargetError(describeApiError(err, tRef.current("trainee.aiInterview.loadRoleFailed")));
      });
    return () => {
      cancelled = true;
    };
  }, [targetReloadKey]);

  function retryLoadTarget() {
    setTargetError(null);
    setTarget(null);
    setTargetReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerOn]);

  /** Stops camera, speech recognition, TTS and the timer. Used by End, completion and unmount paths. */
  const endSession = useCallback(
    (nextPhase: Phase) => {
      camera.stop();
      speech.stop();
      tts.stop();
      setTimerOn(false);
      setPhase(nextPhase);
    },
    [camera, speech, tts],
  );

  const requestEvaluation = useCallback(async (active: ActiveSession, history: TranscriptMessage[]) => {
    setEvaluating(true);
    setEvaluationError(null);
    try {
      const result = await evaluateTraineeInterview(active.id, {
        target_role: active.targetRole,
        history: toHistory(history),
      });
      setEvaluation(result);
    } catch (err) {
      setEvaluationError(describeApiError(err, t("trainee.aiInterview.feedbackFailed")));
    } finally {
      setEvaluating(false);
    }
  }, [t]);

  const profileRole = target?.target_role?.trim() || "";
  const effectiveRole = roleOverride.trim() || profileRole;

  async function startInterview() {
    if (!effectiveRole) return;
    setStartError(null);
    setEvaluation(null);
    setEvaluationError(null);
    setTurnError(null);
    setPhase("starting");
    try {
      const started = await startTraineeSession(roleOverride.trim() || undefined);
      const targetRole = started.target_role || effectiveRole;
      const welcome: TranscriptMessage = {
        id: nextMessageId("welcome"),
        kind: "welcome",
        role: "ai",
        title: t("trainee.aiInterview.welcomeTitle").replace("{role}", targetRole),
        text: t("trainee.aiInterview.welcomeBody"),
      };
      const firstQuestion: TranscriptMessage = {
        id: nextMessageId("ai"),
        role: "ai",
        text: started.first_question,
      };
      setSession({
        id: started.session_id,
        targetRole,
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
      // AI interviewer automatically speaks the opening question out loud
      if (firstQuestion.text) {
        tts.speak(firstQuestion.text);
      }
    } catch (err) {
      setPhase("idle");
      setStartError(describeApiError(err, t("trainee.aiInterview.startFailed")));
    }
  }

  async function submitAnswer() {
    const answer = draft.trim();
    if (!session || phase !== "active" || submitting || !answer) return;

    speech.stop();
    tts.stop();
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
      const turn = await submitTraineeTurn(session.id, {
        target_role: session.targetRole,
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

      if (nextQuestion?.text) {
        // AI interviewer automatically speaks the follow-up question
        tts.speak(nextQuestion.text);
      }

      if (turn.done || !nextQuestion) {
        endSession("complete");
        await requestEvaluation(session, updated);
      }
    } catch (err) {
      // Restore the answer so the trainee does not lose what they said.
      setMessages(historyBefore);
      setDraft(answer);
      setSubmitting(false);
      setTurnError(describeApiError(err, t("trainee.aiInterview.sendFailed")));
    }
  }

  function handleEnd() {
    endSession("ended");
  }

  function resetForNewInterview() {
    tts.stop();
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
      ? t("trainee.aiInterview.emptyIdle")
      : t("trainee.aiInterview.noMessages");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("trainee.aiInterview.title", "AI Mock Interview") || "AI Mock Interview"}
        description={t("trainee.aiInterview.description", "Practise interview questions tailored to cooperative roles. Get real-time AI feedback and dimension scores.") || "Practise interview questions tailored to cooperative roles. Get real-time AI feedback and dimension scores."}
      />
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200">
          Powered by Gemini & OpenRouter AI
        </Badge>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-slate-700">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          {t("trainee.aiInterview.privacyNote", "Your video and audio are processed locally and never recorded or sent to employers.") || "Your video and audio are processed locally and never recorded or sent to employers."}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-800">{t("trainee.aiInterview.practisingFor", "Target Role") || "Target Role"}</span>
            {target === null && !targetError && <Skeleton className="h-9 w-full max-w-md" />}
            {targetError && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4" aria-hidden />
                  {targetError}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={retryLoadTarget}>
                  <RotateCcw aria-hidden />
                  {t("trainee.common.retry", "Retry") || "Retry"}
                </Button>
              </div>
            )}
            {target !== null && (
              <div className="flex flex-col gap-2">
                {profileRole ? (
                  <>
                    <p className="text-base font-semibold text-slate-900">{profileRole}</p>
                    <p className="text-sm text-muted-foreground">{t("trainee.aiInterview.fromProfile", "From your profile") || "From your profile"}</p>
                    {(target.skills ?? []).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5" aria-label={t("trainee.aiInterview.skillsLabel", "Skills") || "Skills"}>
                        {(target.skills ?? []).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("trainee.aiInterview.noSkills", "No skills listed on your profile yet.") || "No skills listed on your profile yet."}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("trainee.aiInterview.noTargetRole", "No target role set on profile.") || "No target role set on profile."}{" "}
                    <Link
                      href="/trainee/profile"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {t("trainee.aiInterview.setRoleLink", "Set a role") || "Set a role"}
                    </Link>{" "}
                    {t("trainee.aiInterview.orEnterBelow", "or enter one below:") || "or enter one below:"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="role-override" className="text-sm font-medium text-slate-800">
                {t("trainee.aiInterview.differentRole", "Role to practice") || "Role to practice"}{" "}
                <span className="font-normal text-muted-foreground">{t("trainee.aiInterview.optional", "(Optional)") || "(Optional)"}</span>
              </label>
              <Input
                id="role-override"
                value={roleOverride}
                onChange={(event) => setRoleOverride(event.target.value)}
                placeholder={profileRole || t("trainee.aiInterview.rolePlaceholder", "e.g., Data Engineer, PACS Manager, Dairy Procurement Specialist") || "e.g., Data Engineer, PACS Manager, Dairy Procurement Specialist"}
                maxLength={120}
                disabled={phase !== "idle"}
              />
            </div>
            {phase === "idle" || phase === "starting" ? (
              <Button
                type="button"
                onClick={() => void startInterview()}
                disabled={!effectiveRole || phase === "starting"}
              >
                {phase === "starting"
                  ? t("trainee.aiInterview.starting", "Starting...") || "Starting..."
                  : t("trainee.aiInterview.startInterview", "Start Interview") || "Start Interview"}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={resetForNewInterview} disabled={isActive}>
                {t("trainee.aiInterview.newInterview", "New Interview") || "New Interview"}
              </Button>
            )}
          </div>
          {!profileRole && (
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Or select a common role:</span>
              <div className="flex flex-wrap gap-2">
                {["Dairy Procurement Supervisor", "PACS Accounts Assistant", "Cooperative Extension Officer", "Rural Marketing Executive", "Cold Chain Logistics Lead"].map(role => (
                  <Badge 
                    key={role} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => setRoleOverride(role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!effectiveRole && target !== null && (
            <p className="text-xs text-muted-foreground">{t("trainee.aiInterview.enterRoleHint", "Enter a target role to practice.") || "Enter a target role to practice."}</p>
          )}
          {startError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" aria-hidden />
              {startError}
            </p>
          )}
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
            {t("trainee.aiInterview.cameraNote", "Camera preview is local and optional.") || "Camera preview is local and optional."}
          </p>
        </div>

        <Card className="flex min-h-[28rem] flex-col p-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                {session ? session.targetRole : (t("trainee.aiInterview.transcriptTitle", "Interview Transcript") || "Interview Transcript")}
              </CardTitle>
              {tts.speaking && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 animate-pulse border border-emerald-200">
                  <Volume2 className="size-3" />
                  Speaking
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tts.supported && isActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={tts.toggleMute}
                  className="h-7 gap-1.5 px-2 text-xs"
                  title={tts.muted ? "Unmute Interviewer Voice" : "Mute Interviewer Voice"}
                >
                  {tts.muted ? (
                    <>
                      <VolumeX className="size-3.5 text-muted-foreground" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3.5 text-primary" />
                      <span>Voice On</span>
                    </>
                  )}
                </Button>
              )}
              {session?.source === "fallback" && <Badge variant="secondary">{t("trainee.aiInterview.fallbackQuestions", "Standard Question Bank") || "Standard Question Bank"}</Badge>}
            </div>
          </CardHeader>

          <Transcript
            messages={messages}
            emptyMessage={transcriptEmpty}
            onSpeakMessage={tts.replay}
            speaking={tts.speaking}
          />

          {turnError && <p className="px-4 pb-2 text-sm text-destructive">{turnError}</p>}

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
                  ? (t("trainee.aiInterview.practiceEnded", "Interview stopped. Camera and mic are off.") || "Interview stopped. Camera and mic are off.")
                  : (t("trainee.aiInterview.practiceComplete", "Interview complete. Camera and mic are off.") || "Interview complete. Camera and mic are off.")}
              </p>
              {phase === "ended" && hasAnswers && !evaluation && !evaluating && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => session && void requestEvaluation(session, messages)}
                  >
                    {t("trainee.aiInterview.getFeedback", "Get Evaluation & Feedback") || "Get Evaluation & Feedback"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {session && <p className="text-xs text-muted-foreground">{session.disclaimer}</p>}

      {(evaluating || evaluation || evaluationError) && (
        <EvaluationPanel
          evaluation={evaluation}
          evaluating={evaluating}
          error={evaluationError}
          onRetry={() => session && void requestEvaluation(session, messages)}
          heading={t("trainee.aiInterview.practiceHeading", "PRACTICE FEEDBACK") || "PRACTICE FEEDBACK"}
        />
      )}
    </div>
  );
}
