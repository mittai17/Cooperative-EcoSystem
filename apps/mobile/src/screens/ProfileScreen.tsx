import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  User,
  Mail,
  GraduationCap,
  CalendarCheck,
  Award,
  Download,
  QrCode,
  Shield,
  LogOut,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
  const [trainee, setTrainee] = useState(apiService.getTraineeProfile());

  useEffect(() => {
    apiService.getTraineeProfileLive().then((res) => setTrainee(res.trainee));
  }, []);

  const menuOptions = [
    {
      title: 'QR Attendance History',
      sub: 'Session logs & scan stamps',
      icon: QrCode,
      action: () => navigation.navigate('QRScan'),
    },
    {
      title: 'Skill Passport & Evidence',
      sub: '72% overall strength • 3 verified',
      icon: Award,
      action: () => navigation.navigate('PassportTab'),
    },
    {
      title: 'Offline Content & Sync',
      sub: 'Manage local caches & pending uploads',
      icon: Download,
      action: () => navigation.navigate('Offline'),
    },
    {
      title: 'Official Certificates',
      sub: '2 credentials issued by NCCT / VAMNICOM',
      icon: GraduationCap,
      action: () => navigation.navigate('Certificates'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Trainee Profile" subtitle="VAMNICOM & NCCT Portal" />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{trainee.avatar_initials}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{trainee.name}</Text>
            <Text style={styles.userRole}>{trainee.role} • ID: {trainee.id}</Text>
            <View style={styles.badgeRow}>
              <Badge label="Government Verified" variant="success" verified />
            </View>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Mail size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{trainee.email}</Text>
            </View>

            <View style={styles.detailItem}>
              <GraduationCap size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{trainee.enrolled_institution}</Text>
            </View>
          </View>
        </View>

        {/* Quick Menu Navigation List */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Trainee Navigation</Text>

          {menuOptions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconWrap}>
                  <Icon size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security & Data Notice */}
        <View style={styles.securityCard}>
          <Shield size={16} color={COLORS.primary} />
          <Text style={styles.securityText}>
            Your credentials and biometric logs comply with National Cooperative Database standards.
          </Text>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Log Out', 'Session cleared.')}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out from Trainee Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.sm,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badgeRow: {
    marginTop: 4,
  },
  detailsList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  menuSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  menuItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.sm,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  securityCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  logoutBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
});
