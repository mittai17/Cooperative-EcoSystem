export interface AssessmentQuestion {
  id: string;
  position: number;
  type: 'single_choice' | 'multiple_choice';
  prompt: string;
  options: string[];
  marks: number;
  topic: string;
  correct?: string[];
  explanation?: string;
}

export interface AssessmentInfo {
  id: string;
  title: string;
  skill_name?: string;
  duration_minutes: number;
  passing_score: number;
  max_attempts: number;
  due_date?: string | null;
  questions: number;
  instructions?: string[];
}

export interface AssessmentAttemptData {
  attempt_id: string;
  assessment_id: string;
  expires_at: string;
  server_time: string;
  questions: AssessmentQuestion[];
}

export interface CompetencyBreakdown {
  earned: number;
  possible: number;
}

export interface QuestionReviewItem {
  question_id: string;
  prompt?: string;
  answer: string[];
  correctly_answered: boolean;
  correct?: string[];
  explanation?: string;
}

export interface AssessmentResultData {
  attempt_id: string;
  assessment_id: string;
  score: number;
  passed: boolean;
  skill_updated?: string | null;
  topic_breakdown: Record<string, CompetencyBreakdown>;
  review: QuestionReviewItem[];
}

export interface TraineeEligibilityCheck {
  trainee_id: string;
  trainee_name: string;
  attendance_pct: number;
  min_attendance_pct: number;
  mandatory_courses_completed: number;
  mandatory_courses_total: number;
  assessments_passed: number;
  assessments_total: number;
  eligible: boolean;
  checks: {
    enrolled: boolean;
    attendance: boolean;
    courses: boolean;
    assessments: boolean;
    not_already_issued: boolean;
  };
}
