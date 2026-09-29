import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { ProgressRing } from '../../components/ProgressRing';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/EmptyState';
import { apiService } from '../../services/api';
import { useOnMount } from '../../hooks/useOnMount';
import { formatDate } from '../../services/utils';
import { attendanceApi, ExcuseRequestPayload } from './attendanceApi';
import { AttendanceRecordItem } from '../../types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileQuestion,
  Filter,
  ChevronRight,
  ShieldAlert,
  Send,
  X,
} from 'lucide-react-native';

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'primary' | 'neutral'; icon: any }> = {
  present: { label: 'Present', variant: 'success', icon: CheckCircle2 },
  late: { label: 'Late', variant: 'primary', icon: Clock },
  absent: { label: 'Absent', variant: 'neutral', icon: XCircle },
};

export const AttendanceHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  // Excuse Request Modal State
  const [excuseModalOpen, setExcuseModalOpen] = useState(false);
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [excuseCategory, setExcuseCategory] = useState<'medical' | 'official_duty' | 'field_work' | 'personal'>('medical');
  const [excuseSession, setExcuseSession] = useState('');
  const [excuseNotes, setExcuseNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await apiService.getAttendanceRecords();
      setRecords(res.records);
      setPercentage(res.percentage);
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useOnMount(loadData);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExcuseSubmit = async () => {
    if (!excuseNotes.trim()) {
      Alert.alert('Explanation Required', 'Please provide a brief reason or reference for your attendance excuse.');
      return;
    }

    setSubmittingExcuse(true);
    try {
      await attendanceApi.submitExcuseRequest({
        session_date: new Date().toISOString().split('T')[0],
        session_name: excuseSession || 'PACS Lecture Session',
        reason_category: excuseCategory,
        explanation: excuseNotes,
      });

      setSubmittingExcuse(false);
      setExcuseModalOpen(false);
      setExcuseNotes('');
      Alert.alert(
        'Regularization Submitted',
        'Your excuse request has been forwarded to the Course Director for attendance review.'
      );
    } catch {
      setSubmittingExcuse(false);
      Alert.alert('Submission Failed', 'Could not submit excuse request. Try again.');
    }
  };

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const totalSessions = records.length || 1;

  const computedPct = percentage ?? Math.round(((presentCount + lateCount) / totalSessions) * 100);
  const meetsThreshold = computedPct >= 75;

  const filteredRecords = records.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <ScrollScreen
      title="Attendance History"
      subtitle="Audit Log & Session Regularization"
      onBack={() => navigation.goBack()}
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightAction={
        <TouchableOpacity
          style={styles.checkInNavBtn}
          onPress={() => navigation.navigate('Attend', {})}
          accessibilityRole="button"
          accessibilityLabel="Check in attendance"
        >
          <Text style={styles.checkInNavText}>Check In</Text>
        </TouchableOpacity>
      }
    >
      {loading ? (
        <LoadingState />
      ) : (
        <View style={styles.container}>
          {/* Overall Percentage Progress Ring Card */}
          <View style={styles.summaryCard}>
            <View style={styles.ringCol}>
              <ProgressRing value={computedPct} size={110} strokeWidth={10} label="ATTENDANCE" />
            </View>

            <View style={styles.summaryStatsCol}>
              <View style={styles.thresholdBadge}>
                {meetsThreshold ? (
                  <Badge label="ELIGIBLE (≥ 75%)" variant="success" verified />
                ) : (
                  <Badge label="BELOW 75% MINIMUM" variant="primary" />
                )}
              </View>

              <Text style={styles.summaryTitle}>
                {meetsThreshold ? 'Certification Criteria Met' : 'Action Required'}
              </Text>

              <Text style={styles.summaryDesc}>
                {meetsThreshold
                  ? 'Your attendance exceeds the NCCT 75% minimum quota required for batch evaluation.'
                  : 'Maintain at least 75% attendance to prevent examination debarment and certificate holding.'}
              </Text>

              {/* Counts Grid */}
              <View style={styles.countsRow}>
                <View style={styles.countItem}>
                  <Text style={[styles.countVal, { color: COLORS.success }]}>{presentCount}</Text>
                  <Text style={styles.countLbl}>Present</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countVal, { color: COLORS.primary }]}>{lateCount}</Text>
                  <Text style={styles.countLbl}>Late</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countVal, { color: COLORS.danger }]}>{absentCount}</Text>
                  <Text style={styles.countLbl}>Absent</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={styles.countVal}>{records.length}</Text>
                  <Text style={styles.countLbl}>Total</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Excuse CTA Button */}
          <TouchableOpacity
            style={styles.excuseCtaBanner}
            onPress={() => setExcuseModalOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Request attendance excuse or regularization"
          >
            <View style={styles.excuseCtaTextCol}>
              <Text style={styles.excuseCtaTitle}>Missed a Class or Late?</Text>
              <Text style={styles.excuseCtaSub}>
                Submit an excuse for medical leave, cooperative field study, or official duty.
              </Text>
            </View>
            <View style={styles.excuseCtaBtn}>
              <Text style={styles.excuseCtaBtnText}>Request Excuse</Text>
            </View>
          </TouchableOpacity>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            {(['all', 'present', 'late', 'absent'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, filter === cat && styles.filterPillActive]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[styles.filterPillText, filter === cat && styles.filterPillTextActive]}>
                  {cat.toUpperCase()} {cat === 'all' ? `(${records.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Session Attendance Records List */}
          <View style={styles.recordsList}>
            {filteredRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <Calendar size={ICON.lg} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No attendance records match the selected filter.</Text>
              </View>
            ) : (
              filteredRecords.map((item, idx) => {
                const statusMeta = STATUS_LABEL_MAP(item.status);
                const IconComponent = statusMeta.icon;

                return (
                  <View key={idx} style={styles.recordItemCard}>
                    <View style={styles.recordIconCol}>
                      <IconComponent size={ICON.md} color={statusMeta.color} />
                    </View>

                    <View style={styles.recordBodyCol}>
                      <Text style={styles.recordSessionName}>{item.session}</Text>
                      <View style={styles.recordSubRow}>
                        <Calendar size={ICON.sm} color={COLORS.textMuted} />
                        <Text style={styles.recordDateText}>{formatDate(item.date)}</Text>
                        {item.timestamp ? (
                          <>
                            <Text style={styles.dotSeparator}>·</Text>
                            <Text style={styles.recordTimeText}>{item.timestamp}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.recordBadgeCol}>
                      <Badge label={statusMeta.label} variant={statusMeta.variant} verified={item.status === 'present'} />
                      <Text style={styles.methodTag}>{item.method.toUpperCase()}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* Excuse / Regularization Modal */}
      <Modal visible={excuseModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Attendance Regularization</Text>
                <Text style={styles.modalSub}>Forward reason and documentation to Course Coordinator</Text>
              </View>
              <TouchableOpacity onPress={() => setExcuseModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={ICON.md} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Category Selector */}
            <View style={styles.categoryPicker}>
              <Text style={styles.fieldLabel}>Reason Category:</Text>
              <View style={styles.catGrid}>
                {[
                  { key: 'medical', label: 'Medical Leave' },
                  { key: 'field_work', label: 'PACS Field Study' },
                  { key: 'official_duty', label: 'Cooperative Duty' },
                  { key: 'personal', label: 'Personal / Other' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catPill, excuseCategory === cat.key && styles.catPillActive]}
                    onPress={() => setExcuseCategory(cat.key as any)}
                  >
                    <Text style={[styles.catPillText, excuseCategory === cat.key && styles.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Session Info Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Session or Date Missed:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Sep 26 Morning Session"
                placeholderTextColor={COLORS.textMuted}
                value={excuseSession}
                onChangeText={setExcuseSession}
              />
            </View>

            {/* Explanation Note */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Explanation / Details:</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Provide medical certificate details or reason for absence..."
                placeholderTextColor={COLORS.textMuted}
                value={excuseNotes}
                onChangeText={setExcuseNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label={submittingExcuse ? 'Submitting Request...' : 'Submit Regularization Request'}
                icon={<Send size={ICON.sm} color={COLORS.textInverse} />}
                onPress={handleExcuseSubmit}
                loading={submittingExcuse}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

function STATUS_LABEL_MAP(status: string) {
  switch (status) {
    case 'present':
      return { label: 'Present', color: COLORS.success, variant: 'success' as const, icon: CheckCircle2 };
    case 'late':
      return { label: 'Late', color: COLORS.primary, variant: 'primary' as const, icon: Clock };
    case 'absent':
    default:
      return { label: 'Absent', color: COLORS.danger, variant: 'neutral' as const, icon: XCircle };
  }
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  checkInNavBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
  },
  checkInNavText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  summaryCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  ringCol: {
    padding: SPACE.xs,
  },
  summaryStatsCol: {
    flex: 1,
    gap: 4,
  },
  thresholdBadge: {
    alignSelf: 'flex-start',
  },
  summaryTitle: {
    ...TEXT.bodyStrong,
    fontSize: 15,
  },
  summaryDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACE.xs,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  countItem: {
    alignItems: 'center',
  },
  countVal: {
    ...TEXT.section,
    fontSize: 15,
  },
  countLbl: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  excuseCtaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: SPACE.sm,
  },
  excuseCtaTextCol: {
    flex: 1,
    gap: 2,
  },
  excuseCtaTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
    fontSize: 13,
  },
  excuseCtaSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  excuseCtaBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 6,
    borderRadius: RADII.sm,
  },
  excuseCtaBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
    fontSize: 11,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  filterPill: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  filterPillTextActive: {
    color: COLORS.primary,
  },
  recordsList: {
    gap: SPACE.xs,
  },
  emptyCard: {
    ...CARD,
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  emptyText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  recordItemCard: {
    ...CARD,
    padding: SPACE.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  recordIconCol: {
    width: 32,
    alignItems: 'center',
  },
  recordBodyCol: {
    flex: 1,
    gap: 2,
  },
  recordSessionName: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  recordSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordDateText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  dotSeparator: {
    color: COLORS.textMuted,
  },
  recordTimeText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  recordBadgeCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  methodTag: {
    ...TEXT.caption,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    ...TEXT.section,
    fontSize: 16,
  },
  modalSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  modalCloseBtn: {
    padding: SPACE.xs,
  },
  categoryPicker: {
    gap: SPACE.xs,
  },
  fieldLabel: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  catPill: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  catPillText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  catPillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
    height: HIT,
    ...TEXT.body,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 80,
    paddingTop: SPACE.sm,
    textAlignVertical: 'top',
  },
  modalActions: {
    marginTop: SPACE.xs,
  },
});
