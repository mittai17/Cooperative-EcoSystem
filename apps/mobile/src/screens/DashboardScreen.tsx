import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { apiService } from '../services/api';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import {
  BookOpen,
  CalendarCheck2,
  Award,
  Briefcase,
  PlayCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  QrCode,
  Download,
} from 'lucide-react-native';
import { Course, JobMatch } from '../types';

export const DashboardScreen = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [trainee, setTrainee] = useState(apiService.getTraineeProfile());

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [coursesRes, jobsRes, traineeRes] = await Promise.all([
        apiService.getCourses(),
        apiService.getJobs(),
        apiService.getTraineeProfileLive(),
      ]);
      setCourses(coursesRes.courses);
      setJobs(jobsRes.jobs);
      setTrainee(traineeRes.trainee);
      setIsLive(coursesRes.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const continueCourse = courses.find((c) => (c.progress || 0) > 0 && (c.progress || 0) < 100) || courses[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="CoopSetu AI"
        subtitle="National Cooperative Skilling"
        isLive={isLive}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[COLORS.primary]} />}
      >
        {/* Welcome Greeting Banner */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{trainee.avatar_initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingName}>Namaste, {trainee.name} 👋</Text>
              <Text style={styles.greetingSub}>{trainee.programme}</Text>
              <Text style={styles.institutionName}>{trainee.enrolled_institution}</Text>
            </View>
          </View>

          {/* Quick Actions Row */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('QRScan')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <QrCode size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionLabel}>QR Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('CareerAI')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: '#FDF2F8' }]}>
                <Sparkles size={18} color="#BE185D" />
              </View>
              <Text style={styles.quickActionLabel}>Career AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Offline')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Download size={18} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionLabel}>Offline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Metrics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <CalendarCheck2 size={16} color={COLORS.primary} />
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <Text style={styles.statValue}>{trainee.attendance_percentage}%</Text>
            <Text style={styles.statSub}>Compliant (Min 75%)</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <Award size={16} color={COLORS.success} />
              <Text style={styles.statLabel}>Skill Strength</Text>
            </View>
            <Text style={styles.statValue}>72%</Text>
            <Text style={styles.statSub}>{trainee.skills_verified_count} Verified Skills</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.statIconRow}>
              <TrendingUp size={16} color="#7C3AED" />
              <Text style={styles.statLabel}>Learning</Text>
            </View>
            <Text style={styles.statValue}>{trainee.hours_completed}h</Text>
            <Text style={styles.statSub}>4 modules left</Text>
          </View>
        </View>

        {/* Continue Learning Section */}
        {continueCourse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CoursesTab')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('CoursePlayer', { course: continueCourse })}
            >
              <View style={styles.continueCardTop}>
                <View style={styles.playIconContainer}>
                  <PlayCircle size={32} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Badge label={continueCourse.category} variant="primary" />
                  <Text style={styles.continueTitle} numberOfLines={2}>
                    {continueCourse.title}
                  </Text>
                  <Text style={styles.continueInstructor}>Instructor: {continueCourse.instructor}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${continueCourse.progress || 25}%` }]} />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>{continueCourse.progress || 25}% Completed</Text>
                  <Text style={styles.resumeAction}>Resume Lesson ›</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Top Cooperative Job Opportunities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Briefcase size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>High-Match Cooperative Vacancies</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('JobsTab')}>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>

          {jobs.slice(0, 2).map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('JobsTab')}
            >
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobEmployer}>{job.employer}</Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchPercent}>{job.match_percentage || 85}%</Text>
                  <Text style={styles.matchSub}>Match</Text>
                </View>
              </View>

              <View style={styles.jobMetaRow}>
                <Text style={styles.jobMetaText}>📍 {job.location}</Text>
                <Text style={styles.jobMetaText}>💰 {job.salary}</Text>
              </View>

              <View style={styles.jobFooter}>
                <View style={styles.jobTagsRow}>
                  {job.skills_required.slice(0, 2).map((skill, i) => (
                    <Badge key={i} label={skill} variant="neutral" />
                  ))}
                </View>
                <View style={styles.applyBtnTextWrap}>
                  <Text style={styles.applyBtnText}>View Details</Text>
                  <ArrowRight size={14} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Skill Passport Summary Banner */}
        <TouchableOpacity
          style={styles.passportPromoBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PassportTab')}
        >
          <View style={{ flex: 1 }}>
            <Badge label="VERIFIED CREDENTIALS" variant="success" verified />
            <Text style={styles.promoTitle}>Cooperative Skill Passport</Text>
            <Text style={styles.promoDesc}>
              Tamper-evident blockchain-ready skilling passport accepted across 8.5 lakh PACS & Cooperatives.
            </Text>
          </View>
          <ArrowRight size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
  },
  greetingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  greetingName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  greetingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  institutionName: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  sectionLink: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  continueCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  continueCardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  playIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  continueInstructor: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    gap: 6,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  resumeAction: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  jobEmployer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  matchBadge: {
    backgroundColor: COLORS.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  matchPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  matchSub: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.success,
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  jobMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  jobTagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  applyBtnTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  passportPromoBanner: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  promoDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
