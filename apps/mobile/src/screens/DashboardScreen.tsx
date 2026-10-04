import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, ICON, CARD, SPACE, TEXT } from '../constants/theme';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { courseProgress, useLocalStore } from '../services/localStore';
import { ScrollScreen } from '../components/ScrollScreen';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { IconChip } from '../components/IconChip';
import { ProgressBar } from '../components/ProgressBar';
import { CourseThumb } from '../components/CourseThumb';
import {
  QrCode,
  Award,
  GraduationCap,
  Download,
  MapPin,
  ChevronRight,
  BookOpen,
  Briefcase,
  TrendingUp,
} from 'lucide-react-native';
import { Course, JobMatch } from '../types';
import { useAuthContext } from '../navigation/AuthContext';

const greetingForHour = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const QUICK_ACTIONS = [
  { label: 'QR attendance', Icon: QrCode, route: 'QRScan' },
  { label: 'Skill passport', Icon: Award, route: 'Passport' },
  { label: 'Certificates', Icon: GraduationCap, route: 'Certificates' },
  { label: 'Offline', Icon: Download, route: 'Offline' },
] as const;

interface DashboardData {
  courses: Course[];
  jobs: JobMatch[];
  skillStrength: number | null;
  verifiedSkills: number | null;
  attendance: number | null;
  isLive: boolean;
}

