import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ICON, SPACE, TEXT } from '../constants/theme';
import { AdminTabParamList } from './types';

import {
  NationalOverviewScreen,
  InstitutionsLeagueScreen,
  SkillDemandScreen,
} from '../features/analytics';
import { MeTabScreen } from '../features/profile';

import { Globe, Building2, TrendingUp, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export const AdminTabs = () => {
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
        name="NationalTab"
        component={NationalOverviewScreen}
        options={{
          tabBarLabel: 'National',
          tabBarIcon: ({ color }) => <Globe size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="InstitutionsTab"
        component={InstitutionsLeagueScreen}
        options={{
          tabBarLabel: 'Institutions',
          tabBarIcon: ({ color }) => <Building2 size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="DemandTab"
        component={SkillDemandScreen}
        options={{
          tabBarLabel: 'Demand',
          tabBarIcon: ({ color }) => <TrendingUp size={ICON.lg} color={color} />,
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
