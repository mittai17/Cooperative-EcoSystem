import { NavigatorScreenParams } from '@react-navigation/native';
import { AssessmentResultData } from '../features/assessments/assessmentTypes';

// ---------------------------------------------------------------------------
// Role-based Bottom Tab Param Lists
// ---------------------------------------------------------------------------

export type TraineeTabParamList = {
  HomeTab: undefined;
  ProgrammeTab: undefined;
  LearnTab: undefined;
  CareerTab: undefined;
  MeTab: undefined;
};

export type TrainerTabParamList = {
  TodayTab: undefined;
  AttendanceTab: undefined;
  TraineesTab: undefined;
  MeTab: undefined;
};

export type InstitutionTabParamList = {
  OverviewTab: undefined;
  NominationsTab: undefined;
  ProgrammesTab: undefined;
  OperationsTab: undefined;
  MeTab: undefined;
};

export type EmployerTabParamList = {
  OverviewTab: undefined;
  JobsTab: undefined;
  CandidatesTab: undefined;
  MeTab: undefined;
};

export type AdminTabParamList = {
  NationalTab: undefined;
  InstitutionsTab: undefined;
  DemandTab: undefined;
  MeTab: undefined;
};

// ---------------------------------------------------------------------------
// Root Stack Param List (All possible routes across all roles)
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  // Shells
  TraineeTabs: NavigatorScreenParams<TraineeTabParamList>;
  TrainerTabs: NavigatorScreenParams<TrainerTabParamList>;
  InstitutionTabs: NavigatorScreenParams<InstitutionTabParamList>;
  EmployerTabs: NavigatorScreenParams<EmployerTabParamList>;
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;

  // Common Stack Routes
  Login: undefined;
  Register: { role?: string } | undefined;
  Inbox: undefined;
  LanguageSettings: undefined;
  SyncStorage: undefined;
  ProfileEdit: { section?: string } | undefined;
  VerifyCertificate: { code?: string } | undefined;

  // Trainee Stack Routes
  ProgrammeDetail: { programmeId: string };
  NominationForm: { programmeId: string };
  MyNominations: undefined;
  NominationDetail: { nominationId: string };
  Attend: { sessionId?: string; method?: 'qr' | 'nfc' | 'face' } | undefined;
  AttendanceHistory: undefined;
  FaceEnrol: { mode: 'self' | 'trainer'; traineeId?: string };
  HostelRequest: undefined;
  CourseDetail: { courseId: string };
  LessonPlayer: { courseId: string; lessonId: string; lang?: string };
  AssessmentIntro: { assessmentId: string };
  AssessmentAttempt: { attemptId: string };
  // `result` is the already-graded result from the real submitAttempt() call in
  // AssessmentAttemptScreen. The backend's submit endpoint is one-shot (it 409s
  // on a closed attempt), so AssessmentResultScreen must not call it again —
  // it renders this passed-in result instead of re-fetching.
  AssessmentResult: { attemptId: string; result?: AssessmentResultData };
  Certificates: undefined;
  CertificateDetail: { code: string };
  Passport: undefined;
  JobDetail: { jobId: string };
  MyApplications: undefined;

  // Trainer Stack Routes
  StartSession: { slotId?: string } | undefined;
  SessionConsole: { sessionId: string };
  BatchRoster: { batchId: string };
  TraineeDetail: { traineeId: string };

  // Institution Stack Routes
  //
  // `nomination` is the real row from GET /programmes/nominations/list
  // (NominationInboxScreen), passed through so NominationReviewScreen renders
  // real data instead of re-deriving it from a mock lookup by id. That list
  // endpoint only returns these fields — there is no richer nomination-detail
  // endpoint (designation/contact/society/justification) as of this pass.
  NominationReview: {
    nominationId: string;
    nomination?: {
      id?: string;
      programme_id: string;
      programme_title: string;
      trainee_id: string;
      trainee_name: string;
      status: string;
      batch_id: string | null;
      submitted_at: string | null;
    };
  };
  BatchDetail: { batchId: string };
  Certification: { batchId: string };
  ScheduleChange: { slotId: string; date: string };
  HostelWaitlist: undefined;
  LogisticsChecklist: undefined;

  // Employer Stack Routes
  JobEditor: { jobId?: string } | undefined;
  JobApplicants: { jobId: string };
  CandidateDetail: { traineeId: string; jobId?: string };
  TalentSearch: undefined;
  PlacementFeedback: { applicationId: string };

  // Admin Stack Routes
  InstitutionAnalytics: { orgId: string };

  // Legacy route aliases for backward compatibility
  CoursePlayer: { courseId?: string; lessonId?: string } | undefined;
  QRScan: undefined;
  Offline: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: { role?: string } | undefined;
  VerifyCertificate: { code?: string } | undefined;
};
