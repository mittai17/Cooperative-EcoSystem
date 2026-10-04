import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { useOnMount } from '../../hooks/useOnMount';
import { attendanceApi, AttendanceSessionInfo } from './attendanceApi';
import {
  Plus,
  Play,
  Clock,
  Building,
  Users,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';

export const AttendanceSessionsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [sessions, setSessions] = useState<AttendanceSessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await attendanceApi.getActiveSessions();
      setSessions(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useOnMount(load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollScreen
      title="Attendance Sessions"
      subtitle="NURVEX trainer attendance hub"
      tab
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightAction={
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('StartSession', {})}
          accessibilityRole="button"
          accessibilityLabel="Start new attendance session"
        >
          <Plus size={ICON.md} color={COLORS.textInverse} />
          <Text style={styles.headerBtnText}>Start Session</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Active Session Highlight Banner */}
        {sessions.length > 0 ? (
          <View style={styles.activeBanner}>
            <View style={styles.bannerHeader}>
              <Badge label="IN PROGRESS" variant="success" verified />
              <View style={styles.countdownBadge}>
                <Clock size={12} color={COLORS.primary} />
                <Text style={styles.countdownText}>Window Active</Text>
              </View>
            </View>

            <Text style={styles.bannerTitle}>{sessions[0].session_name}</Text>
            <Text style={styles.bannerSub}>
              {sessions[0].batch_name || 'Cohort 2026-A'} · {sessions[0].room || 'Hall 2'}
            </Text>

            <Button
              label="Open Live Session Console"
              icon={<Play size={ICON.md} color={COLORS.textInverse} />}
              onPress={() => navigation.navigate('SessionConsole', { sessionId: sessions[0].session_id })}
            />
          </View>
        ) : null}

        {/* Start New Session CTA Card */}
        <View style={styles.actionCard}>
          <View style={styles.actionCardTextCol}>
            <Text style={styles.actionCardTitle}>Ready to take attendance?</Text>
            <Text style={styles.actionCardDesc}>
              Launch a timed session with rotating QR token, NFC contactless tap, or facial biometrics.
            </Text>
          </View>

          <Button
            label="Launch New Session"
            variant="secondary"
            icon={<Plus size={ICON.md} color={COLORS.primary} />}
            onPress={() => navigation.navigate('StartSession', {})}
          />
        </View>

        {/* Recent Past Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
        </View>

        <View style={styles.pastList}>
          {[
            {
              id: 'sess-past-1',
              title: 'Cooperative Banking Fundamentals',
              date: 'Yesterday, Sep 27',
              present: 22,
              total: 25,
              pct: 88,
            },
            {
              id: 'sess-past-2',
              title: 'Statutory Audit & Accounts in PACS',
              date: 'Sep 25, 2026',
              present: 24,
              total: 25,
              pct: 96,
            },
            {
              id: 'sess-past-3',
              title: 'MSCS Act Governance Workshop',
              date: 'Sep 23, 2026',
              present: 21,
              total: 25,
              pct: 84,
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.pastCard}
              onPress={() => navigation.navigate('SessionConsole', { sessionId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.pastIconCol}>
                <CheckCircle2 size={ICON.md} color={COLORS.success} />
              </View>

              <View style={styles.pastBody}>
                <Text style={styles.pastTitle}>{item.title}</Text>
                <View style={styles.pastMetaRow}>
                  <Calendar size={12} color={COLORS.textMuted} />
                  <Text style={styles.pastDate}>{item.date}</Text>
                </View>
              </View>

              <View style={styles.pastStats}>
                <Text style={styles.pastPct}>{item.pct}%</Text>
                <Text style={styles.pastCount}>{item.present}/{item.total} Present</Text>
              </View>

              <ChevronRight size={ICON.sm} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  headerBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  activeBanner: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    backgroundColor: COLORS.card,
    borderColor: COLORS.success,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  bannerTitle: {
    ...TEXT.section,
    fontSize: 16,
    color: COLORS.primaryDark,
  },
  bannerSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACE.xs,
  },
  actionCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
  },
  actionCardTextCol: {
    gap: 2,
  },
  actionCardTitle: {
    ...TEXT.bodyStrong,
  },
  actionCardDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  sectionHeader: {
    paddingTop: SPACE.xs,
  },
  sectionTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.textSecondary,
  },
  pastList: {
    gap: SPACE.xs,
  },
  pastCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  pastIconCol: {
    width: 28,
  },
  pastBody: {
    flex: 1,
    gap: 2,
  },
  pastTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  pastMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pastDate: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  pastStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  pastPct: {
    ...TEXT.captionStrong,
    color: COLORS.success,
    fontSize: 13,
  },
  pastCount: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
