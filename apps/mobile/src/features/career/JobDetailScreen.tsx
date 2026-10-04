import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { Button } from '../../components/Button';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  CAREER_JOBS_CATALOG,
  CURRENT_TRAINEE_PASSPORT,
  CareerJob,
} from './careerData';
import {
  Building,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Sparkles,
  FileCheck,
  ChevronRight,
  ArrowRight,
  Send,
  Users,
} from 'lucide-react-native';

export const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'JobDetail'>>();
  const { jobId } = route.params;

  const job: CareerJob = useMemo(() => {
    return (
      CAREER_JOBS_CATALOG.find((j) => j.id === jobId) ||
      CAREER_JOBS_CATALOG[0]
    );
  }, [jobId]);

  const passport = CURRENT_TRAINEE_PASSPORT;

  const [hasApplied, setHasApplied] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirmApplication = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setApplyModalVisible(false);
      setHasApplied(true);
      Alert.alert(
        'Application Submitted!',
        `Your verified NCCT Skill Passport (${passport.traineeId}) and credentials have been securely transmitted to ${job.employer}. You can monitor progress in My Applications.`,
        [
          { text: 'View Tracker', onPress: () => navigation.navigate('MyApplications') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    }, 700);
  };

  return (
    <ScrollScreen
      title="Job Opportunity"
      subtitle={`${job.employer}`}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Header Job Requisition Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.employerIconBox}>
              <Building size={ICON.md} color={COLORS.primary} />
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.employerRow}>
                <Text style={styles.employerName}>{job.employer}</Text>
                {job.isVerifiedCooperative ? (
                  <Badge label="Verified Cooperative" variant="success" verified />
                ) : null}
              </View>
            </View>
          </View>

          {/* Registration & Sector Meta */}
          <View style={styles.regInfoRow}>
            <Text style={styles.regNumber}>Reg: {job.coopRegistrationNumber}</Text>
            <Text style={styles.regDot}>•</Text>
            <Text style={styles.sectorTag}>{job.sector} Sector</Text>
          </View>

          {/* Key Facts Bar */}
          <View style={styles.factsGrid}>
            <View style={styles.factItem}>
              <MapPin size={ICON.sm} color={COLORS.textMuted} />
              <View>
                <Text style={styles.factLabel}>Location</Text>
                <Text style={styles.factValue}>{job.location}</Text>
              </View>
            </View>

            <View style={styles.factItem}>
              <Briefcase size={ICON.sm} color={COLORS.textMuted} />
              <View>
                <Text style={styles.factLabel}>Type</Text>
                <Text style={styles.factValue}>{job.type}</Text>
              </View>
            </View>

            <View style={styles.factItem}>
              <Award size={ICON.sm} color={COLORS.textMuted} />
              <View>
                <Text style={styles.factLabel}>Remuneration</Text>
                <Text style={styles.factValue}>{job.salary}</Text>
              </View>
            </View>

            <View style={styles.factItem}>
              <Calendar size={ICON.sm} color={COLORS.textMuted} />
              <View>
                <Text style={styles.factLabel}>Deadline</Text>
                <Text style={styles.factValue}>{job.deadline}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Explainable Skill Match Analysis Banner */}
        <SectionHeader title="Your NCCT Skill Match Breakdown" />
        <View style={styles.matchCard}>
          <View style={styles.matchScoreTop}>
            <View style={styles.matchGaugeWrap}>
              <Text style={styles.matchScoreBig}>{job.matchScore}%</Text>
              <Text style={styles.matchScoreLabel}>Skill Fit</Text>
            </View>
            <View style={styles.matchScoreTextWrap}>
              <View style={styles.fitStatusRow}>
                <Sparkles size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.fitStatusTitle}>
                  {job.matchScore >= 90
                    ? 'Exceptional Competency Fit'
                    : job.matchScore >= 75
                    ? 'Strong Cooperative Match'
                    : 'Partial Match'}
                </Text>
              </View>
              <Text style={styles.aiExplanationText}>{job.aiMatchExplanation}</Text>
            </View>
          </View>

          {/* Matched Skills vs Missing Skills Comparison */}
          <View style={styles.skillsComparisonBox}>
            <Text style={styles.comparisonSubhead}>Matched Competencies from Your Passport:</Text>
            <View style={styles.matchedSkillsList}>
              {job.matchedSkills.map((item) => (
                <View key={item.skill} style={styles.matchedSkillRow}>
                  <CheckCircle2 size={ICON.sm} color={COLORS.success} />
                  <View style={styles.matchedSkillInfo}>
                    <Text style={styles.matchedSkillName}>{item.skill}</Text>
                    <Text style={styles.matchedSkillMeta}>
                      Your Level: {item.userLevel} • {item.confidence}% Confidence
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {job.missingSkills.length > 0 ? (
              <View style={styles.missingSkillsWrap}>
                <Text style={styles.missingSubhead}>Missing Skill Gaps (Bridgeable):</Text>
                {job.missingSkills.map((item) => (
                  <View key={item.skill} style={styles.missingSkillRow}>
                    <AlertCircle size={ICON.sm} color={COLORS.danger} />
                    <View style={styles.missingSkillInfo}>
                      <Text style={styles.missingSkillName}>{item.skill}</Text>
                      <Text style={styles.missingCourseHint}>
                        Recommended: {item.recommendedCourse}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Detailed Role Description */}
        <SectionHeader title="Role Scope & Responsibilities" />
        <View style={styles.card}>
          <Text style={styles.bodyDescription}>{job.description}</Text>

          <Text style={[styles.subSectionTitle, { marginTop: SPACE.md }]}>
            Key Cooperative Responsibilities
          </Text>
          <View style={styles.bulletList}>
            {job.responsibilities.map((resp, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{resp}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.subSectionTitle, { marginTop: SPACE.md }]}>
            Eligibility & Institutional Background
          </Text>
          <View style={styles.bulletList}>
            {job.eligibility.map((el, i) => (
              <View key={i} style={styles.bulletItem}>
                <CheckCircle2 size={13} color={COLORS.primary} />
                <Text style={styles.bulletText}>{el}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Employer Trust & Identity */}
        <View style={styles.trustCard}>
          <ShieldCheck size={ICON.md} color={COLORS.success} />
          <View style={styles.trustTextWrap}>
            <Text style={styles.trustTitle}>Authenticated Cooperative Entity</Text>
            <Text style={styles.trustDesc}>
              {job.employer} is verified under the Multi-State Cooperative Societies Act. Placements through NURVEX are tracked by the NCCT placement portal.
            </Text>
          </View>
        </View>

        {/* Bottom Action Area */}
        <View style={styles.applyActionWrap}>
          {hasApplied ? (
            <View style={styles.appliedSuccessBox}>
              <CheckCircle2 size={ICON.md} color={COLORS.success} />
              <View style={styles.appliedSuccessInfo}>
                <Text style={styles.appliedSuccessTitle}>Application Submitted</Text>
                <Text style={styles.appliedSuccessDesc}>
                  Your verified credentials have been received by {job.employer}.
                </Text>
              </View>
            </View>
          ) : (
            <Button
              label={`Apply with Skill Passport (${job.matchScore}% Match)`}
              variant="primary"
              onPress={() => setApplyModalVisible(true)}
              icon={<Send size={ICON.sm} color={COLORS.textInverse} />}
            />
          )}
        </View>
      </View>

      {/* Confirmation & Credentials Modal */}
      <Modal
        visible={applyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Confirm Cooperative Application</Text>
            <Text style={styles.modalSubheading}>
              Applying for: {job.title} at {job.employer}
            </Text>

            {/* Passport Preview Box */}
            <View style={styles.passportAttachedBox}>
              <FileCheck size={ICON.md} color={COLORS.primary} />
              <View style={styles.passportAttachedInfo}>
                <Text style={styles.passportAttachedTitle}>Attached NCCT Skill Passport</Text>
                <Text style={styles.passportAttachedId}>{passport.traineeId} • {passport.fullName}</Text>
                <Text style={styles.passportAttachedDetails}>
                  {passport.credentials.length} Verified Micro-credentials • {passport.overallAttendancePercentage}% Attendance
                </Text>
              </View>
            </View>

            <Text style={styles.dataConsentText}>
              By proceeding, you authorize {job.employer} to inspect your tamper-proof NCCT certificates, biometric attendance logs, and competency evaluations.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setApplyModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSubmitBtn}
                onPress={handleConfirmApplication}
              >
                {submitting ? (
                  <Text style={styles.confirmSubmitText}>Transmitting...</Text>
                ) : (
                  <Text style={styles.confirmSubmitText}>Confirm & Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  headerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  headerTop: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'flex-start',
  },
  employerIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 3,
  },
  jobTitle: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    flexWrap: 'wrap',
  },
  employerName: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  regInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  regNumber: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  regDot: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  sectorTag: {
    ...TEXT.captionStrong,
    fontSize: 11,
    color: COLORS.primary,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.md,
    paddingTop: SPACE.xs,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  factLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  factValue: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  matchCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  matchScoreTop: {
    flexDirection: 'row',
    gap: SPACE.md,
    alignItems: 'center',
  },
  matchGaugeWrap: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  matchScoreBig: {
    ...TEXT.title,
    color: COLORS.primary,
  },
  matchScoreLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  matchScoreTextWrap: {
    flex: 1,
    gap: 2,
  },
  fitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fitStatusTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  aiExplanationText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  skillsComparisonBox: {
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACE.xs,
  },
  comparisonSubhead: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  matchedSkillsList: {
    gap: 6,
  },
  matchedSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  matchedSkillInfo: {
    flex: 1,
  },
  matchedSkillName: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  matchedSkillMeta: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  missingSkillsWrap: {
    marginTop: SPACE.sm,
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
  },
  missingSubhead: {
    ...TEXT.captionStrong,
    color: COLORS.danger,
  },
  missingSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  missingSkillInfo: {
    flex: 1,
  },
  missingSkillName: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  missingCourseHint: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.primary,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  bodyDescription: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  subSectionTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  bulletList: {
    gap: 6,
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
  },
  bulletText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.successSurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  trustTextWrap: {
    flex: 1,
  },
  trustTitle: {
    ...TEXT.captionStrong,
    color: '#22543D',
  },
  trustDesc: {
    ...TEXT.caption,
    color: '#276749',
    fontSize: 11,
    marginTop: 2,
  },
  applyActionWrap: {
    marginTop: SPACE.xs,
    marginBottom: SPACE.xl,
  },
  appliedSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.successSurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  appliedSuccessInfo: {
    flex: 1,
  },
  appliedSuccessTitle: {
    ...TEXT.bodyStrong,
    color: '#22543D',
  },
  appliedSuccessDesc: {
    ...TEXT.caption,
    color: '#276749',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACE.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    gap: SPACE.sm,
  },
  modalHeading: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  modalSubheading: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  passportAttachedBox: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  passportAttachedInfo: {
    flex: 1,
  },
  passportAttachedTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  passportAttachedId: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
    fontSize: 11,
  },
  passportAttachedDetails: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dataConsentText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACE.sm,
    marginTop: SPACE.sm,
  },
  cancelBtn: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  cancelBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
  confirmSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
  },
  confirmSubmitText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
});
