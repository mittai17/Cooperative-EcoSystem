/**
 * Typed client for the trainee AI Mock Interview (practice only).
 *
 * Endpoints (backend under /api/v1/trainee/ai-interview):
 *   GET  /target                            -> { target_role, source, skills }
 *   POST /sessions                          -> { target_role? } starts a session
 *   POST /sessions/{session_id}/turns       -> { target_role, history, answer } -> next question
 *   POST /sessions/{session_id}/evaluate    -> { target_role, history } -> practice feedback
 *
 * Every call goes through `fetchWithAuth` from `lib/api.ts`, which returns untyped JSON;
 * the return types here are the contract. Errors are thrown by that helper; use
 * `describeApiError` from `lib/ai-interview/common` to show them.
 *
 * Practice feedback is never shared with employers. Camera frames never leave the browser.
 */
import { fetchWithAuth } from "@/lib/api";
import type {
  InterviewEvaluation,
  InterviewHistoryEntry,
  InterviewSource,
} from "@/lib/ai-interview/common";

const BASE = "/api/v1/trainee/ai-interview";

export interface TraineeTarget {
  /** null when the trainee has no target role on their profile yet. */
  target_role: string | null;
  source: string;
  /** Skills the target role was built from. */
  skills: string[];
}

export interface StartTraineeSessionResponse {
  session_id: string;
  target_role: string;
  first_question: string;
  source: InterviewSource;
  disclaimer: string;
}

export interface TraineeTurnResponse {
  /** null once the interview is done. */
  next_question: string | null;
  source: InterviewSource | null;
  turn_index: number;
  done: boolean;
}

export type TraineeEvaluation = InterviewEvaluation;

/** Target role and skills the practice interview is built from. */
export function getInterviewTarget(): Promise<TraineeTarget> {
  return fetchWithAuth(`${BASE}/target`);
}

/** Starts a session. Omit `targetRole` to use the trainee's own target role. */
export function startTraineeSession(targetRole?: string): Promise<StartTraineeSessionResponse> {
  const role = targetRole?.trim();
  return fetchWithAuth(`${BASE}/sessions`, {
    method: "POST",
    body: JSON.stringify(role ? { target_role: role } : {}),
  });
}

export function submitTraineeTurn(
  sessionId: string,
  payload: { target_role: string; history: InterviewHistoryEntry[]; answer: string },
): Promise<TraineeTurnResponse> {
  return fetchWithAuth(`${BASE}/sessions/${encodeURIComponent(sessionId)}/turns`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function evaluateTraineeInterview(
  sessionId: string,
  payload: { target_role: string; history: InterviewHistoryEntry[] },
): Promise<TraineeEvaluation> {
  return fetchWithAuth(`${BASE}/sessions/${encodeURIComponent(sessionId)}/evaluate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
