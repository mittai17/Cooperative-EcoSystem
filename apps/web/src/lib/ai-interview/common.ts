/**
 * Shared contract types and helpers for the AI Mock Interview studio.
 * Used by the employer studio (`lib/employer/ai-interview-api.ts`) and the
 * trainee studio (`lib/trainee/ai-interview-api.ts`).
 */

/** Wire roles expected by the backend `TurnIn` model. */
export type InterviewRole = "interviewer" | "candidate";

/** One entry of the conversation. The full list is posted with every turn. */
export interface InterviewHistoryEntry {
  role: InterviewRole;
  text: string;
}

/** "gemini" when the model answered, "fallback" when canned questions were used. */
export type InterviewSource = string;

export type EvaluationDimensionKey =
  | "communication"
  | "domain_knowledge"
  | "problem_solving"
  | "cooperative_sector_knowledge";

export const EVALUATION_DIMENSIONS: { key: EvaluationDimensionKey; label: string }[] = [
  { key: "communication", label: "Communication" },
  { key: "domain_knowledge", label: "Domain Knowledge" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "cooperative_sector_knowledge", label: "Cooperative Sector Knowledge" },
];

/** Scores are 1-5 per dimension; null means the model did not score it. */
export const EVALUATION_SCORE_MAX = 5;

export interface InterviewEvaluation {
  session_id: string;
  label: string;
  source: InterviewSource;
  answers_evaluated: number;
  scores: Partial<Record<EvaluationDimensionKey, number | null>>;
  strengths: string[];
  gaps: string[];
  follow_up_topics: string[];
  note: string | null;
  disclaimer: string;
}

const STATUS_PATTERN = /API Error: (\d{3})\s*(.*)$/;

/** Readable message for an error thrown by the API helper (`fetchWithAuth` in `lib/api.ts`). */
export function describeApiError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const match = STATUS_PATTERN.exec(err.message);
  if (match) {
    const status = match[1];
    const statusText = match[2].trim();
    return `${fallback} (server responded ${status}${statusText ? ` ${statusText}` : ""}).`;
  }
  // Network failures surface as TypeError("Failed to fetch") in browsers.
  if (err.name === "TypeError") {
    return `${fallback} Check your connection and try again.`;
  }
  return err.message || fallback;
}
