import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { SearchField } from '../../components/SearchField';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  INITIAL_JOBS,
  INITIAL_APPLICANTS,
  JobApplicant,
} from './employerData';
import {
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  UserCheck,
  ChevronRight,
  Briefcase,
  AlertCircle,
  FileCheck,
  MapPin,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';

const STATUS_TABS = ['All', 'Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'] as const;

export const JobApplicantsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'JobApplicants'>>();
  const { jobId } = route.params;

  const job = useMemo(
    () => INITIAL_JOBS.find((j) => j.id === jobId) || INITIAL_JOBS[0],
    [jobId]
  );

  const [applicants, setApplicants] = useState<JobApplicant[]>(INITIAL_APPLICANTS);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeApplicantModal, setActiveApplicantModal] = useState<JobApplicant | null>(null);

  // Filter applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      // Must match job or fallback for demo
      const matchesJob = app.job_id === jobId || app.job_id === 'job-dairy-supervisor-anand';
      const matchesStatus =
        selectedStatus === 'All'
          ? true
          : selectedStatus === 'Interview'
          ? app.status === 'interview'
          : app.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesQuery =
        !searchQuery.trim() ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.matched_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        app.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesJob && matchesStatus && matchesQuery;
    });
  }, [applicants, jobId, selectedStatus, searchQuery]);

  const updateApplicantStatus = (
    applicantId: string,
    newStatus: JobApplicant['status'],
    note?: string
  ) => {
    setApplicants((prev) =>
      prev.map((app) =>
        app.id === applicantId
          ? {
              ...app,
              status: newStatus,
              employer_note: note ?? app.employer_note,
              interview_at:
                newStatus === 'interview'
                  ? new Date(Date.now() + 86400000 * 3).toISOString()
                  : app.interview_at,
            }
          : app
      )
    );
    setActiveApplicantModal(null);
    Alert.alert(
      'Status Updated',
      `Candidate status changed to ${newStatus.toUpperCase()}. Notification queued for candidate.`
    );
  };

  const getMatchBadgeVariant = (score: number): 'success' | 'primary' | 'neutral' => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'primary';
    return 'neutral';
  };

  return (
    <ScrollScreen
      title="Applicant Pipeline"
      subtitle={`${job?.title || 'Job Opening'} (${filteredApplicants.length} applicants)`}
      onBack={() => navigation.goBack()}
      sticky={
        <View style={styles.stickyHeader}>
          <SearchField
            placeholder="Search by name, skill, or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsRow}
          >
            {STATUS_TABS.map((tab) => {
              const active = selectedStatus === tab;
              const count = applicants.filter(
                (a) =>
                  (a.job_id === jobId || a.job_id === 'job-dairy-supervisor-anand') &&
                  (tab === 'All' ? true : a.status.toLowerCase() === tab.toLowerCase())
              ).length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.statusTab, active && styles.statusTabActive]}
                  onPress={() => setSelectedStatus(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusTabText, active && styles.statusTabTextActive]}>
                    {tab}
                  </Text>
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      }
    >
      <View style={styles.content}>
        {/* Job Requisition Overview Card */}
        <View style={styles.jobBriefCard}>
          <View style={styles.jobBriefTop}>
            <View style={styles.jobBriefTitleWrap}>
              <Text style={styles.jobBriefTitle}>{job.title}</Text>
              <Text style={styles.jobBriefEmployer}>{job.employer}</Text>
            </View>
            <TouchableOpacity
              style={styles.editJobButton}
              onPress={() => navigation.navigate('JobEditor', { jobId: job.id })}
            >
              <Text style={styles.editJobButtonText}>Edit Job</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.jobBriefMeta}>
            <View style={styles.metaChip}>
              <MapPin size={ICON.sm} color={COLORS.textMuted} />
              <Text style={styles.metaChipText}>{job.location}</Text>
            </View>
            <View style={styles.metaChip}>
              <Briefcase size={ICON.sm} color={COLORS.textMuted} />
              <Text style={styles.metaChipText}>{job.openings} Openings</Text>
            </View>
            <View style={styles.metaChip}>
              <Award size={ICON.sm} color={COLORS.primary} />
              <Text style={styles.metaChipText}>{job.sector}</Text>
            </View>
          </View>
        </View>

        {/* Applicants List */}
        {filteredApplicants.length === 0 ? (
          <EmptyState
            title="No applicants found"
            message={`No candidates found in the "${selectedStatus}" filter for this position.`}
          />
        ) : (
          <View style={styles.applicantsList}>
            {filteredApplicants.map((applicant) => {
              const isShortlisted = applicant.status === 'shortlisted';
              const isInterview = applicant.status === 'interview';
              const isOffered = applicant.status === 'offered';

              return (
                <TouchableOpacity
                  key={applicant.id}
                  style={styles.applicantCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    navigation.navigate('CandidateDetail', {
                      traineeId: applicant.trainee_id,
                      jobId: job.id,
                    })
                  }
                >
                  {/* Card Header */}
                  <View style={styles.applicantCardHeader}>
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarInitials}>{applicant.avatar_initials}</Text>
                    </View>
                    <View style={styles.applicantInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.applicantName}>{applicant.name}</Text>
                        <Badge
                          label={`${applicant.match_score}% Match`}
                          variant={getMatchBadgeVariant(applicant.match_score)}
                        />
                      </View>
                      <Text style={styles.applicantOccupation}>{applicant.occupation}</Text>
                      <Text style={styles.applicantInstitute}>{applicant.institute}</Text>
                    </View>
                  </View>

                  {/* Skill Passport Preview Chip */}
                  <View style={styles.passportChip}>
                    <FileCheck size={ICON.sm} color={COLORS.success} />
                    <Text style={styles.passportChipText}>
                      Skill Passport Verified: {applicant.verified_skill_count} Competencies | Attendance {applicant.attendance_percentage}%
                    </Text>
                  </View>

                  {/* Matched Competencies Tags */}
                  <View style={styles.skillsRow}>
                    {applicant.matched_skills.map((skill) => (
                      <View key={skill} style={styles.matchedTag}>
                        <CheckCircle2 size={12} color={COLORS.success} />
                        <Text style={styles.matchedTagText}>{skill}</Text>
                      </View>
                    ))}
                    {applicant.missing_skills.map((skill) => (
                      <View key={skill} style={styles.missingTag}>
                        <Text style={styles.missingTagText}>Missing: {skill}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Status & Quick Action Bar */}
                  <View style={styles.cardFooter}>
                    <View style={styles.statusPill}>
                      <Clock size={ICON.sm} color={COLORS.textSecondary} />
                      <Text style={styles.statusPillText}>
                        Status: <Text style={styles.statusPillTextBold}>{applicant.status.toUpperCase()}</Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.actionMenuButton}
                      onPress={() => setActiveApplicantModal(applicant)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.actionMenuText}>Actions</Text>
                      <ChevronRight size={ICON.sm} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Action / Status Transition Modal */}
      <Modal
        visible={Boolean(activeApplicantModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveApplicantModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Candidate Status</Text>
            <Text style={styles.modalSubtitle}>
              {activeApplicantModal?.name} ({activeApplicantModal?.match_score}% Match)
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.shortlistBtn]}
                onPress={() =>
                  activeApplicantModal &&
                  updateApplicantStatus(activeApplicantModal.id, 'shortlisted')
                }
              >
                <UserCheck size={ICON.md} color={COLORS.primary} />
                <Text style={styles.modalActionText}>Shortlist Candidate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.interviewBtn]}
                onPress={() =>
                  activeApplicantModal &&
                  updateApplicantStatus(
                    activeApplicantModal.id,
                    'interview',
                    'Interview scheduled for upcoming batch evaluation'
                  )
                }
              >
                <Calendar size={ICON.md} color={COLORS.primary} />
                <Text style={styles.modalActionText}>Schedule Interview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.offerBtn]}
                onPress={() =>
                  activeApplicantModal &&
                  updateApplicantStatus(activeApplicantModal.id, 'offered')
                }
              >
                <Award size={ICON.md} color={COLORS.success} />
                <Text style={[styles.modalActionText, { color: COLORS.success }]}>
                  Extend Cooperative Offer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, { borderColor: COLORS.danger, backgroundColor: '#FEF2F2' }]}
                onPress={() =>
                  activeApplicantModal &&
                  updateApplicantStatus(
                    activeApplicantModal.id,
                    'rejected',
                    'Application rejected following preliminary review'
                  )
                }
              >
                <XCircle size={ICON.md} color={COLORS.danger} />
                <Text style={[styles.modalActionText, { color: COLORS.danger }]}>
                  Reject Candidate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.viewProfileBtn]}
                onPress={() => {
                  const target = activeApplicantModal;
                  setActiveApplicantModal(null);
                  if (target) {
                    navigation.navigate('CandidateDetail', {
                      traineeId: target.trainee_id,
                      jobId: job.id,
                    });
                  }
                }}
              >
                <FileCheck size={ICON.md} color={COLORS.primaryDark} />
                <Text style={styles.modalActionText}>View Full Skill Passport</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.feedbackBtn]}
                onPress={() => {
                  const target = activeApplicantModal;
                  setActiveApplicantModal(null);
                  if (target) {
                    navigation.navigate('PlacementFeedback', {
                      applicationId: target.id,
                    });
                  }
                }}
              >
                <TrendingUp size={ICON.md} color={COLORS.primary} />
                <Text style={styles.modalActionText}>Submit Placement Feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setActiveApplicantModal(null)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACE.xs,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusTabText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  statusTabTextActive: {
    color: COLORS.textInverse,
  },
  tabBadge: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    ...TEXT.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBadgeTextActive: {
    color: COLORS.textInverse,
  },
  content: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  jobBriefCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  jobBriefTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobBriefTitleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  jobBriefTitle: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  jobBriefEmployer: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  editJobButton: {
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  editJobButtonText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  jobBriefMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  metaChipText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  applicantsList: {
    gap: SPACE.md,
  },
  applicantCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  applicantCardHeader: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  applicantInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantName: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  applicantOccupation: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  applicantInstitute: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  passportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successSurface,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  passportChipText: {
    ...TEXT.captionStrong,
    color: '#22543D',
    fontSize: 11,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  matchedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: SPACE.xs + 4,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.badgeBorder,
  },
  matchedTagText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  missingTag: {
    backgroundColor: COLORS.dangerSurface,
    paddingHorizontal: SPACE.xs + 4,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  missingTagText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.danger,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  statusPillTextBold: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  actionMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionMenuText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
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
  modalTitle: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  modalSubtitle: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginBottom: SPACE.sm,
  },
  modalButtons: {
    gap: SPACE.sm,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shortlistBtn: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primaryBorder,
  },
  interviewBtn: {
    backgroundColor: COLORS.surface,
  },
  offerBtn: {
    backgroundColor: COLORS.successSurface,
    borderColor: '#C6F6D5',
  },
  viewProfileBtn: {
    backgroundColor: COLORS.surface,
  },
  feedbackBtn: {
    backgroundColor: COLORS.surface,
  },
  modalActionText: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    marginTop: SPACE.xs,
    paddingVertical: SPACE.sm,
    alignItems: 'center',
  },
  modalCloseText: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
});
