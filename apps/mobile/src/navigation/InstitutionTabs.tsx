import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ICON, SPACE, TEXT } from '../constants/theme';
import { InstitutionTabParamList } from './types';

import { InstitutionsLeagueScreen } from '../features/analytics';
import {
  NominationInboxScreen,
  ProgrammeCatalogScreen,
} from '../features/programmes';
import { OperationsScreen } from '../features/schedule';
import { MeTabScreen } from '../features/profile';

import { BarChart3, Inbox, GraduationCap, Sliders, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<InstitutionTabParamList>();

export const InstitutionTabs = () => {
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
        component={InstitutionsLeagueScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color }) => <BarChart3 size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="NominationsTab"
        component={NominationInboxScreen}
        options={{
          tabBarLabel: 'Nominations',
          tabBarIcon: ({ color }) => <Inbox size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProgrammesTab"
        component={ProgrammeCatalogScreen}
        options={{
          tabBarLabel: 'Programmes',
          tabBarIcon: ({ color }) => <GraduationCap size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="OperationsTab"
        component={OperationsScreen}
        options={{
          tabBarLabel: 'Operations',
          tabBarIcon: ({ color }) => <Sliders size={ICON.lg} color={color} />,
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
