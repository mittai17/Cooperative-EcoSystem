import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ICON, SPACE, TEXT } from '../constants/theme';
import { TrainerTabParamList } from './types';

import { TodayScheduleScreen } from '../features/schedule';
import { AttendanceSessionsScreen } from '../features/attendance';
import {
  BatchRosterScreen,
  MeTabScreen,
} from '../features/profile';

import { Calendar, CheckCircle2, Users, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<TrainerTabParamList>();

export const TrainerTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + SPACE.xs,
          paddingTop: SPACE.xs,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: TEXT.caption.fontSize,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayScheduleScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => <Calendar size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceSessionsScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color }) => <CheckCircle2 size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="TraineesTab"
        component={BatchRosterScreen}
        options={{
          tabBarLabel: 'Trainees',
          tabBarIcon: ({ color }) => <Users size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="MeTab"
        component={MeTabScreen}
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color }) => <User size={ICON.lg} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
