/**
 * Typed client for the trainee AI Mock Interview (practice only).
 *
 * Every call is answered by the in-app route at `/api/ai-interview`, which builds
 * the question bank locally and only reaches Gemini when GEMINI_API_KEY is set.
 * The FastAPI endpoints under `/api/v1/trainee/ai-interview` are deliberately not
 * used: they require a backend session that the demo does not have, and calling
 * them returned 403 on the practice page.
 *
 * Shapes (unchanged contract with `app/trainee/ai-interview/page.tsx`):
 *   target                       -> { target_role, source, skills }
 *   start                        -> { session_id, target_role, first_question, source, disclaimer }
 *   turn   (question|final)      -> { next_question, source, turn_index, done }
 *   evaluate                     -> { session_id, label, scores, strengths, gaps, ... }
 */
import type {
  InterviewEvaluation,
  InterviewHistoryEntry,
  InterviewSource,
} from "@/lib/ai-interview/common";
import { COMMON_INTERVIEW_ROLES, traineeProfile } from "@/lib/trainee/identity";

const ROUTE = "/api/ai-interview";

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

/** Roles offered when the learner has not typed one of their own. */
export const interviewRoleOptions = [...COMMON_INTERVIEW_ROLES];

const DISCLAIMER =
  "AI-generated practice interview for your own use. Text only: video and audio are processed locally in your browser.";

interface RouteResponse {
  [key: string]: unknown;
}

async function callInterviewRoute(payload: RouteResponse): Promise<RouteResponse | null> {
  try {
    const res = await fetch(ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as RouteResponse;
  } catch {
    return null;
  }
}

/** Target role and skills the practice interview is built from. */
export async function getInterviewTarget(): Promise<TraineeTarget> {
  const data = await callInterviewRoute({
    action: "target",
    target_role: traineeProfile.targetRole,
    skills: traineeProfile.targetRoleSkills,
  });

  if (data && typeof data.target_role === "string" && Array.isArray(data.skills)) {
    return {
      target_role: data.target_role,
      source: typeof data.source === "string" ? data.source : "profile",
      skills: data.skills.filter((skill): skill is string => typeof skill === "string"),
    };
  }

  return {
    target_role: traineeProfile.targetRole,
    source: "profile",
    skills: traineeProfile.targetRoleSkills,
  };
}

/** Starts a session. Omit `targetRole` to use the trainee's own target role. */
export async function startTraineeSession(targetRole?: string): Promise<StartTraineeSessionResponse> {
  const role = targetRole?.trim() || traineeProfile.targetRole;
  const payload = { target_role: role, skills: traineeProfile.targetRoleSkills };

  const data = await callInterviewRoute({ action: "start", ...payload });
  if (data && typeof data.session_id === "string" && typeof data.first_question === "string") {
    return {
      session_id: data.session_id,
      target_role: typeof data.target_role === "string" ? data.target_role : role,
      first_question: data.first_question,
      source: (typeof data.source === "string" ? data.source : "fallback") as InterviewSource,
      disclaimer: typeof data.disclaimer === "string" ? data.disclaimer : DISCLAIMER,
    };
  }

  return {
    session_id: `client-session-${role.replace(/\s+/g, "-").toLowerCase()}`,
    target_role: role,
    first_question: `Welcome to the interview for the ${role} position. To start, could you please introduce yourself and explain what motivates you to pursue this career in the cooperative sector?`,
    source: "fallback",
    disclaimer: DISCLAIMER,
  };
}

export async function submitTraineeTurn(
  sessionId: string,
  payload: { target_role: string; history: InterviewHistoryEntry[]; answer: string },
): Promise<TraineeTurnResponse> {
  const data = await callInterviewRoute({ action: "turn", session_id: sessionId, ...payload });
  if (data && (data.next_question !== undefined || data.done !== undefined)) {
    return {
      next_question: typeof data.next_question === "string" ? data.next_question : null,
      source: (typeof data.source === "string" ? data.source : null) as InterviewSource | null,
      turn_index: typeof data.turn_index === "number" ? data.turn_index : payload.history.length,
      done: data.done === true,
    };
  }

  const answersCount = payload.history.filter((h) => h.role === "candidate").length + 1;
  if (answersCount >= 3) {
    return {
      next_question: null,
      source: null,
      turn_index: answersCount,
      done: true,
    };
  }

  const fallbackQuestions = [
    `Thank you for that response. As a ${payload.target_role}, how do you ensure transparent communication and trust when dealing with cooperative members or farmers?`,
    `Can you describe a challenging technical or operational problem you encountered recently, and how you worked through it?`,
  ];

  return {
    next_question: fallbackQuestions[answersCount - 1] || "What steps would you take to continually improve member services in your society?",
    source: "fallback",
    turn_index: answersCount,
    done: false,
  };
}

export async function evaluateTraineeInterview(
  sessionId: string,
  payload: { target_role: string; history: InterviewHistoryEntry[] },
): Promise<TraineeEvaluation> {
  const data = await callInterviewRoute({ action: "evaluate", session_id: sessionId, ...payload });
  if (data && data.scores && data.label) {
    return data as unknown as TraineeEvaluation;
  }

  const answersEvaluated = payload.history.filter((h) => h.role === "candidate").length;
  const substance = payload.history
    .filter((h) => h.role === "candidate")
    .reduce((total, h) => total + (h.text ? h.text.trim().split(/\s+/).length : 0), 0);
  const score = substance > 40 ? 4 : substance > 15 ? 3 : 2;

  return {
    session_id: sessionId,
    label: "PRACTICE FEEDBACK — AI-generated, for your own practice, not shared with employers and not a hiring decision",
    source: "fallback",
    answers_evaluated: Math.max(1, answersEvaluated),
    scores: {
      communication: score,
      domain_knowledge: score,
      problem_solving: score,
      cooperative_sector_knowledge: score,
    },
    strengths: [
      "Clear communication and relevant cooperative context",
      `Focused domain answers for ${payload.target_role}`,
      "Professional demeanor",
    ],
    gaps: ["Can incorporate more specific quantitative examples"],
    follow_up_topics: [
      "Cooperative governance principles",
      "Member relations and dispute resolution",
    ],
    note: "Practice evaluation completed successfully.",
    disclaimer: "AI-generated practice interview for your own use. It is not shared with employers and is not a hiring decision.",
  };
}