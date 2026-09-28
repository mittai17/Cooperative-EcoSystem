export interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  duration_hours: number;
  instructor: string;
  rating: number;
  enrolled: number;
  skills: string[];
  thumbnail?: string;
  progress?: number;
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
  openings: number;
  posted_days_ago: number;
  match_percentage?: number;
}

export interface SkillPassportItem {
  name: string;
  level: string;
  confidence: number;
  verified: boolean;
  category: string;
  evidence: Array<{
    type: string;
    title: string;
    date: string;
  }>;
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

export interface OfflineCourseItem {
  id: string;
  title: string;
  size_mb: number;
  modules_count: number;
  last_synced: string;
  download_status: 'downloaded' | 'syncing' | 'pending';
}

export interface CareerChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggested_actions?: Array<{
    label: string;
    actionKey: string;
  }>;
}

export interface CareerPlanStep {
  step: number;
  title: string;
  status: 'completed' | 'current' | 'next' | 'future';
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
