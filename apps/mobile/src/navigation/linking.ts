import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'coopsetu://', 'https://coopsetu.in', 'https://*.coopsetu.in'],
  config: {
    screens: {
      // Role Shells
      TraineeTabs: {
        screens: {
          HomeTab: 'home',
          ProgrammeTab: 'programme',
          LearnTab: 'learn',
          CareerTab: 'career',
          MeTab: 'me',
        },
      },
      TrainerTabs: {
        screens: {
          TodayTab: 'trainer/today',
          AttendanceTab: 'trainer/attendance',
          TraineesTab: 'trainer/trainees',
          MeTab: 'trainer/me',
        },
      },
      InstitutionTabs: {
        screens: {
          OverviewTab: 'institution/overview',
          NominationsTab: 'institution/nominations',
          ProgrammesTab: 'institution/programmes',
          OperationsTab: 'institution/operations',
          MeTab: 'institution/me',
        },
      },
      EmployerTabs: {
        screens: {
          OverviewTab: 'employer/overview',
          JobsTab: 'employer/jobs',
          CandidatesTab: 'employer/candidates',
          MeTab: 'employer/me',
        },
      },
      AdminTabs: {
        screens: {
          NationalTab: 'admin/national',
          InstitutionsTab: 'admin/institutions',
          DemandTab: 'admin/demand',
          MeTab: 'admin/me',
        },
      },

      // Auth & Common Routes
      Login: 'login',
      Register: 'register',
      Inbox: 'inbox',
      LanguageSettings: 'settings/language',
      SyncStorage: 'storage/sync',
      ProfileEdit: 'profile/edit',
      VerifyCertificate: 'verify/:code?',

      // Trainee Routes
      ProgrammeDetail: 'programme/:programmeId',
      NominationForm: 'nominate/:programmeId',
      MyNominations: 'nominations/my',
      NominationDetail: 'nominations/:nominationId',
      Attend: 'attend',
      AttendanceHistory: 'attendance/history',
      FaceEnrol: 'face/enrol',
      HostelRequest: 'hostel/request',
      CourseDetail: 'course/:courseId',
      LessonPlayer: 'course/:courseId/lesson/:lessonId',
      AssessmentIntro: 'assessment/:assessmentId',
      AssessmentAttempt: 'assessment/attempt/:attemptId',
      AssessmentResult: 'assessment/result/:attemptId',
      Certificates: 'certificates',
      CertificateDetail: 'certificate/:code',
      Passport: 'passport',
      JobDetail: 'jobs/:jobId',
      MyApplications: 'jobs/applications/my',

      // Trainer Routes
      StartSession: 'trainer/session/start',
      SessionConsole: 'trainer/session/:sessionId',
      BatchRoster: 'trainer/batch/:batchId',
      TraineeDetail: 'trainee/:traineeId',

      // Institution Routes
      NominationReview: 'institution/nomination/:nominationId',
      BatchDetail: 'institution/batch/:batchId',
      Certification: 'institution/certification/:batchId',
      ScheduleChange: 'institution/schedule-change/:slotId/:date',
      HostelWaitlist: 'institution/hostel-waitlist',
      LogisticsChecklist: 'institution/logistics',

      // Employer Routes
      JobEditor: 'employer/job/edit/:jobId?',
      JobApplicants: 'employer/job/:jobId/applicants',
      CandidateDetail: 'candidate/:traineeId',
      TalentSearch: 'employer/talent-search',
      PlacementFeedback: 'employer/feedback/:applicationId',

      // Admin Routes
      InstitutionAnalytics: 'admin/institution/:orgId',

      // Legacy Aliases
      CoursePlayer: 'player',
      QRScan: 'qr-scan',
      Offline: 'offline',
    },
  },
};
