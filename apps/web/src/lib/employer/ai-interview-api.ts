/**
 * Typed client for the employer AI Mock Interview Studio.
 *
 * Endpoints (`backend/app/api/v1/employer_ai_interview.py`):
 *   GET  /jobs                              -> { items: [{ id, title, status }] }
 *   POST /sessions                          -> start a session
 *   POST /sessions/{session_id}/turns       -> submit one answer, get the next question
 *   POST /sessions/{session_id}/evaluate    -> AI-generated summary of the transcript
 *
 * Every call goes through `employerRequest` from `lib/employer/employer-http.ts`, the
 * mock-first employer gateway; the return types here are the contract. Shared contract
 * types live in `lib/ai-interview/common.ts`.
 *
 * Only typed or transcribed answers are sent here. Camera frames never leave the browser.
 */
import { employerRequest } from "@/lib/employer/employer-http";
import { mockInterviewJobs } from "@/lib/employer/fixtures/interview-studio";
import type {
  InterviewEvaluation,
  InterviewHistoryEntry,
  InterviewSource,
} from "@/lib/ai-interview/common";

export {
  describeApiError,
  EVALUATION_DIMENSIONS,
  EVALUATION_SCORE_MAX,
  type EvaluationDimensionKey,
  type InterviewHistoryEntry,
  type InterviewRole,
  type InterviewSource,
} from "@/lib/ai-interview/common";

const BASE = "/api/v1/employer/ai-interview";

export interface InterviewJob {
  id: string;
  title: string;
  status: string;
}

export interface StartSessionResponse {
  session_id: string;
  job: { id: string; title: string };
  first_question: string;
  source: InterviewSource;
  disclaimer: string;
}

export interface TurnResponse {
  next_question: string | null;
  /** null once the interview is done (no question was generated). */
  source: InterviewSource | null;
  turn_index: number;
  done: boolean;
}

export type EvaluateResponse = InterviewEvaluation;

export { mockInterviewJobs };

/** Jobs that can take an interview. The backend returns every non-closed job. */
export async function listInterviewJobs(): Promise<{ jobs: InterviewJob[] }> {
  const data = await employerRequest<{ items?: InterviewJob[] }>(`${BASE}/jobs`);
  if (data?.items && data.items.length > 0) return { jobs: data.items };
  return { jobs: mockInterviewJobs };
}

export async function startInterviewSession(jobId: string): Promise<StartSessionResponse> {
  return employerRequest<StartSessionResponse>(`${BASE}/sessions`, {
    method: "POST",
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function submitInterviewTurn(
  sessionId: string,
  payload: { job_id: string; history: InterviewHistoryEntry[]; answer: string },
): Promise<TurnResponse> {
  return employerRequest<TurnResponse>(`${BASE}/sessions/${encodeURIComponent(sessionId)}/turns`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function evaluateInterview(
  sessionId: string,
  payload: { job_id: string; history: InterviewHistoryEntry[] },
): Promise<EvaluateResponse> {
  return employerRequest<EvaluateResponse>(`${BASE}/sessions/${encodeURIComponent(sessionId)}/evaluate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
