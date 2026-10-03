export interface AssignmentItem {
  id: string;
  title: string;
  description: string | null;
  batch: string | null;
  batch_id: string;
  course: string | null;
  deadline: string | null;
  overdue: boolean;
  max_marks: number;
  status: string;
  assigned: number;
  submitted: number;
  pending: number;
  graded: number;
  to_grade: number;
}

export interface AssignmentDetail {
  assignment: {
    id: string;
    title: string;
    description: string | null;
    batch: string | null;
    course: string | null;
    deadline: string | null;
    max_marks: number;
    resources: { title: string; url: string }[];
    status: string;
  };
  totals: { assigned: number; submitted: number; pending: number; graded: number; to_grade: number; avg_marks: number | null };
  rows: {
    trainee_id: string;
    trainee: string;
    submission_id: string | null;
    status: "pending" | "submitted" | "late" | "graded";
    submitted_at: string | null;
    content: string | null;
    file_url: string | null;
    marks: number | null;
    feedback: string | null;
  }[];
}
