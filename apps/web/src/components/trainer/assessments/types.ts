export interface ClassOption {
  batch_id: string;
  batch: string;
  course_id: string;
  course: string;
}

export type QuestionType = "mcq_single" | "mcq_multi" | "true_false" | "short_answer" | "practical";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface AssessmentListItem {
  id: string;
  title: string;
  course: string | null;
  module: string | null;
  batch: string | null;
  questions: number;
  duration_minutes: number;
  passing_score: number;
  scheduled_at: string | null;
  status: string;
  group: "upcoming" | "drafts" | "published" | "completed";
  submitted: number;
  total: number;
  needs_review: number;
  avg_score: number | null;
}

export interface AssessmentList {
  counts: { upcoming: number; drafts: number; published: number; completed: number };
  assessments: AssessmentListItem[];
}

export interface DetailQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[] | null;
  correct: string[];
  explanation: string | null;
  marks: number;
}

export interface AssessmentDetail {
  assessment: {
    id: string;
    title: string;
    course: string | null;
    course_id: string;
    module: string | null;
    batch: string | null;
    batch_id: string;
    description: string | null;
    instructions: string | null;
    duration_minutes: number;
    passing_score: number;
    scheduled_at: string | null;
    status: string;
    questions: DetailQuestion[];
  };
  totals: {
    total_trainees: number;
    submitted: number;
    pending: number;
    needs_review: number;
    avg_score: number | null;
    pass_rate: number | null;
  };
  rows: {
    trainee_id: string;
    trainee: string;
    score: number | null;
    status: "Passed" | "Failed" | "Needs Review" | "Pending";
    attempt_no: number | null;
    submitted_at: string | null;
    attempt_id: string | null;
  }[];
}

export interface AttemptDetail {
  assessment: { id: string; title: string; passing_score: number };
  attempt: { id: string; attempt_no: number; status: string; score: number | null; passed: boolean | null; submitted_at: string | null; result: string };
  trainee: { id: string; name: string };
  overall_feedback: string | null;
  questions: {
    id: string;
    position: number;
    type: QuestionType;
    prompt: string;
    options: QuestionOption[] | null;
    trainee_answer: unknown;
    expected: string[];
    explanation: string | null;
    max_marks: number;
    auto_graded: boolean;
    auto_marks: number | null;
    manual_grade: { marks: number; feedback: string | null; graded_at: string | null } | null;
  }[];
}

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq_single: "Multiple choice",
  mcq_multi: "Multi-select",
  true_false: "True / False",
  short_answer: "Short answer",
  practical: "Practical",
};

export function fmtIst(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: true } : {}),
  }).format(new Date(iso));
}

/** ISO instant -> value for <input type="datetime-local"> in IST. */
export function toIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return p.replace(" ", "T");
}
