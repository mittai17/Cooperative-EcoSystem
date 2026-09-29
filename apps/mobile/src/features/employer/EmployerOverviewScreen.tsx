import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  INITIAL_JOBS,
  INITIAL_APPLICANTS,
} from './employerData';
import {
  Briefcase,
  Users,
  Award,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  TrendingUp,
} from 'lucide-react-native';

export const EmployerOverviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const openJobs = useMemo(() => INITIAL_JOBS.filter((j) => j.status === 'open'), []);
  const recentApplicants = useMemo(() => INITIAL_APPLICANTS.slice(0, 4), []);

  return (
    <ScrollScreen
      title="Employer Portal"
      subtitle="Cooperative Talent Acquisition & Matching"
      tab
      rightAction={
        <TouchableOpacity
          style={styles.postJobTopBtn}
          onPress={() => navigation.navigate('JobEditor')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={ICON.sm} color={COLORS.textInverse} />
          <Text style={styles.postJobTopBtnText}>Post Job</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Cooperative Organization Card */}
        <View style={styles.orgCard}>
          <View style={styles.orgHeader}>
            <View style={styles.orgLogoBox}>
              <Building size={ICON.md} color={COLORS.primary} />
            </View>
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>Amul Dairy Cooperative Union</Text>
              <Text style={styles.orgDistrict}>Anand District, Gujarat • Apex Federation</Text>
            </View>
          </View>
          <Badge label="Verified Cooperative Employer" variant="success" verified />
        </View>

        {/* KPI Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Briefcase size={ICON.md} color={COLORS.primary} />
            <Text style={styles.metricNumber}>{openJobs.length}</Text>
            <Text style={styles.metricLabel}>Open Vacancies</Text>
          </View>
          <View style={styles.metricCard}>
            <Users size={ICON.md} color={COLORS.primary} />
            <Text style={styles.metricNumber}>43</Text>
            <Text style={styles.metricLabel}>Total Applicants</Text>
          </View>
          <View style={styles.metricCard}>
            <Calendar size={ICON.md} color="#D97706" />
            <Text style={styles.metricNumber}>12</Text>
            <Text style={styles.metricLabel}>Interviews</Text>
          </View>
          <View style={styles.metricCard}>
            <Award size={ICON.md} color={COLORS.success} />
            <Text style={styles.metricNumber}>9</Text>
            <Text style={styles.metricLabel}>Trainees Hired</Text>
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('JobEditor')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: COLORS.primarySurface }]}>
              <Plus size={ICON.md} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Post New Vacancy</Text>
            <Text style={styles.quickActionDesc}>Reach NCCT trainees</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('TalentSearch')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIconBox, { backgroundColor: COLORS.successSurface }]}>
              <Search size={ICON.md} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionTitle}>Search Verified Talent</Text>
            <Text style={styles.quickActionDesc}>Filter by institute & skill</Text>
          </TouchableOpacity>
        </View>

        {/* Recruitment Funnel Progress */}
        <SectionHeader title="Recruitment Pipeline Funnel" />
        <View style={styles.card}>
          <View style={styles.funnelItem}>
            <View style={styles.funnelTextRow}>
              <Text style={styles.funnelStage}>Applications Received</Text>
              <Text style={styles.funnelCount}>43</Text>
            </View>
            <ProgressBar value={100} height={6} color={COLORS.primary} />
          </View>

          <View style={styles.funnelItem}>
            <View style={styles.funnelTextRow}>
              <Text style={styles.funnelStage}>Skill Match & Shortlisted (80%+)</Text>
              <Text style={styles.funnelCount}>28</Text>
            </View>
            <ProgressBar value={65} height={6} color={COLORS.primary} />
          </View>

          <View style={styles.funnelItem}>
            <View style={styles.funnelTextRow}>
              <Text style={styles.funnelStage}>Interview Stage</Text>
              <Text style={styles.funnelCount}>12</Text>
            </View>
            <ProgressBar value={30} height={6} color="#D97706" />
          </View>

          <View style={styles.funnelItem}>
            <View style={styles.funnelTextRow}>
              <Text style={styles.funnelStage}>Offers & Placements</Text>
              <Text style={styles.funnelCount}>9</Text>
            </View>
            <ProgressBar value={21} height={6} color={COLORS.success} />
          </View>
        </View>

        {/* Recent High-Match Applicants */}
        <SectionHeader
          title="Recent High-Match Applicants"
          actionLabel="View All"
          onAction={() =>
            navigation.navigate('JobApplicants', {
              jobId: openJobs[0]?.id || 'job-dairy-supervisor-anand',
            })
          }
        />
        <View style={styles.applicantsList}>
          {recentApplicants.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.applicantRow}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('CandidateDetail', {
                  traineeId: app.trainee_id,
                  jobId: app.job_id,
                })
              }
            >
              <View style={styles.applicantAvatarBox}>
                <Text style={styles.applicantAvatarText}>{app.avatar_initials}</Text>
              </View>
              <View style={styles.applicantRowInfo}>
                <View style={styles.applicantRowName}>
                  <Text style={styles.applicantName}>{app.name}</Text>
                  <Badge
                    label={`${app.match_score}% Match`}
                    variant={app.match_score >= 90 ? 'success' : 'primary'}
                  />
                </View>
                <Text style={styles.applicantRowOccupation}>{app.occupation}</Text>
                <Text style={styles.applicantRowInstitute}>{app.institute}</Text>
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
  postJobTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  postJobTopBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  orgCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  orgHeader: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  orgLogoBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  orgDistrict: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  metricCard: {
    ...CARD,
    flex: 1,
    minWidth: '45%',
    padding: SPACE.md,
    gap: 4,
  },
  metricNumber: {
    ...TEXT.title,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  metricLabel: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  quickActionCard: {
    ...CARD,
    flex: 1,
    padding: SPACE.md,
    gap: 4,
  },
  quickActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  quickActionDesc: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  funnelItem: {
    gap: 4,
  },
  funnelTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  funnelStage: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
  },
  funnelCount: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  seeAllText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  applicantsList: {
    ...CARD,
    padding: SPACE.sm,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  applicantAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantAvatarText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  applicantRowInfo: {
    flex: 1,
  },
  applicantRowName: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantName: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  applicantRowOccupation: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  applicantRowInstitute: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
