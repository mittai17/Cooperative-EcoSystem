import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { CoursesCatalogScreen } from '../screens/CoursesCatalogScreen';
import { CoursePlayerScreen } from '../screens/CoursePlayerScreen';
import { QRAttendanceScreen } from '../screens/QRAttendanceScreen';
import { CareerAIScreen } from '../screens/CareerAIScreen';
import { JobMatchesScreen } from '../screens/JobMatchesScreen';
import { SkillPassportScreen } from '../screens/SkillPassportScreen';
import { OfflineLearningScreen } from '../screens/OfflineLearningScreen';
import { CertificatesScreen } from '../screens/CertificatesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Icons
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Award,
  Sparkles,
  User,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesCatalogScreen}
        options={{
          tabBarLabel: 'Learning',
          tabBarIcon: ({ color, size }) => <BookOpen size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="PassportTab"
        component={SkillPassportScreen}
        options={{
          tabBarLabel: 'Passport',
          tabBarIcon: ({ color, size }) => <Award size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobMatchesScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="CoursePlayer" component={CoursePlayerScreen} />
        <Stack.Screen name="QRScan" component={QRAttendanceScreen} />
        <Stack.Screen name="CareerAI" component={CareerAIScreen} />
        <Stack.Screen name="Offline" component={OfflineLearningScreen} />
        <Stack.Screen name="Certificates" component={CertificatesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
