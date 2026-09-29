import React, { useState } from 'react';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeatureStubScreen } from '../../components/FeatureStubScreen';
import { RootStackParamList } from '../../navigation/types';
import { useAuthContext } from '../../navigation/AuthContext';
import { COLORS, SPACE, TEXT, RADII, ICON } from '../../constants/theme';
import {
  User,
  Globe,
  HardDrive,
  LogOut,
  ChevronRight,
  Award,
  Shield,
  Repeat,
  Sparkles,
} from 'lucide-react-native';
import { DemoRoleSwitcherModal } from '../../components/DemoRoleSwitcherModal';

export const MeTabScreen = () => {
  const { user, isDemo, signOut } = useAuthContext();
  const navigation = useNavigation<any>();
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) ?? 'U'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{user?.fullName ?? 'User'}</Text>
            <Text style={styles.email}>{user?.email ?? ''}</Text>
            <Text style={styles.role}>
              {user?.role?.toUpperCase()} {user?.organisation?.name ? `· ${user.organisation.name}` : ''}
            </Text>
          </View>
        </View>

        {/* Demo Mode Indicator & Role Switcher Tile */}
        <View style={styles.demoSection}>
          <TouchableOpacity
            style={styles.demoSwitcherItem}
            onPress={() => setSwitcherVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch Role (Demo)"
          >
            <View style={styles.demoSwitcherIcon}>
              <Repeat size={ICON.md} color={COLORS.primary} />
            </View>
            <View style={styles.flex}>
              <View style={styles.demoLabelRow}>
                <Text style={styles.demoSwitcherTitle}>Switch Role (Demo)</Text>
                <View style={styles.demoBadge}>
                  <Sparkles size={11} color={COLORS.primary} />
                  <Text style={styles.demoBadgeText}>FAST SWITCH</Text>
                </View>
              </View>
              <Text style={styles.demoSwitcherSubtitle}>
                Active: {user?.fullName} ({user?.role?.toUpperCase()})
              </Text>
            </View>
            <ChevronRight size={ICON.md} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ProfileEdit')}
          >
            <User size={ICON.md} color={COLORS.primary} />
            <Text style={styles.menuText}>Edit Profile & Cooperative Details</Text>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('LanguageSettings')}
          >
            <Globe size={ICON.md} color={COLORS.primary} />
            <Text style={styles.menuText}>Language Settings (English, हिन्दी, मराठी, ગુજરાતી)</Text>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('SyncStorage')}
          >
            <HardDrive size={ICON.md} color={COLORS.primary} />
            <Text style={styles.menuText}>Offline Storage & Sync Outbox</Text>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Certificates')}
          >
            <Award size={ICON.md} color={COLORS.primary} />
            <Text style={styles.menuText}>My Verified Credentials</Text>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('VerifyCertificate')}
          >
            <Shield size={ICON.md} color={COLORS.primary} />
            <Text style={styles.menuText}>Verify Any Certificate Code</Text>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={ICON.md} color={COLORS.danger} />
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Role Switcher Modal */}
      <DemoRoleSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </SafeAreaView>
  );
};

export const ProfileEditScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ProfileEdit'>>();
  return (
    <FeatureStubScreen
      title="Edit Profile"
      category="WP5 Profiles"
      subtitle="Update personal info, address, cooperative society, and employer visibility."
      params={route.params}
    />
  );
};

export const LanguageSettingsScreen = () => (
  <FeatureStubScreen
    title="Language Settings"
    category="WP9 Multilingual"
    subtitle="Select platform interface and content language: English, Hindi, Marathi, Gujarati."
  />
);

export const TraineeDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'TraineeDetail'>>();
  return (
    <FeatureStubScreen
      title="Trainee Profile & Records"
      category="WP5 Profiles"
      subtitle="View verified skill passport, attendance percentage, and assessment milestones."
      params={route.params}
    />
  );
};

export const BatchRosterScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'BatchRoster'>>();
  return (
    <FeatureStubScreen
      title="Batch Roster"
      category="WP5 Profiles"
      subtitle="Enrolled trainees list, contact info, and attendance status."
      params={route.params}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingBottom: SPACE.lg },
  flex: { flex: 1 },
  header: {
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: COLORS.textInverse },
  info: { flex: 1 },
  name: { ...TEXT.section },
  email: { ...TEXT.caption, color: COLORS.textSecondary },
  role: { ...TEXT.captionStrong, color: COLORS.primary, marginTop: 2 },

  demoSection: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
  },
  demoSwitcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    gap: SPACE.md,
  },
  demoSwitcherIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  demoSwitcherTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
    fontSize: 15,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    gap: 3,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  demoSwitcherSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  menu: { padding: SPACE.md, gap: SPACE.sm },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACE.md,
  },
  menuText: { flex: 1, ...TEXT.bodyStrong },
  footer: { padding: SPACE.md, marginTop: SPACE.lg },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    gap: SPACE.sm,
  },
  logoutText: { ...TEXT.bodyStrong, color: COLORS.danger },
});
