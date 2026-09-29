import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { COLORS } from '../constants/theme';
import { AuthStackParamList, RootStackParamList } from './types';
import { linking } from './linking';

// Auth
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AuthProvider } from './AuthProvider';
import { LanguageSettingsScreen } from './LanguageSettingsScreen';
import { useAuthContext } from './AuthContext';

// Role Tab Bars
import { TraineeTabs } from './TraineeTabs';
import { TrainerTabs } from './TrainerTabs';
import { InstitutionTabs } from './InstitutionTabs';
import { EmployerTabs } from './EmployerTabs';
import { AdminTabs } from './AdminTabs';

// Feature Screens & Stubs
import {
  ProgrammeDetailScreen,
  NominationFormScreen,
  MyNominationsScreen,
  NominationDetailScreen,
  NominationReviewScreen,
} from '../features/programmes';

import {
  ScheduleChangeScreen,
  HostelRequestScreen,
  HostelWaitlistScreen,
  LogisticsChecklistScreen,
  InboxScreen,
} from '../features/schedule';

import {
  CourseDetailScreen,
  LessonPlayerScreen,
} from '../features/learning';

import {
  AssessmentIntroScreen,
  AssessmentAttemptScreen,
  AssessmentResultScreen,
  CertificationScreen,
} from '../features/assessments';

import {
  CertificatesScreen,
  CertificateDetailScreen,
  VerifyCertificateScreen,
} from '../features/certificates';

import {
  ProfileEditScreen,
  TraineeDetailScreen,
  BatchRosterScreen,
} from '../features/profile';

import {
  AttendScreen,
  AttendanceHistoryScreen,
  StartSessionScreen,
  SessionConsoleScreen,
  FaceEnrolScreen,
} from '../features/attendance';

import {
  SyncStorageScreen,
  ConnectivityBanner,
} from '../features/offline';

import {
  JobEditorScreen,
  JobApplicantsScreen,
  CandidateDetailScreen,
  TalentSearchScreen,
  PlacementFeedbackScreen,
} from '../features/employer';

import {
  InstitutionAnalyticsScreen,
} from '../features/analytics';

import {
  JobDetailScreen,
  MyApplicationsScreen,
  SkillPassportScreen,
} from '../features/career';

// Legacy screens preserved
import { CoursePlayerScreen } from '../screens/CoursePlayerScreen';
import { QRAttendanceScreen } from '../screens/QRAttendanceScreen';
import { OfflineLearningScreen } from '../screens/OfflineLearningScreen';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.background, primary: COLORS.primary },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

function MainStack() {
  const { role } = useAuthContext();

  const getInitialRoute = (): keyof RootStackParamList => {
    switch (role) {
      case 'trainer':
        return 'TrainerTabs';
      case 'institution':
        return 'InstitutionTabs';
      case 'employer':
        return 'EmployerTabs';
      case 'admin':
        return 'AdminTabs';
      case 'trainee':
      default:
        return 'TraineeTabs';
    }
  };

  return (
    <>
      <ConnectivityBanner />
      <Stack.Navigator
        key={role ?? 'trainee'}
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Role Shells */}
        <Stack.Screen name="TraineeTabs" component={TraineeTabs} />
        <Stack.Screen name="TrainerTabs" component={TrainerTabs} />
        <Stack.Screen name="InstitutionTabs" component={InstitutionTabs} />
        <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />

        {/* Common Stack Routes */}
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
        <Stack.Screen name="SyncStorage" component={SyncStorageScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="VerifyCertificate" component={VerifyCertificateScreen} />

        {/* Trainee Stack Routes */}
        <Stack.Screen name="ProgrammeDetail" component={ProgrammeDetailScreen} />
        <Stack.Screen name="NominationForm" component={NominationFormScreen} />
        <Stack.Screen name="MyNominations" component={MyNominationsScreen} />
        <Stack.Screen name="NominationDetail" component={NominationDetailScreen} />
        <Stack.Screen name="Attend" component={AttendScreen} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
        <Stack.Screen name="FaceEnrol" component={FaceEnrolScreen} />
        <Stack.Screen name="HostelRequest" component={HostelRequestScreen} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="LessonPlayer" component={LessonPlayerScreen} />
        <Stack.Screen name="AssessmentIntro" component={AssessmentIntroScreen} />
        <Stack.Screen name="AssessmentAttempt" component={AssessmentAttemptScreen} />
        <Stack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
        <Stack.Screen name="Certificates" component={CertificatesScreen} />
        <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} />
        <Stack.Screen name="Passport" component={SkillPassportScreen} />
        <Stack.Screen name="JobDetail" component={JobDetailScreen} />
        <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />

        {/* Trainer Stack Routes */}
        <Stack.Screen name="StartSession" component={StartSessionScreen} />
        <Stack.Screen name="SessionConsole" component={SessionConsoleScreen} />
        <Stack.Screen name="BatchRoster" component={BatchRosterScreen} />
        <Stack.Screen name="TraineeDetail" component={TraineeDetailScreen} />

        {/* Institution Stack Routes */}
        <Stack.Screen name="NominationReview" component={NominationReviewScreen} />
        <Stack.Screen name="BatchDetail" component={BatchRosterScreen} />
        <Stack.Screen name="Certification" component={CertificationScreen} />
        <Stack.Screen name="ScheduleChange" component={ScheduleChangeScreen} />
        <Stack.Screen name="HostelWaitlist" component={HostelWaitlistScreen} />
        <Stack.Screen name="LogisticsChecklist" component={LogisticsChecklistScreen} />

        {/* Employer Stack Routes */}
        <Stack.Screen name="JobEditor" component={JobEditorScreen} />
        <Stack.Screen name="JobApplicants" component={JobApplicantsScreen} />
        <Stack.Screen name="CandidateDetail" component={CandidateDetailScreen} />
        <Stack.Screen name="TalentSearch" component={TalentSearchScreen} />
        <Stack.Screen name="PlacementFeedback" component={PlacementFeedbackScreen} />

        {/* Admin Stack Routes */}
        <Stack.Screen name="InstitutionAnalytics" component={InstitutionAnalyticsScreen} />

        {/* Legacy Aliases */}
        <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
        <Stack.Screen name="QRScan" component={QRAttendanceScreen} />
        <Stack.Screen name="Offline" component={OfflineLearningScreen} />
      </Stack.Navigator>
    </>
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
      <AuthStackNav.Screen name="VerifyCertificate" component={VerifyCertificateScreen} />
    </AuthStackNav.Navigator>
  );
}

export function AppNavigator() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        renderSignedOut={() => (
          <NavigationContainer theme={navTheme} linking={linking}>
            <AuthStack />
          </NavigationContainer>
        )}
        renderSignedIn={() => (
          <NavigationContainer theme={navTheme} linking={linking}>
            <MainStack />
          </NavigationContainer>
        )}
      />
    </QueryClientProvider>
  );
}
