import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import {
  Play,
  Pause,
  CheckCircle,
  Circle,
  FileText,
  Download,
  Share2,
  Volume2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { Course, CourseModule } from '../types';
import { MOCK_COURSES } from '../services/mockData';

export const CoursePlayerScreen = ({ route, navigation }: any) => {
  const initialCourse: Course = route?.params?.course || MOCK_COURSES[0];
  const [course, setCourse] = useState<Course>(initialCourse);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [completedModules, setCompletedModules] = useState<{ [id: string]: boolean }>({
    m1: true,
    m2: true,
  });

  const modules: CourseModule[] = course.modules || [
    { id: 'm1', title: '1. Introduction to Cooperative Principles', duration: '18 min', completed: true },
    { id: 'm2', title: '2. Democratic Governance & Member Elections', duration: '24 min', completed: true },
    { id: 'm3', title: '3. Financial Accounting in Cooperatives', duration: '32 min', completed: false },
    { id: 'm4', title: '4. Cooperative Byelaws & Regulatory Compliance', duration: '22 min', completed: false },
  ];

  const currentModule = modules[activeModuleIndex] || modules[0];

  const handleToggleComplete = (moduleId: string) => {
    setCompletedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleNextLesson = () => {
    if (activeModuleIndex < modules.length - 1) {
      setActiveModuleIndex(activeModuleIndex + 1);
      setIsPlaying(true);
    } else {
      Alert.alert('Congratulations!', 'You have completed all modules in this course. Assessment is unlocked!');
    }
  };

  const completedCount = modules.filter((m) => completedModules[m.id]).length;
  const progressPercent = Math.round((completedCount / modules.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Course Player"
        subtitle={course.category}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Video Player Mockup Container */}
        <View style={styles.playerContainer}>
          <View style={styles.videoCanvas}>
            <View style={styles.videoOverlay}>
              <View style={styles.videoBadgeRow}>
                <Badge label="HD 1080p" variant="neutral" />
                <Badge label="Hindi / English Audio" variant="primary" />
              </View>

              <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.8}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={32} color="#FFFFFF" /> : <Play size={32} color="#FFFFFF" />}
              </TouchableOpacity>

              <View style={styles.videoControlsBottom}>
                <Text style={styles.videoTimeText}>08:45 / {currentModule.duration}</Text>
                <View style={styles.scrubberTrack}>
                  <View style={[styles.scrubberFill, { width: '45%' }]} />
                </View>
                <Volume2 size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Current Lesson Metadata */}
          <View style={styles.lessonMetaCard}>
            <Text style={styles.currentLessonTitle}>{currentModule.title}</Text>
            <Text style={styles.courseSubTitle}>Course: {course.title}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  completedModules[currentModule.id] && styles.completedButton,
                ]}
                onPress={() => handleToggleComplete(currentModule.id)}
              >
                <CheckCircle size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>
                  {completedModules[currentModule.id] ? 'Completed' : 'Mark as Complete'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.nextActionButton} onPress={handleNextLesson}>
                <Text style={styles.nextActionText}>Next Lesson ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Course Progress Summary */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Course Curriculum Progress</Text>
            <Text style={styles.progressValue}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressCountText}>
            {completedCount} of {modules.length} lessons completed
          </Text>
        </View>

        {/* Modules Accordion / List */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionHeaderTitle}>Curriculum Lessons ({modules.length})</Text>

          {modules.map((item, index) => {
            const isActive = index === activeModuleIndex;
            const isDone = completedModules[item.id];

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.moduleItem, isActive && styles.activeModuleItem]}
                onPress={() => {
                  setActiveModuleIndex(index);
                  setIsPlaying(true);
                }}
                activeOpacity={0.7}
              >
                <TouchableOpacity
                  style={styles.checkIconWrap}
                  onPress={() => handleToggleComplete(item.id)}
                >
                  {isDone ? (
                    <CheckCircle size={20} color={COLORS.success} />
                  ) : (
                    <Circle size={20} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.moduleTitle,
                      isActive && styles.activeModuleTitle,
                      isDone && styles.doneModuleTitle,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.summary && <Text style={styles.moduleSummary}>{item.summary}</Text>}
                </View>

                <View style={styles.moduleDurationBadge}>
                  <Clock size={12} color={COLORS.textMuted} />
                  <Text style={styles.moduleDurationText}>{item.duration}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Offline & Resources Bar */}
        <View style={styles.resourcesCard}>
          <View style={styles.resourceHeader}>
            <FileText size={18} color={COLORS.primary} />
            <Text style={styles.resourceTitle}>Course Handouts & Study Notes</Text>
          </View>
          <Text style={styles.resourceDesc}>
            Download official NCCT lecture notes (PDF, 4.2 MB) for offline study in remote areas.
          </Text>
          <TouchableOpacity
            style={styles.downloadNotesBtn}
            onPress={() => Alert.alert('Offline Pack', 'Lecture notes saved to Offline Storage.')}
          >
            <Download size={16} color={COLORS.primary} />
            <Text style={styles.downloadNotesText}>Download Handout (Offline PDF)</Text>
          </TouchableOpacity>
        </View>
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
    gap: 16,
  },
  playerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  videoCanvas: {
    height: 210,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoBadgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30, 58, 138, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoControlsBottom: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  scrubberTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
  },
  lessonMetaCard: {
    padding: 16,
    gap: 10,
  },
  currentLessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  courseSubTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  completedButton: {
    backgroundColor: COLORS.success,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  nextActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  modulesSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  moduleItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.sm,
  },
  activeModuleItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  checkIconWrap: {
    padding: 4,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activeModuleTitle: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  doneModuleTitle: {
    color: COLORS.textSecondary,
  },
  moduleSummary: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  moduleDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleDurationText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  resourcesCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  resourceDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  downloadNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySurface,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  downloadNotesText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
