import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { attendanceApi, LiveSessionData, SessionRosterStudent } from './attendanceApi';
import {
  QrCode,
  Users,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Maximize2,
  Minimize2,
  X,
  Edit3,
} from 'lucide-react-native';

export const SessionConsoleScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'SessionConsole'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessionId = route.params?.sessionId || 'sess-demo-1';

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LiveSessionData | null>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [projectorOpen, setProjectorOpen] = useState(false);

  // Manual Override State
  const [overrideStudent, setOverrideStudent] = useState<SessionRosterStudent | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<'present' | 'late' | 'absent'>('present');
  const [overrideReason, setOverrideReason] = useState('Manual verification by trainer');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial session fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await attendanceApi.getSessionConsole(sessionId);
        if (mounted) {
          setSession(data);
          setQrToken(data.qr_token);
          setQrData(data.qr_data);
          setSecondsRemaining(data.expires_in || 15);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  // Dynamic 15s rotating QR code countdown
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Token refresh
          attendanceApi.getSessionQR(sessionId).then((nextQR) => {
            setQrToken(nextQR.qr_token);
            setQrData(nextQR.qr_data);
          });
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, sessionId]);

  const handleApplyOverride = async () => {
    if (!overrideStudent) return;
    setSubmittingOverride(true);

    try {
      await attendanceApi.markAttendanceManualOverride(
        overrideStudent.trainee_id,
        overrideStatus,
        overrideReason
      );

      // Update local roster
      if (session) {
        const updatedRoster = session.roster.map((s) => {
          if (s.trainee_id === overrideStudent.trainee_id) {
            return {
              ...s,
              status: overrideStatus,
              method: 'manual',
              scanned_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          }
          return s;
        });
        const presentCount = updatedRoster.filter((s) => s.status === 'present' || s.status === 'late').length;
        setSession({
          ...session,
          roster: updatedRoster,
          present_count: presentCount,
        });
      }

      setSubmittingOverride(false);
      setOverrideStudent(null);
    } catch {
      setSubmittingOverride(false);
      Alert.alert('Override Failed', 'Could not update student attendance.');
    }
  };

  const handleEndSession = () => {
    Alert.alert('End Attendance Session', 'Are you sure you want to close attendance for this lecture session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Session',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  if (loading) {
    return (
      <ScrollScreen title="Session Console">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing live attendance console & TOTP engine...</Text>
        </View>
      </ScrollScreen>
    );
  }

  const roster = session?.roster || [];
  const presentCount = session?.present_count || 0;
  const totalCount = session?.total_students || roster.length;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const timerRatio = (secondsRemaining / 15) * 100;

  return (
    <ScrollScreen
      title="Live Session Console"
      subtitle={session?.session_name || 'Classroom Attendance'}
      onBack={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity style={styles.endBtn} onPress={handleEndSession}>
          <Text style={styles.endBtnText}>End</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Live Rotating QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrCardHeader}>
            <View style={styles.qrTagRow}>
              <Badge label="LIVE DYNAMIC QR" variant="primary" />
              <ShieldCheck size={ICON.sm} color={COLORS.primary} />
            </View>
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => setProjectorOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open projector full-screen QR"
            >
              <Maximize2 size={ICON.sm} color={COLORS.textPrimary} />
              <Text style={styles.expandBtnText}>Projector Mode</Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Presentation */}
          <View style={styles.qrDisplayBox}>
            <QRCode
              value={qrData || 'coopsetu:attend:default'}
              size={180}
              color={COLORS.primaryDark}
              backgroundColor={COLORS.card}
            />
          </View>

          {/* Refresh Progress countdown bar */}
          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${timerRatio}%` }]} />
          </View>

          <View style={styles.qrMetaRow}>
            <View style={styles.countdownTag}>
              <RefreshCw size={12} color={COLORS.primary} />
              <Text style={styles.countdownText}>Token refreshes in {secondsRemaining}s</Text>
            </View>
            <Text style={styles.totpText} numberOfLines={1}>
              Token: {qrToken.split('.').slice(-1)[0] || 'active'}
            </Text>
          </View>
        </View>

        {/* Live Attendance Tracker Progress Card */}
        <View style={styles.trackerCard}>
          <View style={styles.trackerHeader}>
            <View style={styles.trackerTitleRow}>
              <Users size={ICON.md} color={COLORS.primary} />
              <Text style={styles.trackerTitle}>Live Attendance Tracker</Text>
            </View>
            <Text style={styles.trackerScore}>
              {presentCount} / {totalCount} ({attendancePct}%)
            </Text>
          </View>

          <ProgressBar value={attendancePct} height={8} />

          <View style={styles.statusLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>
                Present: {roster.filter((s) => s.status === 'present').length}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Late: {roster.filter((s) => s.status === 'late').length}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
              <Text style={styles.legendText}>
                Unmarked: {roster.filter((s) => s.status === 'unmarked').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Real-time Scanned Roster List */}
        <View style={styles.rosterCard}>
          <View style={styles.rosterHeader}>
            <Text style={styles.rosterTitle}>Student Scanned Feed</Text>
            <Text style={styles.rosterSubtitle}>Tap any student to manually override attendance</Text>
          </View>

          <View style={styles.rosterList}>
            {roster.map((student) => {
              const isPresent = student.status === 'present';
              const isLate = student.status === 'late';
              const isUnmarked = student.status === 'unmarked';

              return (
                <TouchableOpacity
                  key={student.trainee_id}
                  style={styles.rosterItem}
                  onPress={() => {
                    setOverrideStudent(student);
                    setOverrideStatus(student.status === 'unmarked' ? 'present' : student.status);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentId}>
                      ID: {student.trainee_id}
                      {student.scanned_at ? ` · Checked in at ${student.scanned_at}` : ''}
                    </Text>
                  </View>

                  <View style={styles.studentStatusBadge}>
                    <Badge
                      label={student.status.toUpperCase()}
                      variant={isPresent ? 'success' : isLate ? 'primary' : 'neutral'}
                      verified={isPresent}
                    />
                    {student.method ? (
                      <Text style={styles.methodLabel}>{student.method.toUpperCase()}</Text>
                    ) : null}
                  </View>

                  <Edit3 size={ICON.sm} color={COLORS.textMuted} style={styles.editIcon} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Projector Full-Screen Modal */}
      <Modal visible={projectorOpen} animationType="slide">
        <View style={styles.projectorContainer}>
          <View style={styles.projectorHeader}>
            <View>
              <Text style={styles.projectorTitle}>{session?.session_name}</Text>
              <Text style={styles.projectorSub}>Classroom Projection Display · Anti-Proxy Rotating QR</Text>
            </View>
            <TouchableOpacity onPress={() => setProjectorOpen(false)} style={styles.closeProjectorBtn}>
              <Minimize2 size={ICON.lg} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>

          <View style={styles.projectorQrBox}>
            <QRCode
              value={qrData || 'coopsetu:attend:default'}
              size={280}
              color={COLORS.primaryDark}
              backgroundColor={COLORS.card}
            />
          </View>

          <View style={styles.projectorFooter}>
            <View style={styles.projectorTimerRow}>
              <RefreshCw size={ICON.md} color={COLORS.primary} />
              <Text style={styles.projectorTimerText}>Rotating code refreshes every 15s ({secondsRemaining}s remaining)</Text>
            </View>
            <Text style={styles.projectorCountText}>
              {presentCount} Students Checked In · Scan with CoopSetu App
            </Text>
          </View>
        </View>
      </Modal>

      {/* Manual Override Modal */}
      <Modal visible={!!overrideStudent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.overrideCard}>
            <View style={styles.overrideHeader}>
              <View>
                <Text style={styles.overrideTitle}>Manual Attendance Override</Text>
                <Text style={styles.overrideSub}>{overrideStudent?.name} ({overrideStudent?.trainee_id})</Text>
              </View>
              <TouchableOpacity onPress={() => setOverrideStudent(null)} style={styles.closeModalBtn}>
                <X size={ICON.md} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Status Selector */}
            <View style={styles.statusPillsRow}>
              {(['present', 'late', 'absent'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusPill, overrideStatus === st && styles.statusPillActive]}
                  onPress={() => setOverrideStatus(st)}
                >
                  <Text style={[styles.statusPillText, overrideStatus === st && styles.statusPillTextActive]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Override Reason / Audit Note:</Text>
              <TextInput
                style={styles.overrideInput}
                value={overrideReason}
                onChangeText={setOverrideReason}
                placeholder="e.g. Phone battery drained, physical presence verified"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label={submittingOverride ? 'Updating...' : 'Confirm Status Override'}
                onPress={handleApplyOverride}
                loading={submittingOverride}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  loadingBox: {
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  loadingText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  endBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  endBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  qrCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    alignItems: 'center',
  },
  qrCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expandBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    fontSize: 11,
  },
  qrDisplayBox: {
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginVertical: SPACE.xs,
  },
  timerTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  qrMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  totpText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  trackerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  trackerTitle: {
    ...TEXT.bodyStrong,
  },
  trackerScore: {
    ...TEXT.section,
    fontSize: 16,
    color: COLORS.primaryDark,
  },
  statusLegendRow: {
    flexDirection: 'row',
    gap: SPACE.md,
    paddingTop: SPACE.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  rosterCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  rosterHeader: {
    gap: 2,
  },
  rosterTitle: {
    ...TEXT.bodyStrong,
  },
  rosterSubtitle: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  rosterList: {
    gap: SPACE.xs,
    marginTop: SPACE.xs,
  },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACE.sm,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  studentId: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  studentStatusBadge: {
    alignItems: 'flex-end',
    gap: 2,
  },
  methodLabel: {
    ...TEXT.caption,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  editIcon: {
    marginLeft: 2,
  },
  projectorContainer: {
    flex: 1,
    backgroundColor: '#0F090B',
    padding: SPACE.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectorHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: SPACE.lg,
  },
  projectorTitle: {
    ...TEXT.title,
    color: COLORS.textInverse,
    fontSize: 22,
  },
  projectorSub: {
    ...TEXT.caption,
    color: COLORS.mediaText,
  },
  closeProjectorBtn: {
    padding: SPACE.xs,
  },
  projectorQrBox: {
    padding: SPACE.lg,
    backgroundColor: '#FFF',
    borderRadius: RADII.lg,
  },
  projectorFooter: {
    alignItems: 'center',
    gap: SPACE.sm,
    paddingBottom: SPACE.lg,
  },
  projectorTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  projectorTimerText: {
    ...TEXT.captionStrong,
    color: COLORS.primaryLight,
    fontSize: 13,
  },
  projectorCountText: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
  overrideCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  overrideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overrideTitle: {
    ...TEXT.section,
    fontSize: 16,
  },
  overrideSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  closeModalBtn: {
    padding: SPACE.xs,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  statusPill: {
    flex: 1,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  statusPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  statusPillText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  statusPillTextActive: {
    color: COLORS.primary,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  overrideInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
    height: HIT,
    ...TEXT.body,
    backgroundColor: COLORS.surface,
  },
  modalActions: {
    marginTop: SPACE.xs,
  },
});
