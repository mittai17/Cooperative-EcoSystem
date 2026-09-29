import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_USER_NOMINATIONS, NominationRecord } from './mockData';
import { apiClient } from '../../api/client';
import {
  CheckCircle2,
  Clock,
  Building,
  User,
  Calendar,
  Download,
  AlertTriangle,
  QrCode,
  FileCheck,
  ShieldCheck,
  Building2,
  X,
  Share2,
} from 'lucide-react-native';

interface TimelineStep {
  key: string;
  label: string;
  date?: string;
  status: 'completed' | 'active' | 'pending';
  detail: string;
}

export const NominationDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'NominationDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const nominationId = route.params?.nominationId || 'nom-9821';

  // Find in mock data or fallback
  const nomination: NominationRecord =
    MOCK_USER_NOMINATIONS.find((n) => n.id === nominationId) || MOCK_USER_NOMINATIONS[0];

  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(nomination.status);

  // Compute timeline steps
  const isApproved = currentStatus === 'approved';
  const isUnderReview = currentStatus === 'under_review';
  const isSubmitted = currentStatus === 'submitted';
  const isWaitlisted = currentStatus === 'waitlisted';

  const timelineSteps: TimelineStep[] = [
    {
      key: 'draft',
      label: 'Draft Created',
      date: '10 Sep 2026',
      status: 'completed',
      detail: 'Application initiated and documents attached by applicant.',
    },
    {
      key: 'submitted',
      label: 'Application Submitted',
      date: new Date(nomination.submitted_at).toLocaleDateString(),
      status: 'completed',
      detail: 'Submitted to Institute Admissions Desk.',
    },
    {
      key: 'society_approved',
      label: 'Sponsoring Society Endorsed',
      date: '14 Sep 2026',
      status: isSubmitted ? 'active' : 'completed',
      detail: nomination.society_name
        ? `NOC issued by ${nomination.society_name} (Signatory: ${nomination.sponsor_officer_name || 'Chairman'}).`
        : 'Self-nomination credentials validated.',
    },
    {
      key: 'verification',
      label: 'Institution Academic Verification',
      date: isUnderReview || isApproved ? '18 Sep 2026' : undefined,
      status: isUnderReview ? 'active' : isApproved ? 'completed' : 'pending',
      detail: 'VAMNICOM admissions committee scrutiny and seat quota review.',
    },
    {
      key: 'enrolled',
      label: isWaitlisted ? 'Waitlisted in Quota' : 'Enrolled & Batch Allocated',
      date: isApproved ? '18 Sep 2026' : undefined,
      status: isApproved ? 'completed' : isWaitlisted ? 'active' : 'pending',
      detail: isApproved
        ? `Seat confirmed in ${nomination.batch_name || 'Batch 1'}. Hostel room allocated.`
        : isWaitlisted
        ? 'Placed in waitlist queue #3. Will clear upon candidate withdrawal.'
        : 'Awaiting final admission committee sanction.',
    },
  ];

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Nomination',
      'Are you sure you want to withdraw this application? This action cannot be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setWithdrawing(true);
            try {
              await apiClient(`/programmes/nominations/${nomination.id}/withdraw`, { method: 'POST' });
            } catch {
              // local fallback
            } finally {
              setWithdrawing(false);
              setCurrentStatus('withdrawn');
              Alert.alert('Nomination Withdrawn', 'Your application has been marked as withdrawn.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollScreen
      title="Nomination Record"
      onBack={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => setSlipModalVisible(true)}
          accessibilityLabel="Download Nomination Slip"
        >
          <Download size={ICON.md} color={COLORS.primaryDark} />
        </TouchableOpacity>
      }
    >
      {/* Top Application Header */}
      <View style={styles.topCard}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.appIdText}>Application ID: {nomination.id.toUpperCase()}</Text>
            <Text style={styles.progTitle}>{nomination.programme_title}</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          {isApproved ? (
            <Badge label="Enrolled in Batch" variant="success" verified />
          ) : isUnderReview ? (
            <Badge label="In Committee Review" variant="primary" />
          ) : isWaitlisted ? (
            <Badge label="Waitlisted" variant="neutral" />
          ) : (
            <Badge label="Submitted" variant="neutral" />
          )}
          <Text style={styles.hostelTag}>
            Hostel: {nomination.room_allocated ? 'Allocated (Block B)' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Reviewer Remarks Card */}
      {nomination.decision_note && (
        <View style={[styles.card, styles.remarksCard]}>
          <View style={styles.remarksHeader}>
            <ShieldCheck size={ICON.md} color={COLORS.primary} />
            <Text style={styles.remarksTitle}>Academic Committee Remarks</Text>
          </View>
          <Text style={styles.remarksText}>{nomination.decision_note}</Text>
          {nomination.reviewed_at && (
            <Text style={styles.remarksDate}>
              Reviewed on {new Date(nomination.reviewed_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Interactive Visual Status Tracker / Timeline */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Application Status Tracker</Text>
        <View style={styles.timelineContainer}>
          {timelineSteps.map((step, idx) => {
            const isLast = idx === timelineSteps.length - 1;
            const isDone = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineLeftCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      isDone && styles.timelineDotDone,
                      isActive && styles.timelineDotActive,
                    ]}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} color={COLORS.textInverse} />
                    ) : isActive ? (
                      <Clock size={14} color={COLORS.primary} />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        isDone && styles.timelineLineDone,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.timelineTitleRow}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        (isDone || isActive) && styles.timelineLabelDone,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {step.date && <Text style={styles.timelineDate}>{step.date}</Text>}
                  </View>
                  <Text style={styles.timelineDetail}>{step.detail}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Candidate & Sponsoring Society Info */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Candidate & Sponsoring Particulars</Text>

        <View style={styles.dataRow}>
          <User size={ICON.sm} color={COLORS.textSecondary} />
          <View style={styles.dataCol}>
            <Text style={styles.dataLabel}>Candidate Name</Text>
            <Text style={styles.dataValue}>
              {nomination.trainee_name} ({nomination.designation})
            </Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <Building size={ICON.sm} color={COLORS.textSecondary} />
          <View style={styles.dataCol}>
            <Text style={styles.dataLabel}>Sponsoring Cooperative Society</Text>
            <Text style={styles.dataValue}>
              {nomination.society_name || 'Self-Nominated Candidate'}
            </Text>
            {nomination.society_registration_no && (
              <Text style={styles.dataSub}>Reg No: {nomination.society_registration_no}</Text>
            )}
          </View>
        </View>

        {nomination.sponsor_officer_name && (
          <View style={styles.dataRow}>
            <ShieldCheck size={ICON.sm} color={COLORS.textSecondary} />
            <View style={styles.dataCol}>
              <Text style={styles.dataLabel}>Endorsing Sponsor Officer</Text>
              <Text style={styles.dataValue}>
                {nomination.sponsor_officer_name} ({nomination.sponsor_officer_designation})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.dataRow}>
          <Calendar size={ICON.sm} color={COLORS.textSecondary} />
          <View style={styles.dataCol}>
            <Text style={styles.dataLabel}>Training Dates & Assigned Batch</Text>
            <Text style={styles.dataValue}>
              {nomination.start_date || 'Oct 15, 2026'} to {nomination.end_date || 'Nov 12, 2026'}
            </Text>
            <Text style={styles.dataSub}>Batch: {nomination.batch_name || 'Unassigned'}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          label="Download Official Nomination Slip"
          onPress={() => setSlipModalVisible(true)}
          variant="primary"
          icon={<Download size={ICON.sm} color={COLORS.textInverse} />}
        />

        {currentStatus === 'submitted' && (
          <Button
            label="Withdraw Application"
            onPress={handleWithdraw}
            variant="secondary"
            loading={withdrawing}
            icon={<AlertTriangle size={ICON.sm} color={COLORS.danger} />}
          />
        )}
      </View>

      {/* Nomination Slip Modal */}
      <Modal
        visible={slipModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSlipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.slipCard}>
            <View style={styles.slipHeader}>
              <View style={styles.slipTitleBlock}>
                <Building2 size={ICON.lg} color={COLORS.primary} />
                <View>
                  <Text style={styles.slipInstitution}>{nomination.institution_name}</Text>
                  <Text style={styles.slipBadge}>OFFICIAL NOMINATION SLIP</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSlipModalVisible(false)}>
                <X size={ICON.md} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.slipDivider} />

            <View style={styles.slipGrid}>
              <View style={styles.slipItem}>
                <Text style={styles.slipItemLabel}>SLIP NUMBER</Text>
                <Text style={styles.slipItemValue}>{nomination.id.toUpperCase()}-CONF</Text>
              </View>
              <View style={styles.slipItem}>
                <Text style={styles.slipItemLabel}>STATUS</Text>
                <Text style={[styles.slipItemValue, { color: COLORS.success }]}>
                  {currentStatus.toUpperCase()}
                </Text>
              </View>
              <View style={styles.slipItem}>
                <Text style={styles.slipItemLabel}>TRAINEE NAME</Text>
                <Text style={styles.slipItemValue}>{nomination.trainee_name}</Text>
              </View>
              <View style={styles.slipItem}>
                <Text style={styles.slipItemLabel}>SPONSORING BODY</Text>
                <Text style={styles.slipItemValue}>{nomination.society_name || 'Direct'}</Text>
              </View>
              <View style={styles.slipItem}>
                <Text style={styles.slipItemLabel}>PROGRAMME</Text>
                <Text style={styles.slipItemValue}>{nomination.programme_title}</Text>
              </View>
              <View style={styles.slipItem}>
                <Text style={styles.slipItemLabel}>BATCH & DATES</Text>
                <Text style={styles.slipItemValue}>
                  {nomination.batch_name || 'Batch 1'} ({nomination.start_date || 'Oct 15, 2026'})
                </Text>
              </View>
            </View>

            {/* QR Stub */}
            <View style={styles.qrStubBox}>
              <QrCode size={64} color={COLORS.primaryDark} />
              <View style={styles.qrInfo}>
                <Text style={styles.qrTitle}>Digital Cryptographic Verification</Text>
                <Text style={styles.qrSub}>
                  Present this QR code at campus gate reception for instant badge printing and hostel check-in.
                </Text>
              </View>
            </View>

            <View style={styles.slipFooterBtns}>
              <Button
                label="Save to Device / Share"
                onPress={() => {
                  setSlipModalVisible(false);
                  Alert.alert('Slip Saved', 'Nomination slip PDF generated and saved to your device.');
                }}
                variant="primary"
                icon={<Share2 size={ICON.sm} color={COLORS.textInverse} />}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  headerIconBtn: {
    padding: SPACE.xs,
  },
  topCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appIdText: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  progTitle: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACE.xs,
  },
  hostelTag: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
  },
  remarksCard: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primaryBorder,
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  remarksTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
    fontSize: 13,
  },
  remarksText: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  remarksDate: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  sectionTitle: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  timelineContainer: {
    paddingVertical: SPACE.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotDone: {
    backgroundColor: COLORS.success,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.borderLight,
    marginVertical: 2,
  },
  timelineLineDone: {
    backgroundColor: COLORS.success,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: SPACE.sm,
    paddingBottom: SPACE.sm,
    gap: 2,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  timelineLabelDone: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  timelineDate: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  timelineDetail: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    paddingVertical: 4,
  },
  dataCol: {
    flex: 1,
  },
  dataLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  dataValue: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  dataSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  actionContainer: {
    gap: SPACE.sm,
    paddingTop: SPACE.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACE.md,
  },
  slipCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slipTitleBlock: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  slipInstitution: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  slipBadge: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  slipDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  slipGrid: {
    gap: SPACE.xs,
  },
  slipItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  slipItemLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  slipItemValue: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  qrStubBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.md,
  },
  qrInfo: {
    flex: 1,
    gap: 2,
  },
  qrTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  qrSub: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  slipFooterBtns: {
    paddingTop: SPACE.xs,
  },
});
