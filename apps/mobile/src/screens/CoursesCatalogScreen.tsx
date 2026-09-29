import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, CARD, HIT, ICON, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { PillTabs } from '../components/PillTabs';
import { SearchField } from '../components/SearchField';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { CourseThumb } from '../components/CourseThumb';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { courseProgress, useLocalStore } from '../services/localStore';
import { plural } from '../services/utils';
import { Star, Bookmark } from 'lucide-react-native';
import { Course } from '../types';

type CourseFilter = 'all' | 'in_progress' | 'completed' | 'saved';

const FILTER_TABS: readonly { key: CourseFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'saved', label: 'Saved' },
];

export const CoursesCatalogScreen = ({ navigation, route }: any) => {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CourseFilter>('all');
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const { completed } = useLocalStore();

  const load = useCallback(async () => {
    try {
      const res = await apiService.getCourses();
      setCourses(res.courses);
      setIsLive(res.isLive);
    } catch {
      setCourses((prev) => prev ?? []);
      setIsLive(false);
    }
  }, []);

  useOnMount(load);

  // Deep link from the Career plan: open Learning pre-filtered to a course title.
  const incomingQuery: string | undefined = route?.params?.query;
  const [seenQuery, setSeenQuery] = useState<string | undefined>();
  if (incomingQuery && incomingQuery !== seenQuery) {
    setSeenQuery(incomingQuery);
    setSearch(incomingQuery);
    setFilter('all');
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleSaved = (id: string) => setSaved((prev) => ({ ...prev, [id]: !prev[id] }));

  const q = search.trim().toLowerCase();
  const items = (courses ?? [])
    .map((course) => ({ course, progress: courseProgress(course, completed) }))
    .filter(({ course, progress }) => {
      if (filter === 'in_progress' && !(progress > 0 && progress < 100)) return false;
      if (filter === 'completed' && progress < 100) return false;
      if (filter === 'saved' && !saved[course.id]) return false;
      return (
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q)
      );
    });

  return (
    <ScrollScreen
      tab
      title="Learning"
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
      sticky={
        <>
          <SearchField value={search} onChangeText={setSearch} placeholder="Search courses" />
          <PillTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />
        </>
      }
    >
      {courses === null ? <LoadingState /> : null}

      {courses !== null && items.length === 0 ? (
        <EmptyState
          title="No courses found"
          message={
            filter === 'saved' && !q
              ? 'Tap the bookmark on a course to save it.'
              : 'Try a different filter or search term.'
          }
        />
      ) : null}

      {items.map(({ course, progress }) => {
        const lessons = course.modules?.length;
        const isSaved = !!saved[course.id];
        const status = progress >= 100 ? 'Completed' : progress > 0 ? `${progress}%` : 'Not started';
        return (
          <TouchableOpacity
            key={course.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CoursePlayer', { course })}
            accessibilityRole="button"
            accessibilityLabel={`${course.title}, ${course.instructor}, ${status}`}
          >
            <CourseThumb category={course.category} />
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={2}>
                  {course.title}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleSaved(course.id)}
                  style={styles.saveBtn}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? `Remove ${course.title} from saved` : `Save ${course.title}`}
                  accessibilityState={{ selected: isSaved }}
                >
                  <Bookmark
                    size={ICON.md}
                    color={isSaved ? COLORS.primary : COLORS.textMuted}
                    fill={isSaved ? COLORS.primary : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.meta} numberOfLines={1}>
                {course.instructor}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {lessons ? `${plural(lessons, 'lesson')} · ` : ''}
                  {course.duration_hours} h
                </Text>
                {typeof course.rating === 'number' ? (
                  <View style={styles.ratingRow}>
                    <Star size={ICON.sm} color={COLORS.textMuted} />
                    <Text style={styles.meta}>{course.rating}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.progressRow}>
                <View style={styles.flex}>
                  <ProgressBar value={progress} />
                </View>
                <Text style={[styles.progressText, progress === 0 && styles.progressIdle]}>{status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    ...CARD,
    padding: SPACE.md - SPACE.xs,
    flexDirection: 'row',
    gap: SPACE.md - SPACE.xs,
  },
  body: { flex: 1, gap: SPACE.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  title: { flex: 1, ...TEXT.bodyStrong },
  // 44dp target that visually hugs the card corner
  saveBtn: {
    width: HIT,
    height: HIT,
    marginTop: -(SPACE.sm + SPACE.xs),
    marginRight: -(SPACE.sm + SPACE.xs),
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { ...TEXT.caption },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.xs },
  progressIdle: { color: COLORS.textMuted },
  progressText: { ...TEXT.captionStrong, color: COLORS.primary, minWidth: 72, textAlign: 'right' },
});