export const DashboardScreen = ({ navigation }: any) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { completed } = useLocalStore();
  const { user } = useAuthContext();

  const load = useCallback(async () => {
    try {
      const [coursesRes, jobsRes, passportRes, attendanceRes] = await Promise.all([
        apiService.getCourses(),
        apiService.getJobs(),
        apiService.getSkillPassport(),
        apiService.getAttendanceRecords(),
      ]);
      const summary = passportRes.passport.summary;
      setData({
        courses: coursesRes.courses,
        jobs: jobsRes.jobs,
        skillStrength: passportRes.isLive && summary ? Math.round(summary.avg_confidence) : null,
        verifiedSkills: passportRes.isLive && summary ? summary.verified_count : null,
        attendance: attendanceRes.percentage === null ? null : Math.round(attendanceRes.percentage),
        isLive:
          coursesRes.isLive &&
          jobsRes.isLive &&
          passportRes.isLive &&
          attendanceRes.isLive,
      });
    } catch {
      setData((prev) => (prev ? { ...prev, isLive: false } : prev));
    }
  }, []);

  useOnMount(load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!data) {
    return (
      <ScrollScreen tab brand title="NURVEX">
        <LoadingState />
      </ScrollScreen>
    );
  }

  const { courses, jobs } = data;
  const trainee = user?.trainee ?? null;
  const withProgress = courses.map((c) => ({ course: c, progress: courseProgress(c, completed) }));
  const continueItem =
    withProgress.find((c) => c.progress > 0 && c.progress < 100) ??
    withProgress.find((c) => c.progress < 100);
  const firstName = ((trainee?.name || user?.fullName || user?.email || '').split(/[\s@]/)[0]) ?? '';

  const stats = [
    { label: 'Active courses', value: `${courses.length}`, Icon: BookOpen, tint: COLORS.primarySurface },
    { label: 'Attendance', value: data.attendance === null ? '-' : `${data.attendance}%` },
    { label: 'Skill strength', value: data.skillStrength === null ? '-' : `${data.skillStrength}%` },
    { label: 'Verified skills', value: data.verifiedSkills === null ? '-' : `${data.verifiedSkills}` },
    { label: 'Job matches', value: `${jobs.length}`, Icon: Briefcase, tint: COLORS.primarySurface },
  ];

  const continueCourse = continueItem?.course;
  const continueProgress = continueItem?.progress ?? 0;
  const modulesDone = continueCourse?.modules
    ? continueCourse.modules.filter((m) => completed[continueCourse.id]?.[m.id] ?? m.completed).length
    : 0;

  return (
    <ScrollScreen
      tab
      brand
      title="NURVEX"
      isLive={data.isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <View style={styles.greetingBlock}>
        <Text style={styles.greetingName}>
          {greetingForHour(new Date().getHours())}{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.greetingSub} numberOfLines={1}>
          {trainee?.enrolled_institution ?? user?.organisation?.name ?? ''}
        </Text>
        <Text style={styles.greetingCopy}>
          Continue learning, build your skills, and grow your cooperative future with NURVEX.
        </Text>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statBox} accessible accessibilityLabel={`${s.label}: ${s.value}`}>
            {'Icon' in s && s.Icon ? (
              <View style={[styles.statIcon, { backgroundColor: s.tint }]}>
                {React.createElement(s.Icon, { size: ICON.sm, color: COLORS.primary })}
              </View>
            ) : null}
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map(({ label, Icon, route }) => (
          <TouchableOpacity
            key={route}
            style={styles.quickBtn}
            onPress={() => navigation.navigate(route)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <IconChip>
              <Icon size={ICON.md} color={COLORS.primary} />
            </IconChip>
            <Text style={styles.quickLabel} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {continueCourse ? (
        <View>
          <SectionHeader
            title={continueProgress > 0 ? 'Continue learning' : 'Start learning'}
            actionLabel="View all"
            onAction={() => navigation.navigate('CoursesTab')}
          />
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CoursePlayer', { course: continueCourse })}
            accessibilityRole="button"
            accessibilityLabel={`Open course ${continueCourse.title}, ${continueProgress}% complete`}
          >
            <CourseThumb category={continueCourse.category} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {continueCourse.title}
              </Text>
              {continueCourse.modules && continueCourse.modules.length > 0 ? (
                <Text style={styles.cardMeta}>
                  {modulesDone} of {continueCourse.modules.length} lessons
                </Text>
              ) : (
                <Text style={styles.cardMeta}>{continueCourse.instructor}</Text>
              )}
              <View style={styles.progressRow}>
                <View style={styles.flex}>
                  <ProgressBar value={continueProgress} />
                </View>
                <Text style={styles.progressText}>{continueProgress}%</Text>
              </View>
            </View>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View>
        <SectionHeader
          title="My learning progress"
          actionLabel="View details"
          onAction={() => navigation.navigate('LearnTab')}
        />
        <View style={styles.progressPanel}>
          <View style={styles.progressPanelHeader}>
            <View style={styles.progressIcon}>
              <TrendingUp size={ICON.md} color={COLORS.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Your active learning pathway</Text>
              <Text style={styles.cardMeta}>{withProgress.length} courses in your NURVEX workspace</Text>
            </View>
          </View>
          {withProgress.slice(0, 3).map(({ course, progress }) => (
            <View key={course.id} style={styles.courseProgressRow}>
              <View style={styles.courseProgressLabelRow}>
                <Text style={styles.cardMeta} numberOfLines={1}>{course.title}</Text>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
              <ProgressBar value={progress} />
            </View>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader
          title="Career opportunities"
          actionLabel="See all"
          onAction={() => navigation.navigate('CareerTab')}
        />
        {jobs.length === 0 ? (
          <EmptyState title="No jobs available" message="Pull down to refresh." />
        ) : (
          <View style={styles.list}>
            {jobs.slice(0, 2).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CareerTab')}
                accessibilityRole="button"
                accessibilityLabel={`${job.title}, ${job.employer}. Open jobs.`}
              >
                <View style={styles.jobHeader}>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {job.title}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={2}>
                      {job.employer}
                    </Text>
                  </View>
                  {job.match_percentage !== undefined ? (
                    <Text style={styles.matchPercent}>{job.match_percentage}% match</Text>
                  ) : null}
                </View>
                {job.location ? (
                  <View style={styles.metaRow}>
                    <MapPin size={ICON.sm} color={COLORS.textMuted} />
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {job.location}
                    </Text>
                  </View>
                ) : null}
                {job.skills_required.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {job.skills_required.slice(0, 2).map((skill) => (
                      <Badge key={skill} label={skill} />
                    ))}
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  greetingBlock: { gap: 2 },
  greetingName: { ...TEXT.title },
  greetingSub: { ...TEXT.caption },
  greetingCopy: { ...TEXT.body, color: COLORS.textSecondary, marginTop: SPACE.sm },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  statBox: {
    ...CARD,
    width: '31%',
    minWidth: 96,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.sm,
    alignItems: 'center',
    gap: SPACE.xs,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { ...TEXT.title },
  statLabel: { ...TEXT.caption },
  quickRow: {
    ...CARD,
    flexDirection: 'row',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.xs,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    minHeight: 44,
  },
  quickLabel: { ...TEXT.captionStrong, color: COLORS.textPrimary },
  list: { gap: SPACE.sm },
  card: {
    ...CARD,
    padding: SPACE.md - SPACE.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md - SPACE.xs,
  },
  cardBody: { flex: 1, gap: SPACE.xs },
  cardTitle: { ...TEXT.bodyStrong },
  cardMeta: { ...TEXT.caption },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  progressText: { ...TEXT.captionStrong, color: COLORS.primary },
  progressPanel: { ...CARD, padding: SPACE.md, gap: SPACE.md },
  progressPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  progressIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseProgressRow: { gap: SPACE.xs },
  courseProgressLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm },
  jobCard: { ...CARD, padding: SPACE.md, gap: SPACE.sm },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  matchPercent: { ...TEXT.bodyStrong, color: COLORS.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
});
