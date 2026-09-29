export interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  duration_hours: number;
  instructor: string;
  rating?: number | null;
  enrolled?: number;
  skills: string[];
  thumbnail?: string;
  progress?: number;
  /** true when the signed-in trainee has an enrollment (backend `enrolled_by_me`) */
  enrolled_by_me?: boolean;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  video_url?: string;
  summary?: string;
}

export interface JobMatch {
  id: string;
  title: string;
  employer: string;
  location: string;
  sector: string;
  type: string;
  salary: string;
  skills_required: string[];
  openings?: number;
  posted_days_ago?: number;
  match_percentage?: number;
  /** true when the signed-in trainee already applied */
  applied?: boolean;
}

export interface SkillPassportItem {
  name: string;
  level: string;
  confidence: number;
  verified: boolean;
  category: string;
  evidence: {
    type: string;
    title: string;
    date: string;
  }[];
}

export interface SkillPassportData {
  skills: SkillPassportItem[];
  summary: {
    total_skills: number;
    verified_count: number;
    avg_confidence: number;
  };
}

export interface CertificateItem {
  id: string;
  holder_name: string;
  programme_title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  status: string;
  grade?: string;
  skills_certified: string[];
  verification_url?: string;
}

export interface AttendanceRecordItem {
  date: string;
  session: string;
  status: 'present' | 'absent' | 'late';
  method: string;
  timestamp?: string;
}

export interface CareerChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  /** system note (network/backend failure), not advisor content */
  error?: boolean;
  suggested_actions?: {
    label: string;
    actionKey: string;
  }[];
}

export interface CareerPlanStep {
  step: number;
  title: string;
  status: 'completed' | 'current' | 'next' | 'target' | 'future';
  timeline?: string;
}

export interface CareerRecommendation {
  priority: number;
  type: 'course' | 'assessment';
  title: string;
  reason: string;
  duration: string;
  impact: string;
}

export interface OfflinePackage {
  course_id: string;
  title: string;
  version?: string | number;
  size_kb?: number;
  lesson_count?: number;
  downloaded: boolean;
  downloaded_at?: string | null;
  /** full course incl. modules, stored locally when downloaded */
  course: Course;
}

export type AppRole = 'trainee' | 'trainer' | 'institution' | 'employer' | 'admin' | 'ncct_admin' | string;

/** trainee block of GET /auth/me */
export interface TraineeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  enrolled_institution: string;
  programme: string;
  avatar_initials: string;
}

/** Signed-in local identity resolved by GET /auth/me (backend user row). */
export interface AuthUser {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  role: AppRole;
  organisation: { id: string; name: string; type: string } | null;
  trainee: TraineeProfile | null;
}
