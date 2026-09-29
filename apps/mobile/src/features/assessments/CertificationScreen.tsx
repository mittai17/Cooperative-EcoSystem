import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { assessmentApi } from './assessmentApi';
import { TraineeEligibilityCheck } from './assessmentTypes';
import {
  Award,
  CheckCircle2,
  XCircle,
  Users,
  CheckSquare,
  Square,
  FileCheck,
  ShieldCheck,
  Send,
  AlertTriangle,
} from 'lucide-react-native';

export const CertificationScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Certification'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const batchId = route.params?.batchId || 'batch-2026-pacs';

  const [loading, setLoading] = useState(true);
  const [batchName, setBatchName] = useState('PACS Diploma 2026-A');
  const [trainees, setTrainees] = useState<TraineeEligibilityCheck[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [grade, setGrade] = useState<'A+' | 'A' | 'B'>('A');
  const [issuedResult, setIssuedResult] = useState<Array<{ trainee_id: string; verification_code: string }> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await assessmentApi.getBatchEligibility(batchId);
        if (mounted) {
          setBatchName(data.batch_name);
          setTrainees(data.trainees);
          // Auto-select eligible candidates by default
          const eligibleIds = data.trainees.filter((t) => t.eligible).map((t) => t.trainee_id);
          setSelectedIds(eligibleIds);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [batchId]);

  const toggleSelectTrainee = (id: string, eligible: boolean) => {
    if (!eligible) {
      Alert.alert(
        'Ineligible Trainee',
        'This trainee has not met the minimum attendance (75%) or mandatory evaluation criteria.'
      );
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = trainees.filter((t) => t.eligible).map((t) => t.trainee_id);
    if (selectedIds.length === eligibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligibleIds);
    }
  };

  const handleBulkIssue = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('No Trainees Selected', 'Please select at least one eligible trainee to issue credentials.');
      return;
    }

    setIssuing(true);
    try {
      const res = await assessmentApi.issueBatchCertificates('prog-1', batchId, selectedIds, grade);
      setIssuing(false);
      setIssuedResult(res.issued);
    } catch {
      setIssuing(false);
      Alert.alert('Issuance Failed', 'Could not complete batch certification. Please try again.');
    }
  };

  const eligibleCount = trainees.filter((t) => t.eligible).length;
  const allEligibleSelected = eligibleCount > 0 && selectedIds.length === eligibleCount;

  return (
    <ScrollScreen
      title="Batch Certification"
      subtitle={`Batch: ${batchName}`}
      onBack={() => navigation.goBack()}
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading cohort roster and audit criteria...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Users size={ICON.md} color={COLORS.primary} />
              <Text style={styles.summaryTitle}>Cohort Compliance Summary</Text>
            </View>

            <View style={styles.summaryMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{trainees.length}</Text>
                <Text style={styles.metricLabel}>Total Enrolled</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: COLORS.success }]}>{eligibleCount}</Text>
                <Text style={styles.metricLabel}>Audit Passed</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: COLORS.danger }]}>
                  {trainees.length - eligibleCount}
                </Text>
                <Text style={styles.metricLabel}>Ineligible</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: COLORS.primary }]}>{selectedIds.length}</Text>
                <Text style={styles.metricLabel}>Selected</Text>
              </View>
            </View>
          </View>

          {/* Institutional Compliance Rule Note */}
          <View style={styles.rulesCard}>
            <ShieldCheck size={ICON.md} color={COLORS.primary} />
            <Text style={styles.rulesText}>
              NCCT Standard: Minimum 75% biometric attendance, all module completions, and passing final
              assessment score required for digital credential issuance.
            </Text>
          </View>

          {/* Select All Toggle Bar */}
          <View style={styles.selectionBar}>
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={handleSelectAllEligible}
              accessibilityRole="button"
              accessibilityLabel="Select all eligible trainees"
            >
              {allEligibleSelected ? (
                <CheckSquare size={ICON.md} color={COLORS.primary} />
              ) : (
                <Square size={ICON.md} color={COLORS.textSecondary} />
              )}
              <Text style={styles.selectAllText}>
                {allEligibleSelected ? 'Deselect All' : `Select All Eligible (${eligibleCount})`}
              </Text>
            </TouchableOpacity>

            {/* Grade Selection */}
            <View style={styles.gradePicker}>
              <Text style={styles.gradePickerLabel}>Grade:</Text>
              {(['A+', 'A', 'B'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradePill, grade === g && styles.gradePillActive]}
                  onPress={() => setGrade(g)}
                >
                  <Text style={[styles.gradePillText, grade === g && styles.gradePillTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trainee Roster */}
          <View style={styles.rosterList}>
            {trainees.map((t) => {
              const selected = selectedIds.includes(t.trainee_id);
              return (
                <TouchableOpacity
                  key={t.trainee_id}
                  style={[
                    styles.traineeCard,
                    selected && styles.traineeCardSelected,
                    !t.eligible && styles.traineeCardIneligible,
                  ]}
                  onPress={() => toggleSelectTrainee(t.trainee_id, t.eligible)}
                  activeOpacity={0.8}
                >
                  <View style={styles.traineeHeaderRow}>
                    <View style={styles.checkboxWrapper}>
                      {selected ? (
                        <CheckSquare size={ICON.md} color={COLORS.primary} />
                      ) : (
                        <Square size={ICON.md} color={t.eligible ? COLORS.border : COLORS.textMuted} />
                      )}
                    </View>

                    <View style={styles.traineeInfo}>
                      <Text style={styles.traineeName}>{t.trainee_name}</Text>
                      <Text style={styles.traineeId}>ID: {t.trainee_id}</Text>
                    </View>

                    <Badge
                      label={t.eligible ? 'ELIGIBLE' : 'AUDIT FAILED'}
                      variant={t.eligible ? 'success' : 'neutral'}
                      verified={t.eligible}
                    />
                  </View>

                  {/* Audit Details */}
                  <View style={styles.auditDetailsGrid}>
                    <View style={styles.auditCol}>
                      <Text style={styles.auditColLabel}>Attendance</Text>
                      <Text
                        style={[
                          styles.auditColValue,
                          { color: t.attendance_pct >= t.min_attendance_pct ? COLORS.success : COLORS.danger },
                        ]}
                      >
                        {t.attendance_pct}% (Min {t.min_attendance_pct}%)
                      </Text>
                    </View>

                    <View style={styles.auditCol}>
                      <Text style={styles.auditColLabel}>Mandatory Courses</Text>
                      <Text
                        style={[
                          styles.auditColValue,
                          {
                            color:
                              t.mandatory_courses_completed >= t.mandatory_courses_total
                                ? COLORS.success
                                : COLORS.danger,
                          },
                        ]}
                      >
                        {t.mandatory_courses_completed}/{t.mandatory_courses_total}
                      </Text>
                    </View>

                    <View style={styles.auditCol}>
                      <Text style={styles.auditColLabel}>Evaluations</Text>
                      <Text
                        style={[
                          styles.auditColValue,
                          {
                            color:
                              t.assessments_passed >= t.assessments_total ? COLORS.success : COLORS.danger,
                          },
                        ]}
                      >
                        {t.assessments_passed}/{t.assessments_total} Passed
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bulk Issue CTA */}
          <View style={styles.actionBox}>
            <Button
              label={
                issuing
                  ? 'Generating Signed Certificates...'
                  : `Issue Certificates (${selectedIds.length} Trainees)`
              }
              icon={<Award size={ICON.md} color={COLORS.textInverse} />}
              onPress={handleBulkIssue}
              loading={issuing}
              disabled={selectedIds.length === 0}
            />
          </View>
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={!!issuedResult} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={48} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Certificates Successfully Issued</Text>
            <Text style={styles.successMessage}>
              Generated {issuedResult?.length} tamper-evident digital certificates with HMAC-SHA256 signatures
              and NCCT verification codes.
            </Text>

            <ScrollView style={styles.issuedCodesList}>
              {issuedResult?.map((item, idx) => (
                <View key={idx} style={styles.codeRow}>
                  <Text style={styles.codeTraineeId}>{item.trainee_id}</Text>
                  <Text style={styles.codeValue}>{item.verification_code}</Text>
                </View>
              ))}
            </ScrollView>

            <Button
              label="Done"
              onPress={() => {
                setIssuedResult(null);
                navigation.goBack();
              }}
            />
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
  summaryCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  summaryTitle: {
    ...TEXT.bodyStrong,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    ...TEXT.section,
    fontSize: 20,
    color: COLORS.primaryDark,
  },
  metricLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rulesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rulesText: {
    ...TEXT.caption,
    flex: 1,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  selectAllText: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  gradePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gradePickerLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  gradePill: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  gradePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  gradePillText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  gradePillTextActive: {
    color: COLORS.primary,
  },
  rosterList: {
    gap: SPACE.sm,
  },
  traineeCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  traineeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  traineeCardIneligible: {
    opacity: 0.6,
  },
  traineeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  checkboxWrapper: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  traineeId: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  auditDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  auditCol: {
    flex: 1,
  },
  auditColLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  auditColValue: {
    ...TEXT.captionStrong,
    fontSize: 12,
  },
  actionBox: {
    marginTop: SPACE.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    gap: SPACE.md,
    maxHeight: '80%',
  },
  successIconWrapper: {
    alignItems: 'center',
  },
  successTitle: {
    ...TEXT.section,
    textAlign: 'center',
  },
  successMessage: {
    ...TEXT.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  issuedCodesList: {
    maxHeight: 180,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: SPACE.sm,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  codeTraineeId: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  codeValue: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
});
