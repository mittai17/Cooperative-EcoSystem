import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';
import { useAuthContext } from '../navigation/AuthContext';
import { DEMO_ROLE_LIST, DemoRoleConfig } from '../constants/demoProfiles';
import {
  GraduationCap,
  Building2,
  Users,
  Briefcase,
  Shield,
  CheckCircle2,
  X,
  Repeat,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';

const ROLE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  trainee: GraduationCap,
  institution: Building2,
  trainer: Users,
  employer: Briefcase,
  admin: Shield,
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const DemoRoleSwitcherModal: React.FC<Props> = ({ visible, onClose }) => {
  const { role: currentRole, switchDemoRole } = useAuthContext();

  const handleSelectRole = (config: DemoRoleConfig) => {
    switchDemoRole(config.role);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconCircle}>
                <Repeat size={ICON.md} color={COLORS.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>Switch Role (Demo)</Text>
                <Text style={styles.subtitle}>Select any cooperative ecosystem persona</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close role switcher"
            >
              <X size={ICON.md} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Role Cards List */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {DEMO_ROLE_LIST.map((item) => {
              const IconComp = ROLE_ICONS[item.role] || Sparkles;
              const isActive = currentRole === item.role;

              return (
                <TouchableOpacity
                  key={item.role}
                  style={[
                    styles.roleCard,
                    isActive && styles.roleCardActive,
                  ]}
                  onPress={() => handleSelectRole(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.roleIconBox, { backgroundColor: item.color + '15' }]}>
                    <IconComp size={ICON.lg} color={item.color} />
                  </View>

                  <View style={styles.roleInfo}>
                    <View style={styles.roleTitleRow}>
                      <Text style={styles.roleName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {isActive ? (
                        <View style={styles.activeBadge}>
                          <CheckCircle2 size={12} color={COLORS.success} />
                          <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.roleAffiliation}>
                      {item.affiliation}
                    </Text>

                    <Text style={styles.roleTagline} numberOfLines={2}>
                      {item.tagline}
                    </Text>
                  </View>

                  <ChevronRight size={ICON.md} color={isActive ? COLORS.primary : COLORS.textMuted} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              💡 Demo mode bypasses passwords and enables all interactive features.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACE.md,
  },
  modalBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADII.lg,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: {
    ...TEXT.section,
    color: COLORS.text,
  },
  subtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  closeBtn: {
    padding: SPACE.xs,
  },
  listScroll: {
    maxHeight: 460,
  },
  listContent: {
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACE.md - 2,
    gap: SPACE.sm + 2,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.xs,
  },
  roleName: {
    ...TEXT.bodyStrong,
    fontSize: 15,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    gap: 3,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  roleAffiliation: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    marginTop: 1,
  },
  roleTagline: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footer: {
    padding: SPACE.sm + 2,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  footerNote: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
