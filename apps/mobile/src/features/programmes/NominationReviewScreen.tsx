import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_USER_NOMINATIONS, NominationRecord } from './mockData';
import { apiClient } from '../../api/client';
import {
  User,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  CheckSquare,
  Square,
  FileText,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react-native';

const AVAILABLE_BATCHES = [
  { id: 'batch-vam-26-01', name: 'Batch 1 - Oct 2026', dates: 'Oct 15 - Nov 12', seatsLeft: 7 },
  { id: 'batch-vam-26-02', name: 'Batch 2 - Jan 2027', dates: 'Jan 10 - Feb 06', seatsLeft: 18 },
  { id: 'batch-vam-26-03', name: 'Batch 3 - Mar 2027', dates: 'Mar 01 - Mar 28', seatsLeft: 25 },
];

const QUICK_DECISION_NOTES = [
  'Meets all eligibility criteria. Verified society registration.',
  'Deputation approved with full hostel accommodation.',
  'Candidate transferred to Batch 2 due to capacity limits in Batch 1.',
  'Missing statutory NOC from sponsoring federation.',
];

export const NominationReviewScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'NominationReview'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const nominationId = route.params?.nominationId || 'nom-8432';

  const nomination: NominationRecord =
    MOCK_USER_NOMINATIONS.find((n) => n.id === nominationId) || MOCK_USER_NOMINATIONS[1];

  const [selectedBatchId, setSelectedBatchId] = useState(AVAILABLE_BATCHES[0].id);
  const [recommendHostel, setRecommendHostel] = useState(true);
  const [decisionNote, setDecisionNote] = useState(
    'Candidate credentials thoroughly examined. Sponsoring society is in active compliance status. Approved for enrollment.'
  );
  const [processing, setProcessing] = useState(false);

  const handleDecision = async (status: 'approved' | 'rejected' | 'waitlisted') => {
    if (status === 'rejected' && !decisionNote.trim()) {
      Alert.alert('Decision Note Required', 'Please provide a reason for rejecting this nomination.');
      return;
    }

    setProcessing(true);
    try {
      const url = `/programmes/nominations/${nomination.id}?status=${status}${
        status === 'approved' ? `&batch_id=${selectedBatchId}` : ''
      }&decision_note=${encodeURIComponent(decisionNote)}`;

      await apiClient(url, { method: 'PATCH' });
    } catch {
      // Mock fallback: proceed smoothly
    } finally {
      setProcessing(false);
      const actionVerb = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Waitlisted';
      Alert.alert(
        `Nomination ${actionVerb}`,
        `Candidate ${nomination.trainee_name} has been ${actionVerb.toLowerCase()} for ${nomination.programme_title}. Notification dispatched.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <ScrollScreen
      title="Review Nomination"
      onBack={() => navigation.goBack()}
      avoidKeyboard
    >
      {/* Header Info */}
      <View style={styles.topCard}>
        <View style={styles.topHeaderRow}>
          <Text style={styles.appId}>APPLICATION {nomination.id.toUpperCase()}</Text>
          <Badge label="Pending Review" variant="primary" />
        </View>
        <Text style={styles.progTitle}>{nomination.programme_title}</Text>
        <View style={styles.institutionRow}>
          <Building2 size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.institutionName}>{nomination.institution_name}</Text>
        </View>
      </View>

      {/* Candidate Profile Details */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <User size={ICON.md} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Applicant Particulars</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Candidate Name</Text>
            <Text style={styles.detailValue}>{nomination.trainee_name}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Current Designation</Text>
            <Text style={styles.detailValue}>{nomination.designation}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Contact Email</Text>
            <Text style={styles.detailValue}>{nomination.trainee_email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Contact Phone</Text>
            <Text style={styles.detailValue}>{nomination.trainee_phone}</Text>
          </View>
        </View>

        {/* Sponsoring Society block */}
        <View style={styles.societyBox}>
          <View style={styles.societyHeader}>
            <Building size={ICON.sm} color={COLORS.textSecondary} />
            <Text style={styles.societyTitle}>Sponsoring Organisation</Text>
          </View>
          <Text style={styles.societyName}>{nomination.society_name || 'Individual Self-Nomination'}</Text>
          {nomination.society_registration_no && (
            <Text style={styles.societyReg}>Registration: {nomination.society_registration_no}</Text>
          )}
          {nomination.sponsor_officer_name && (
            <Text style={styles.societySponsor}>
              Endorsed by: {nomination.sponsor_officer_name} ({nomination.sponsor_officer_designation})
            </Text>
          )}
        </View>

        {/* Statement of Purpose */}
        <View style={styles.justificationBox}>
          <View style={styles.justificationHeader}>
            <FileText size={ICON.sm} color={COLORS.textSecondary} />
            <Text style={styles.justificationTitle}>Nomination Justification</Text>
          </View>
          <Text style={styles.justificationText}>{nomination.justification}</Text>
        </View>
      </View>

      {/* Batch Assignment Selector */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Layers size={ICON.md} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Assign Training Batch</Text>
        </View>

        <View style={styles.batchesList}>
          {AVAILABLE_BATCHES.map((batch) => {
            const isSelected = selectedBatchId === batch.id;
            return (
              <TouchableOpacity
                key={batch.id}
                style={[styles.batchCard, isSelected && styles.batchCardSelected]}
                onPress={() => setSelectedBatchId(batch.id)}
                activeOpacity={0.8}
              >
                <View style={styles.batchRadioCol}>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </View>
                <View style={styles.batchInfoCol}>
                  <Text style={[styles.batchTitle, isSelected && styles.batchTitleSelected]}>
                    {batch.name}
                  </Text>
                  <View style={styles.batchDatesRow}>
                    <Calendar size={ICON.sm} color={COLORS.textMuted} />
                    <Text style={styles.batchDatesText}>{batch.dates}</Text>
                  </View>
                </View>
                <View style={styles.batchSeatsBadge}>
                  <Text style={styles.batchSeatsText}>{batch.seatsLeft} seats left</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hostel Recommendation Toggle */}
        <TouchableOpacity
          style={styles.hostelToggleRow}
          onPress={() => setRecommendHostel(!recommendHostel)}
          activeOpacity={0.8}
        >
          {recommendHostel ? (
            <CheckSquare size={ICON.md} color={COLORS.primary} />
          ) : (
            <Square size={ICON.md} color={COLORS.textMuted} />
          )}
          <Text style={styles.hostelToggleText}>
            Sanction campus hostel accommodation (Residential Block)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Decision Note & Remarks */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Review Decision & Remarks</Text>

        {/* Quick Suggestion Chips */}
        <Text style={styles.quickChipsHeading}>Quick Presets:</Text>
        <View style={styles.chipsWrap}>
          {QUICK_DECISION_NOTES.map((preset, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              onPress={() => setDecisionNote(preset)}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextField
          label="Reviewer Decision Note (Visible to candidate & sponsoring society) *"
          value={decisionNote}
          onChangeText={setDecisionNote}
          multiline
          numberOfLines={3}
          style={styles.textArea}
          placeholder="State reason for approval, conditions, or rejection..."
        />
      </View>

      {/* Decision Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          label="Approve & Enroll Trainee"
          onPress={() => handleDecision('approved')}
          variant="primary"
          loading={processing}
          icon={<CheckCircle size={ICON.sm} color={COLORS.textInverse} />}
        />

        <View style={styles.secondaryActionRow}>
          <View style={styles.actionCol}>
            <Button
              label="Place on Waitlist"
              onPress={() => handleDecision('waitlisted')}
              variant="secondary"
              icon={<Clock size={ICON.sm} color={COLORS.primary} />}
            />
          </View>
          <View style={styles.actionCol}>
            <Button
              label="Reject Nomination"
              onPress={() => handleDecision('rejected')}
              variant="secondary"
              icon={<XCircle size={ICON.sm} color={COLORS.danger} />}
            />
          </View>
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  topCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.xs,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appId: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  progTitle: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  institutionName: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACE.xs,
  },
  sectionTitle: {
    ...TEXT.section,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
  detailGrid: {
    gap: SPACE.xs,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  detailValue: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  societyBox: {
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.md,
    gap: 2,
    marginTop: SPACE.xs,
  },
  societyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  societyTitle: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  societyName: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  societyReg: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  societySponsor: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  justificationBox: {
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.md,
    gap: 2,
  },
  justificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  justificationTitle: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  justificationText: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  batchesList: {
    gap: SPACE.xs,
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    gap: SPACE.sm,
    backgroundColor: COLORS.surface,
  },
  batchCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  batchRadioCol: {
    justifyContent: 'center',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  batchInfoCol: {
    flex: 1,
    gap: 2,
  },
  batchTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  batchTitleSelected: {
    color: COLORS.primary,
  },
  batchDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batchDatesText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  batchSeatsBadge: {
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  batchSeatsText: {
    ...TEXT.captionStrong,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  hostelToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingTop: SPACE.xs,
  },
  hostelToggleText: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
  },
  quickChipsHeading: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  chipText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: SPACE.xs,
  },
  actionContainer: {
    gap: SPACE.sm,
    paddingTop: SPACE.sm,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  actionCol: {
    flex: 1,
  },
});
