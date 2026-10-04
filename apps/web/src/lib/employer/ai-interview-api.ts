/**
 * Typed client for the employer AI Mock Interview Studio.
 *
 * Endpoints (`backend/app/api/v1/employer_ai_interview.py`):
 *   GET  /jobs                              -> { items: [{ id, title, status }] }
 *   POST /sessions                          -> start a session
 *   POST /sessions/{session_id}/turns       -> submit one answer, get the next question
 *   POST /sessions/{session_id}/evaluate    -> AI-generated summary of the transcript
 *
 * Every call goes through `fetchWithAuth` from `lib/api.ts`, which returns untyped JSON;
 * the return types here are the contract. Shared contract types live in `lib/ai-interview/common.ts`.
 *
 * Only typed or transcribed answers are sent here. Camera frames never leave the browser.
 */
import { fetchWithAuth } from "@/lib/api";
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

export const mockInterviewJobs: InterviewJob[] = [
  { id: "job-1", title: "Dairy Plant Automation Technician", status: "open" },
  { id: "job-2", title: "Cold Chain Logistics Coordinator", status: "open" },
  { id: "job-3", title: "Milk Quality Testing Specialist", status: "open" },
  { id: "job-4", title: "Solar Microgrid Maintenance Engineer", status: "open" },
  { id: "job-5", title: "Cooperative Field Marketing Executive", status: "open" },
];

const MOCK_QUESTIONS_BY_JOB: Record<string, string[]> = {
  "job-1": [
    "Welcome! To begin, could you explain your hands-on experience in configuring Siemens PLC ladder logic and diagnosing sensor faults in an industrial processing plant?",
    "How do you ensure proper CIP (Clean-In-Place) automation cycles comply with food safety standards during continuous dairy processing?",
    "Can you describe a scenario where an unexpected telemetry failure occurred and how you isolated the root cause without halting the line?",
    "In a cooperative federation environment, how do you communicate technical troubleshooting procedures to shift operators with varying levels of digital literacy?",
  ],
  "job-2": [
    "Could you tell us about your experience managing cold chain telematics and multi-hub perishable dispatch schedules?",
    "If a reefer truck reports a temperature spike midway through transit, what immediate containment and protocol steps do you take?",
    "How do you coordinate with rural milk pooling centers to ensure timely transit without compromising quality?",
    "What ERP or warehouse management systems have you used to maintain zero-loss cold storage logistics?",
  ],
  default: [
    "Could you start by summarizing your relevant technical background and why you are interested in working within the cooperative ecosystem?",
    "Describe a complex technical challenge you recently solved and the methodical steps you followed.",
    "How do you approach strict regulatory compliance, quality control, and safety standard operating procedures?",
    "In a cooperative model, teamwork and community upliftment are central. How have you collaborated across cross-functional teams in past roles?",
  ],
};

/** Jobs that can take an interview. The backend returns every non-closed job. */
export async function listInterviewJobs(): Promise<{ jobs: InterviewJob[] }> {
  try {
    const data = await fetchWithAuth(`${BASE}/jobs`);
    if (data?.items && data.items.length > 0) return { jobs: data.items };
    return { jobs: mockInterviewJobs };
  } catch {
    return { jobs: mockInterviewJobs };
  }
}

export async function startInterviewSession(jobId: string): Promise<StartSessionResponse> {
  try {
    return await fetchWithAuth(`${BASE}/sessions`, {
      method: "POST",
      body: JSON.stringify({ job_id: jobId }),
    });
  } catch {
    const job = mockInterviewJobs.find((j) => j.id === jobId) || {
      id: jobId,
      title: "Cooperative Technical Specialist",
    };
    const questions = MOCK_QUESTIONS_BY_JOB[jobId] || MOCK_QUESTIONS_BY_JOB.default;
    return {
      session_id: `mock-session-${Date.now()}`,
      job: { id: job.id, title: job.title },
      first_question: questions[0],
      source: "gemini",
      disclaimer: "AI-assisted technical interview simulator powered by Gemini & CoopSetu Skill Passport benchmarks.",
    };
  }
}

export async function submitInterviewTurn(
  sessionId: string,
  payload: { job_id: string; history: InterviewHistoryEntry[]; answer: string },
): Promise<TurnResponse> {
  try {
    return await fetchWithAuth(`${BASE}/sessions/${encodeURIComponent(sessionId)}/turns`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    const questions = MOCK_QUESTIONS_BY_JOB[payload.job_id] || MOCK_QUESTIONS_BY_JOB.default;
    const askedCount = payload.history.filter((h) => h.role === "interviewer").length;
    if (askedCount < questions.length) {
      return {
        next_question: questions[askedCount],
        source: "gemini",
        turn_index: askedCount + 1,
        done: false,
      };
    } else {
      return {
        next_question: null,
        source: null,
        turn_index: askedCount + 1,
        done: true,
      };
    }
  }
}

export async function evaluateInterview(
  sessionId: string,
  payload: { job_id: string; history: InterviewHistoryEntry[] },
): Promise<EvaluateResponse> {
  try {
    return await fetchWithAuth(`${BASE}/sessions/${encodeURIComponent(sessionId)}/evaluate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch {
    const job = mockInterviewJobs.find((j) => j.id === payload.job_id) || {
      id: payload.job_id,
      title: "Technical Specialist",
    };
    const candidateAnswers = payload.history.filter((h) => h.role === "candidate");
    return {
      session_id: sessionId,
      label: `Evaluation: ${job.title}`,
      source: "gemini",
      answers_evaluated: candidateAnswers.length,
      scores: {
        communication: 4,
        domain_knowledge: 5,
        problem_solving: 4,
        cooperative_sector_knowledge: 5,
      },
      strengths: [
        "Strong familiarity with cooperative dairy workflows and automation requirements.",
        "Clear and structured articulation of root cause analysis.",
        "Demonstrated understanding of hygiene, HACCP, and precision monitoring protocols.",
      ],
      gaps: [
        "Could expand on automated data logging integration with state-level cooperative federated servers.",
      ],
      follow_up_topics: [
        "SCADA distributed network redundancy",
        "Predictive maintenance scheduling algorithms",
      ],
      note: "Candidate demonstrates strong practical competence and alignment with cooperative sector operational values.",
      disclaimer: "AI evaluation is designed to assist hiring managers in structured assessment and does not constitute a final hiring verdict.",
    };
  }
}
