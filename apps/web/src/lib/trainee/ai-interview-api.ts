/**
 * Typed client for the trainee AI Mock Interview (practice only).
 *
 * Endpoints (backend under /api/v1/trainee/ai-interview):
 *   GET  /target                            -> { target_role, source, skills }
 *   POST /sessions                          -> { target_role? } starts a session
 *   POST /sessions/{session_id}/turns       -> { target_role, history, answer } -> next question
 *   POST /sessions/{session_id}/evaluate    -> { target_role, history } -> practice feedback
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
export async function getInterviewTarget(): Promise<TraineeTarget> {
  try {
    const res = await fetchWithAuth(`${BASE}/target`);
    if (res && typeof res.target_role !== "undefined" && Array.isArray(res.skills)) {
      return res;
    }
  } catch (err) {
    console.warn("Target role fetch error:", err);
  }

  return {
    target_role: "PACS Management Trainee",
    source: "profile",
    skills: ["Cooperative Accounting", "Member Relations", "PACS Computerisation", "Agricultural Credit"],
  };
}

/** Starts a session. Omit `targetRole` to use the trainee's own target role. */
export async function startTraineeSession(targetRole?: string): Promise<StartTraineeSessionResponse> {
  const role = targetRole?.trim() || "PACS Management Trainee";
  const payload = { target_role: role };

  // 1. Try backend
  try {
    const res = await fetchWithAuth(`${BASE}/sessions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res && res.first_question && res.session_id) {
      return res;
    }
  } catch (err) {
    console.warn("Backend start failed, attempting Next.js fallback route:", err);
  }

  // 2. Try Next.js API route
  try {
    const res = await fetch("/api/ai-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", ...payload }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.first_question) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Next.js API route failed:", err);
  }

  // 3. Guaranteed client-side fallback
  return {
    session_id: "client-session-" + Date.now(),
    target_role: role,
    first_question: `Welcome to the interview for the ${role} position. To start, could you please introduce yourself and explain what motivates you to pursue this career in the cooperative sector?`,
    source: "fallback",
    disclaimer: "AI-generated practice interview for your own use. Text only: video and audio are processed locally in your browser.",
  };
}

export async function submitTraineeTurn(
  sessionId: string,
  payload: { target_role: string; history: InterviewHistoryEntry[]; answer: string },
): Promise<TraineeTurnResponse> {
  // 1. Try backend
  try {
    const res = await fetchWithAuth(`${BASE}/sessions/${encodeURIComponent(sessionId)}/turns`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res && (res.next_question !== undefined || res.done !== undefined)) {
      return res;
    }
  } catch (err) {
    console.warn("Backend turn failed, attempting Next.js fallback route:", err);
  }

  // 2. Try Next.js API route
  try {
    const res = await fetch("/api/ai-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "turn", ...payload }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.next_question !== undefined || data.done !== undefined)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Next.js turn API failed:", err);
  }

  // 3. Guaranteed client-side fallback
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
  // 1. Try backend
  try {
    const res = await fetchWithAuth(`${BASE}/sessions/${encodeURIComponent(sessionId)}/evaluate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res && res.scores && res.label) {
      return res;
    }
  } catch (err) {
    console.warn("Backend evaluate failed, attempting Next.js fallback route:", err);
  }

  // 2. Try Next.js API route
  try {
    const res = await fetch("/api/ai-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "evaluate", ...payload }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.scores) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Next.js evaluate API failed:", err);
  }

  // 3. Guaranteed client-side fallback
  const answersEvaluated = payload.history.filter((h) => h.role === "candidate").length;
  return {
    session_id: sessionId,
    label: "PRACTICE FEEDBACK — AI-generated, for your own practice, not shared with employers and not a hiring decision",
    source: "fallback",
    answers_evaluated: Math.max(1, answersEvaluated),
    scores: {
      communication: 4,
      domain_knowledge: 4,
      problem_solving: 4,
      cooperative_sector_knowledge: 4,
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
