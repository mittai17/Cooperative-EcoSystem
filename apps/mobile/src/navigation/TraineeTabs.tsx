import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ICON, SPACE, TEXT } from '../constants/theme';
import { TraineeTabParamList } from './types';

import { DashboardScreen } from '../screens/DashboardScreen';
import { TraineeProgrammeScreen } from '../features/schedule';
import { CoursesCatalogScreen } from '../screens/CoursesCatalogScreen';
import { CareerAIScreen } from '../screens/CareerAIScreen';
import { MeTabScreen } from '../features/profile';

import { Home, Calendar, BookOpen, Sparkles, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<TraineeTabParamList>();

export const TraineeTabs = () => {
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
        name="HomeTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Home size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProgrammeTab"
        component={TraineeProgrammeScreen}
        options={{
          tabBarLabel: 'Programme',
          tabBarIcon: ({ color }) => <Calendar size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={CoursesCatalogScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color }) => <BookOpen size={ICON.lg} color={color} />,
        }}
      />
      <Tab.Screen
        name="CareerTab"
        component={CareerAIScreen}
        options={{
          tabBarLabel: 'Career',
          tabBarIcon: ({ color }) => <Sparkles size={ICON.lg} color={color} />,
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
