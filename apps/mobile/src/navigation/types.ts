import { NavigatorScreenParams } from '@react-navigation/native';

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
  AssessmentResult: { attemptId: string };
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
  NominationReview: { nominationId: string };
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
