import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { SectionHeader } from '../../components/SectionHeader';
import { Button } from '../../components/Button';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  CANDIDATE_PROFILES,
  INITIAL_JOBS,
  CandidateProfile,
} from './employerData';
import {
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Briefcase,
  FileText,
  UserCheck,
  TrendingUp,
} from 'lucide-react-native';

export const CandidateDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'CandidateDetail'>>();
  const { traineeId, jobId } = route.params;

  // Retrieve candidate profile
  const profile: CandidateProfile = useMemo(() => {
    return (
      CANDIDATE_PROFILES[traineeId] ||
      CANDIDATE_PROFILES['trainee-pooja-patel']
    );
  }, [traineeId]);

  const relatedJob = useMemo(() => {
    if (!jobId) return null;
    return INITIAL_JOBS.find((j) => j.id === jobId) || null;
  }, [jobId]);

  // Modals for Actions
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [interviewDate, setInterviewDate] = useState('2026-10-15');
  const [interviewTime, setInterviewTime] = useState('11:00 AM');
  const [interviewNotes, setInterviewNotes] = useState('Evaluation interview with Senior Management panel');

  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerSalary, setOfferSalary] = useState('₹5,50,000 / year');
  const [offerRole, setOfferRole] = useState(relatedJob?.title || 'Cooperative Operations Specialist');
  const [joiningDate, setJoiningDate] = useState('2026-11-01');

  const handleScheduleInterview = () => {
    setInterviewModalVisible(false);
    Alert.alert(
      'Interview Scheduled',
      `Interview confirmed for ${interviewDate} at ${interviewTime}. The candidate has been notified via CoopSetu.`
    );
  };

  const handleMakeOffer = () => {
    setOfferModalVisible(false);
    Alert.alert(
      'Offer Extended',
      `Official cooperative employment offer of ${offerSalary} sent to ${profile.name}. Candidate will be prompted to accept in their portal.`
    );
  };

  return (
    <ScrollScreen
      title="Candidate Profile"
      subtitle={`Verified Skill Passport: ${profile.passport_id}`}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Candidate Header Profile Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.verifiedRow}>
                <Text style={styles.candidateName}>{profile.name}</Text>
                <ShieldCheck size={ICON.md} color={COLORS.primary} />
              </View>
              <Text style={styles.occupationText}>{profile.occupation}</Text>
              <View style={styles.metaRow}>
                <MapPin size={ICON.sm} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{profile.location}</Text>
              </View>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactDetailsRow}>
            <View style={styles.contactItem}>
              <Mail size={ICON.sm} color={COLORS.primary} />
              <Text style={styles.contactText}>{profile.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={ICON.sm} color={COLORS.primary} />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </View>
          </View>

          {/* Bio */}
          <Text style={styles.bioText}>{profile.bio}</Text>

          {/* NCCT Passport Badge Bar */}
          <View style={styles.passportBadgeBar}>
            <View style={styles.passportBadgeLeft}>
              <Award size={ICON.md} color={COLORS.primary} />
              <View>
                <Text style={styles.passportIdText}>NCCT Skill Passport</Text>
                <Text style={styles.passportCodeText}>{profile.passport_id}</Text>
              </View>
            </View>
            <Badge label="100% Cryptographically Verified" variant="success" verified />
          </View>
        </View>

        {/* Attendance & Training Commitment KPI */}
        <SectionHeader title="Verified Training Attendance" />
        <View style={styles.card}>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceGauge}>
              <Text style={styles.attendancePercent}>{profile.attendance_percentage}%</Text>
              <Text style={styles.attendanceLabel}>Attendance</Text>
            </View>
            <View style={styles.attendanceDetails}>
              <Text style={styles.attendanceHighlight}>
                {profile.attendance_percentage >= 90 ? 'Outstanding Regularity' : 'Good Standing'}
              </Text>
              <Text style={styles.attendanceDesc}>
                Logged via biometric & NFC kiosk sessions at {profile.institute_attended}.
              </Text>
              <View style={styles.hoursTag}>
                <Clock size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.hoursTagText}>{profile.total_training_hours} Practical Lab & Field Hours</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <ProgressBar value={profile.attendance_percentage} height={8} color={COLORS.success} />
          </View>
        </View>

        {/* Verified Cooperative Competencies */}
        <SectionHeader title="Verified Skills (NCCT Skill Passport)" />
        <View style={styles.skillsList}>
          {profile.skills.map((skill, index) => (
            <View key={index} style={styles.skillCard}>
              <View style={styles.skillCardTop}>
                <View style={styles.skillTitleWrap}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillEvidence}>{skill.evidence}</Text>
                </View>
                <Badge
                  label={skill.level}
                  variant={skill.level === 'Proficient' || skill.level === 'Advanced' ? 'primary' : 'neutral'}
                />
              </View>

              <View style={styles.confidenceRow}>
                <View style={styles.confidenceTextWrap}>
                  <Text style={styles.confidenceLabel}>Confidence Score</Text>
                  <Text style={styles.confidenceValue}>{skill.confidence}%</Text>
                </View>
                <ProgressBar value={skill.confidence} height={6} color={COLORS.primary} />
              </View>

              <View style={styles.skillFooter}>
                <View style={styles.verifiedChip}>
                  <CheckCircle2 size={12} color={COLORS.success} />
                  <Text style={styles.verifiedChipText}>Accredited Micro-credential</Text>
                </View>
                {skill.hours ? (
                  <Text style={styles.skillHours}>{skill.hours} hrs completed</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Accredited Diplomas & Certificates */}
        <SectionHeader title="Official Diplomas & Micro-Credentials" />
        <View style={styles.certificatesList}>
          {profile.certificates.map((cert) => (
            <View key={cert.id} style={styles.certCard}>
              <View style={styles.certIconBox}>
                <Award size={ICON.md} color={COLORS.primary} />
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certIssuer}>{cert.issuer}</Text>
                <View style={styles.certMetaRow}>
                  <Text style={styles.certCode}>Verification: {cert.verification_code}</Text>
                  <Badge label="Valid" variant="success" verified />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Education & Background */}
        <SectionHeader title="Academic & Institutional Background" />
        <View style={styles.card}>
          <View style={styles.eduItem}>
            <GraduationCap size={ICON.md} color={COLORS.primary} />
            <View style={styles.eduTextWrap}>
              <Text style={styles.eduTitle}>{profile.education_level}</Text>
              <Text style={styles.eduSubtitle}>{profile.institute_attended}</Text>
            </View>
          </View>
          <View style={[styles.eduItem, { marginTop: SPACE.sm }]}>
            <Briefcase size={ICON.md} color={COLORS.primary} />
            <View style={styles.eduTextWrap}>
              <Text style={styles.eduTitle}>{profile.years_of_experience} Years Cooperative Sector Experience</Text>
              <Text style={styles.eduSubtitle}>Field work in primary societies and district cooperative unions</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.interviewBtn]}
            onPress={() => setInterviewModalVisible(true)}
            activeOpacity={0.85}
          >
            <Calendar size={ICON.md} color={COLORS.textInverse} />
            <Text style={styles.actionBtnTextInverse}>Schedule Interview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.offerBtn]}
            onPress={() => setOfferModalVisible(true)}
            activeOpacity={0.85}
          >
            <UserCheck size={ICON.md} color={COLORS.textInverse} />
            <Text style={styles.actionBtnTextInverse}>Make Offer</Text>
          </TouchableOpacity>
        </View>

        {/* Placement feedback link if candidate is recruited */}
        <TouchableOpacity
          style={styles.feedbackLink}
          onPress={() =>
            navigation.navigate('PlacementFeedback', {
              applicationId: 'app-001',
            })
          }
        >
          <TrendingUp size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.feedbackLinkText}>Submit 30/60-Day Placement Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Interview Modal */}
      <Modal
        visible={interviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInterviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHead}>Schedule Interview</Text>
            <Text style={styles.modalSubhead}>Candidate: {profile.name}</Text>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={interviewDate}
              onChangeText={setInterviewDate}
            />

            <Text style={styles.inputLabel}>Time</Text>
            <TextInput
              style={styles.modalInput}
              value={interviewTime}
              onChangeText={setInterviewTime}
            />

            <Text style={styles.inputLabel}>Interviewer Notes / Format</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              value={interviewNotes}
              onChangeText={setInterviewNotes}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setInterviewModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleScheduleInterview}
              >
                <Text style={styles.modalConfirmText}>Confirm Interview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Make Offer Modal */}
      <Modal
        visible={offerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHead}>Extend Cooperative Offer</Text>
            <Text style={styles.modalSubhead}>Candidate: {profile.name}</Text>

            <Text style={styles.inputLabel}>Designation / Role Title</Text>
            <TextInput
              style={styles.modalInput}
              value={offerRole}
              onChangeText={setOfferRole}
            />

            <Text style={styles.inputLabel}>Annual CTC / Remuneration</Text>
            <TextInput
              style={styles.modalInput}
              value={offerSalary}
              onChangeText={setOfferSalary}
            />

            <Text style={styles.inputLabel}>Proposed Joining Date</Text>
            <TextInput
              style={styles.modalInput}
              value={joiningDate}
              onChangeText={setJoiningDate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setOfferModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: COLORS.success }]}
                onPress={handleMakeOffer}
              >
                <Text style={styles.modalConfirmText}>Send Official Offer</Text>
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
    gap: SPACE.md,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TEXT.title,
    color: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  candidateName: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  occupationText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.md,
    paddingVertical: SPACE.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
  },
  bioText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  passportBadgeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  passportBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  passportIdText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  passportCodeText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: SPACE.md,
    alignItems: 'center',
  },
  attendanceGauge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successSurface,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    width: 80,
  },
  attendancePercent: {
    ...TEXT.title,
    color: COLORS.success,
  },
  attendanceLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: '#22543D',
  },
  attendanceDetails: {
    flex: 1,
    gap: 4,
  },
  attendanceHighlight: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  attendanceDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  hoursTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hoursTagText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  progressContainer: {
    marginTop: SPACE.sm,
  },
  skillsList: {
    gap: SPACE.sm,
  },
  skillCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  skillCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skillTitleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  skillName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  skillEvidence: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  confidenceRow: {
    marginTop: SPACE.xs,
    gap: 4,
  },
  confidenceTextWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceLabel: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  confidenceValue: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACE.xs,
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedChipText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.success,
  },
  skillHours: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  certificatesList: {
    gap: SPACE.sm,
  },
  certCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  certIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certInfo: {
    flex: 1,
    gap: 2,
  },
  certTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  certIssuer: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  certCode: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  eduItem: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  eduTextWrap: {
    flex: 1,
  },
  eduTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  eduSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: SPACE.md,
    marginTop: SPACE.sm,
  },
  actionBtn: {
    flex: 1,
    height: HIT + 6,
    borderRadius: RADII.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  interviewBtn: {
    backgroundColor: COLORS.primary,
  },
  offerBtn: {
    backgroundColor: '#0D9488',
  },
  actionBtnTextInverse: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
  },
  feedbackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACE.sm,
    marginBottom: SPACE.lg,
  },
  feedbackLinkText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACE.md,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    gap: SPACE.xs,
  },
  modalHead: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  modalSubhead: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginBottom: SPACE.sm,
  },
  inputLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    marginTop: SPACE.xs,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
    height: HIT - 4,
    ...TEXT.body,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACE.sm,
    marginTop: SPACE.md,
  },
  modalCancel: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  modalCancelText: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
  modalConfirm: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
  },
  modalConfirmText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
});
