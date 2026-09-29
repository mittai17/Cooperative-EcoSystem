import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, CARD, HIT, ICON, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { LoadingState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { IconChip } from '../components/IconChip';
import { useAuthContext } from '../navigation/AuthContext';
import { Award, GraduationCap, Download, QrCode, LogOut, ChevronRight } from 'lucide-react-native';

const MENU = [
  { title: 'Skill passport', icon: Award, route: 'Passport' },
  { title: 'Certificates', icon: GraduationCap, route: 'Certificates' },
  { title: 'Offline learning', icon: Download, route: 'Offline' },
  { title: 'QR attendance', icon: QrCode, route: 'QRScan' },
] as const;

export const ProfileScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuthContext();
  const trainee = user?.trainee ?? null;
  const name = trainee?.name || user?.fullName || user?.email || '';
  const initials =
    trainee?.avatar_initials ||
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  const roleLabel = user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
  const affiliation = trainee?.enrolled_institution ?? user?.organisation?.name ?? '';

  const handleLogout = () => {
    console.log('[ProfileScreen] handleLogout called');
    Alert.alert('Log out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollScreen tab title="Profile">
      {user === null ? (
        <LoadingState />
      ) : (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.caption} numberOfLines={1}>
              {user.email}
            </Text>
            <Text style={styles.caption} numberOfLines={1}>
              {affiliation ? `${roleLabel} · ${affiliation}` : roleLabel}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.menu}>
        {MENU.map((item, idx) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, idx < MENU.length - 1 && styles.menuItemDivider]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <IconChip size={40}>
                <Icon size={ICON.md} color={COLORS.primary} />
              </IconChip>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <ChevronRight size={ICON.md} color={COLORS.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        label="Log out"
        variant="secondary"
        icon={<LogOut size={ICON.md} color={COLORS.primary} />}
        onPress={handleLogout}
      />
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...TEXT.section, color: COLORS.textInverse },
  name: { ...TEXT.section },
  caption: { ...TEXT.caption },
  menu: { ...CARD, overflow: 'hidden' },
  menuItem: {
    minHeight: HIT + SPACE.md,
    paddingHorizontal: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md - SPACE.xs,
  },
  menuItemDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuTitle: { flex: 1, ...TEXT.bodyStrong },
});
