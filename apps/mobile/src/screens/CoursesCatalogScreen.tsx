import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  BookOpen,
  Search,
  Star,
  Users,
  Clock,
  PlayCircle,
  Sparkles,
} from 'lucide-react-native';
import { Course } from '../types';

export const CoursesCatalogScreen = ({ navigation }: any) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const loadCourses = async () => {
    setRefreshing(true);
    try {
      const res = await apiService.getCourses();
      setCourses(res.courses);
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Learning Catalog"
        subtitle="National Cooperative Curriculum"
        isLive={isLive}
      />

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, topics, or faculty..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCourses} colors={[COLORS.primary]} />}
      >
        {filtered.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CoursePlayer', { course })}
          >
            <View style={styles.courseTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.categoryRow}>
                  <Badge label={course.category} variant="primary" />
                  <Badge label={course.level} variant="neutral" />
                </View>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.instructorText}>Instructor: {course.instructor}</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{course.rating}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{course.duration_hours} hrs</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{course.enrolled} trainees</Text>
              </View>
            </View>

            <View style={styles.skillsRow}>
              {course.skills.map((s, idx) => (
                <Badge key={idx} label={s} variant="neutral" />
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.progressSubText}>
                {course.progress ? `${course.progress}% Completed` : 'Not Started'}
              </Text>
              <View style={styles.startBtnWrap}>
                <PlayCircle size={16} color={COLORS.primary} />
                <Text style={styles.startBtnText}>
                  {course.progress ? 'Continue' : 'Start Course'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  courseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  courseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  instructorText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    marginTop: 2,
  },
  progressSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  startBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
