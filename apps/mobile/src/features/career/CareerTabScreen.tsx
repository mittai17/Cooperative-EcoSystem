import React from 'react';
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
  CAREER_JOBS_CATALOG,
  CURRENT_TRAINEE_PASSPORT,
  MY_APPLICATIONS_LIST,
} from './careerData';
import {
  Sparkles,
  Award,
  Briefcase,
  FileCheck,
  ChevronRight,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react-native';

export const CareerTabScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const passport = CURRENT_TRAINEE_PASSPORT;
  const recommendedJobs = CAREER_JOBS_CATALOG;
  const activeApplications = MY_APPLICATIONS_LIST;

  return (
    <ScrollScreen
      title="Career & Development"
      subtitle="AI career matching, verified passport, and applications"
      tab
      rightAction={
        <TouchableOpacity
          style={styles.passportChipBtn}
          onPress={() => navigation.navigate('Passport')}
        >
          <Award size={ICON.sm} color={COLORS.textInverse} />
          <Text style={styles.passportChipBtnText}>Skill Passport</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Dynamic Passport Snapshot Card */}
        <TouchableOpacity
          style={styles.passportBannerCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Passport')}
        >
          <View style={styles.passportBannerTop}>
            <View style={styles.passportIconWrap}>
              <Award size={ICON.lg} color={COLORS.primary} />
            </View>
            <View style={styles.passportBannerInfo}>
              <View style={styles.verifiedRow}>
                <Text style={styles.passportBannerTitle}>NCCT Skill Passport</Text>
                <CheckCircle2 size={15} color={COLORS.success} />
              </View>
              <Text style={styles.passportBannerId}>ID: {passport.traineeId}</Text>
              <Text style={styles.passportBannerMeta}>
                {passport.credentials.length} Verified Competencies • {passport.overallAttendancePercentage}% Attendance
              </Text>
            </View>
            <ChevronRight size={ICON.md} color={COLORS.primary} />
          </View>

          <View style={styles.passportBannerFooter}>
            <Text style={styles.passportFooterText}>
              Tamper-evident HMAC seal valid for direct cooperative employer recruitment.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick Hub Navigation Cards */}
        <View style={styles.hubGrid}>
          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('MyApplications')}
            activeOpacity={0.8}
          >
            <View style={[styles.hubIconBox, { backgroundColor: COLORS.primarySurface }]}>
              <Briefcase size={ICON.md} color={COLORS.primary} />
            </View>
            <Text style={styles.hubTitle}>My Applications</Text>
            <Text style={styles.hubDesc}>{activeApplications.length} active applications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hubCard}
            onPress={() => navigation.navigate('Passport')}
            activeOpacity={0.8}
          >
            <View style={[styles.hubIconBox, { backgroundColor: COLORS.successSurface }]}>
              <FileCheck size={ICON.md} color={COLORS.success} />
            </View>
            <Text style={styles.hubTitle}>Digital Passport</Text>
            <Text style={styles.hubDesc}>QR share & PDF export</Text>
          </TouchableOpacity>
        </View>

        {/* Applications Status Quick Tracker */}
        <SectionHeader
          title="Active Job Applications"
          actionLabel="View All"
          onAction={() => navigation.navigate('MyApplications')}
        />
        <View style={styles.applicationsList}>
          {activeApplications.slice(0, 2).map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.appRow}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MyApplications')}
            >
              <View style={styles.appRowLeft}>
                <Text style={styles.appJobTitle}>{app.jobTitle}</Text>
                <Text style={styles.appEmployer}>{app.employer}</Text>
              </View>
              <Badge
                label={app.status.replace('_', ' ').toUpperCase()}
                variant={
                  app.status === 'offer_received'
                    ? 'success'
                    : app.status === 'shortlisted' || app.status === 'interview_scheduled'
                    ? 'primary'
                    : 'neutral'
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended Cooperative Jobs */}
        <SectionHeader title="High-Match Cooperative Openings" />
        <View style={styles.jobsList}>
          {recommendedJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            >
              <View style={styles.jobCardHeader}>
                <View style={styles.jobCardTitleWrap}>
                  <Text style={styles.jobCardTitle}>{job.title}</Text>
                  <Text style={styles.jobCardEmployer}>{job.employer}</Text>
                </View>
                <Badge
                  label={`${job.matchScore}% Match`}
                  variant={job.matchScore >= 90 ? 'success' : 'primary'}
                />
              </View>

              <View style={styles.jobMetaRow}>
                <View style={styles.jobMetaItem}>
                  <MapPin size={12} color={COLORS.textMuted} />
                  <Text style={styles.jobMetaText}>{job.location}</Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Briefcase size={12} color={COLORS.textMuted} />
                  <Text style={styles.jobMetaText}>{job.sector}</Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Clock size={12} color={COLORS.textMuted} />
                  <Text style={styles.jobMetaText}>{job.salary}</Text>
                </View>
              </View>

              {/* Skills matched pill tags */}
              <View style={styles.skillsPreviewRow}>
                {job.matchedSkills.slice(0, 3).map((item) => (
                  <View key={item.skill} style={styles.skillMatchPill}>
                    <CheckCircle2 size={10} color={COLORS.success} />
                    <Text style={styles.skillMatchPillText}>{item.skill}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.jobCardFooter}>
                <Text style={styles.viewJobActionText}>View Details & Apply</Text>
                <ChevronRight size={ICON.sm} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  passportChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  passportChipBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  passportBannerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primaryBorder,
  },
  passportBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  passportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passportBannerInfo: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passportBannerTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  passportBannerId: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  passportBannerMeta: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  passportBannerFooter: {
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryBorder,
    marginTop: 4,
  },
  passportFooterText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  hubGrid: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  hubCard: {
    ...CARD,
    flex: 1,
    padding: SPACE.md,
    gap: 4,
  },
  hubIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hubTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  hubDesc: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  applicationsList: {
    ...CARD,
    padding: SPACE.sm,
    gap: SPACE.xs,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  appRowLeft: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  appJobTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  appEmployer: {
    ...TEXT.caption,
    color: COLORS.primary,
    fontSize: 11,
  },
  jobsList: {
    gap: SPACE.md,
  },
  jobCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobCardTitleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  jobCardTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  jobCardEmployer: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  skillsPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  skillMatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: SPACE.xs + 3,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.badgeBorder,
  },
  skillMatchPillText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  viewJobActionText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
});
