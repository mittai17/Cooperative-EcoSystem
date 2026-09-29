import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ICON, SPACE, TEXT } from '../constants/theme';
import { EmployerTabParamList } from './types';

import {
  EmployerOverviewScreen,
  EmployerJobsScreen,
  TalentSearchScreen,
} from '../features/employer';
import { MeTabScreen } from '../features/profile';

import { BarChart3, Briefcase, Search, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<EmployerTabParamList>();

export const EmployerTabs = () => {
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
        name="OverviewTab"
        component={EmployerOverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color }) => <BarChart3 size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={EmployerJobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color }) => <Briefcase size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="CandidatesTab"
        component={TalentSearchScreen}
        options={{
          tabBarLabel: 'Candidates',
          tabBarIcon: ({ color }) => <Search size={ICON.lg} color={color} />,
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
