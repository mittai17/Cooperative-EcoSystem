import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  MY_APPLICATIONS_LIST,
  TraineeApplication,
} from './careerData';
import {
  Briefcase,
  Building,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Video,
  Award,
  CheckCircle2,
  Star,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';

const FILTER_TABS = [
  'All',
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Offer Received',
] as const;

export const MyApplicationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [applications, setApplications] = useState<TraineeApplication[]>(MY_APPLICATIONS_LIST);

  const filtered = applications.filter((app) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Applied') return app.status === 'applied';
    if (selectedFilter === 'Shortlisted') return app.status === 'shortlisted';
    if (selectedFilter === 'Interview Scheduled') return app.status === 'interview_scheduled';
    if (selectedFilter === 'Offer Received') return app.status === 'offer_received';
    return true;
  });

  const getStatusBadgeProps = (status: TraineeApplication['status']) => {
    switch (status) {
      case 'offer_received':
      case 'hired':
        return { label: 'Offer Received', variant: 'success' as const, verified: true };
      case 'interview_scheduled':
        return { label: 'Interview Scheduled', variant: 'primary' as const };
      case 'shortlisted':
        return { label: 'Shortlisted', variant: 'primary' as const };
      case 'applied':
      default:
        return { label: 'Applied', variant: 'neutral' as const };
    }
  };

  return (
    <ScrollScreen
      title="My Applications"
      subtitle={`${applications.length} cooperative applications tracked`}
      onBack={() => navigation.goBack()}
      sticky={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {FILTER_TABS.map((tab) => {
            const active = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(tab)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      }
    >
      <View style={styles.container}>
        {/* KPI Summary Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>{applications.length}</Text>
            <Text style={styles.kpiLabel}>Total Applied</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNumber, { color: COLORS.primary }]}>
              {applications.filter((a) => a.status === 'shortlisted').length}
            </Text>
            <Text style={styles.kpiLabel}>Shortlisted</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNumber, { color: '#D97706' }]}>
              {applications.filter((a) => a.status === 'interview_scheduled').length}
            </Text>
            <Text style={styles.kpiLabel}>Interviews</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiNumber, { color: COLORS.success }]}>
              {applications.filter((a) => a.status === 'offer_received').length}
            </Text>
            <Text style={styles.kpiLabel}>Offers</Text>
          </View>
        </View>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No applications in this view"
            message="Check back soon or explore more openings that match your NCCT Skill Passport."
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((app) => {
              const statusProps = getStatusBadgeProps(app.status);

              return (
                <View key={app.id} style={styles.appCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.titleWrap}>
                      <Text style={styles.jobTitle}>{app.jobTitle}</Text>
                      <Text style={styles.employerName}>{app.employer}</Text>
                    </View>
                    <Badge {...statusProps} />
                  </View>

                  {/* Meta Bar */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MapPin size={12} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{app.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Calendar size={12} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>Applied on {app.appliedDate}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Sparkles size={12} color={COLORS.primary} />
                      <Text style={styles.metaText}>{app.matchScore}% Match</Text>
                    </View>
                  </View>

                  {/* Interview Details Card (If interview scheduled) */}
                  {app.interviewDetails ? (
                    <View style={styles.interviewAlertBox}>
                      <View style={styles.interviewAlertTop}>
                        <Calendar size={ICON.md} color={COLORS.primary} />
                        <Text style={styles.interviewAlertTitle}>
                          Interview Scheduled: {app.interviewDetails.date} at {app.interviewDetails.time}
                        </Text>
                      </View>
                      <View style={styles.interviewModeRow}>
                        {app.interviewDetails.mode === 'Virtual Video Conference' ? (
                          <Video size={13} color={COLORS.primary} />
                        ) : (
                          <MapPin size={13} color={COLORS.primary} />
                        )}
                        <Text style={styles.interviewModeText}>
                          {app.interviewDetails.mode}: {app.interviewDetails.locationOrLink}
                        </Text>
                      </View>
                      <Text style={styles.interviewerNote}>
                        Note: {app.interviewDetails.interviewerNote}
                      </Text>
                    </View>
                  ) : null}

                  {/* Offer Details Card (If offer received) */}
                  {app.offerDetails ? (
                    <View style={styles.offerAlertBox}>
                      <View style={styles.offerAlertTop}>
                        <Award size={ICON.md} color={COLORS.success} />
                        <Text style={styles.offerAlertTitle}>Official Cooperative Offer Extended!</Text>
                      </View>
                      <Text style={styles.offerDesignation}>
                        Designation: {app.offerDetails.designation}
                      </Text>
                      <Text style={styles.offerCtc}>
                        Annual CTC: <Text style={styles.boldCtc}>{app.offerDetails.ctc}</Text>
                      </Text>
                      <Text style={styles.offerDate}>
                        Proposed Joining Date: {app.offerDetails.joiningDate}
                      </Text>
                    </View>
                  ) : null}

                  {/* Employer Feedback Section (If provided) */}
                  {app.employerFeedback ? (
                    <View style={styles.feedbackBox}>
                      <View style={styles.feedbackHeader}>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              color={s <= app.employerFeedback!.rating ? '#EAB308' : COLORS.border}
                              fill={s <= app.employerFeedback!.rating ? '#EAB308' : 'transparent'}
                            />
                          ))}
                        </View>
                        <Text style={styles.feedbackScore}>
                          Employer Review ({app.employerFeedback.rating}/5)
                        </Text>
                      </View>
                      <Text style={styles.feedbackComments}>
                        &ldquo;{app.employerFeedback.comments}&rdquo;
                      </Text>
                    </View>
                  ) : null}

                  {/* Footer link to Job details */}
                  <TouchableOpacity
                    style={styles.cardFooter}
                    onPress={() => navigation.navigate('JobDetail', { jobId: app.jobId })}
                  >
                    <Text style={styles.viewJobText}>View Original Job Description</Text>
                    <ChevronRight size={ICON.sm} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.textInverse,
  },
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  kpiBox: {
    ...CARD,
    flex: 1,
    padding: SPACE.sm,
    alignItems: 'center',
    gap: 2,
  },
  kpiNumber: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
  },
  kpiLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  list: {
    gap: SPACE.md,
  },
  appCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  jobTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  employerName: {
    ...TEXT.caption,
    color: COLORS.primary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  interviewAlertBox: {
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.sm + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: 4,
  },
  interviewAlertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interviewAlertTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  interviewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  interviewModeText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  interviewerNote: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  offerAlertBox: {
    backgroundColor: COLORS.successSurface,
    padding: SPACE.sm + 2,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    gap: 3,
  },
  offerAlertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerAlertTitle: {
    ...TEXT.bodyStrong,
    color: '#22543D',
  },
  offerDesignation: {
    ...TEXT.caption,
    color: '#276749',
    fontSize: 11,
  },
  offerCtc: {
    ...TEXT.caption,
    color: '#276749',
    fontSize: 11,
  },
  boldCtc: {
    fontWeight: '700',
    color: '#22543D',
  },
  offerDate: {
    ...TEXT.caption,
    fontSize: 10,
    color: '#276749',
  },
  feedbackBox: {
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  feedbackScore: {
    ...TEXT.captionStrong,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  feedbackComments: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  viewJobText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
});
