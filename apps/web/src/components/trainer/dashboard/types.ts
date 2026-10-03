import type { TraineeRow } from "@/components/trainer/trainees/shared";

export interface ClassSlot {
  slot_id: string;
  course_id: string;
  course: string;
  batch: string;
  batch_id: string;
  class_id: string;
  date: string;
  start: string;
  end: string;
  start_label: string;
  end_label: string;
  room: string | null;
  trainees: number;
  attendance_status: string;
  session_id: string | null;
  present: number | null;
}

export interface DashboardData {
  trainer: { id: string; name: string };
  today: string;
  kpis: {
    todays_classes: number;
    upcoming_classes: number;
    trainees: number;
    average_attendance: number;
    attendance_delta: number;
    pending_assessments: number;
    pending_breakdown?: { attempts_to_review: number; submissions_to_grade: number };
    at_risk: number;
  };
  today_classes: ClassSlot[];
  upcoming: { tomorrow: ClassSlot[]; this_week: ClassSlot[] };
  at_risk_trainees: TraineeRow[];
  attendance_trend: { date: string; attendance: number }[];
  learning_progress: { class_id: string; course: string; batch: string; progress: number }[];
  upcoming_assessments: {
    id: string;
    title: string;
    batch: string;
    scheduled_at: string;
    questions: number;
    duration_minutes: number;
  }[];
  recent_activity: { type: string; text: string; at: string }[];
  skills: { skill: string; average: number }[];
  insights: { severity: string; text: string }[];
  unread_messages: number;
}
