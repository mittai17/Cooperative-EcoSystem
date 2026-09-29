import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, CARD, HIT, ICON, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react-native';
import { Course } from '../types';
import { localStore, useLocalStore } from '../services/localStore';
import { plural } from '../services/utils';
import { apiService } from '../services/api';

export const CoursePlayerScreen = ({ route, navigation }: any) => {
  const course: Course | undefined = route?.params?.course;
  const [activeIndex, setActiveIndex] = useState(0);
  const { completed } = useLocalStore();
  const [saveError, setSaveError] = useState('');

  if (!course) {
    return (
      <ScrollScreen title="Course" onBack={() => navigation.goBack()}>
        <EmptyState title="Course not found" message="Open a course from the Learning tab." />
      </ScrollScreen>
    );
  }

  const modules = course.modules ?? [];
  const isDone = (id: string, flag: boolean) => completed[course.id]?.[id] ?? flag;
  const doneCount = modules.filter((m) => isDone(m.id, m.completed)).length;
  const percent = modules.length ? Math.round((doneCount / modules.length) * 100) : 0;
  const current = modules[Math.min(activeIndex, modules.length - 1)];
  const currentDone = current ? isDone(current.id, current.completed) : false;
  const isLast = activeIndex >= modules.length - 1;

  // Optimistic toggle; updates local store immediately and syncs with server.
  const toggleModule = async (moduleId: string, next: boolean) => {
    setSaveError('');
    localStore.setModuleDone(course.id, moduleId, next);
    try {
      await apiService.setModuleProgress(course.id, moduleId, next);
    } catch {
      // Keep optimistic save in localStore
    }
  };

  return (
    <ScrollScreen title="Course" subtitle={course.category} onBack={() => navigation.goBack()}>
      <View style={styles.courseBlock}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.caption}>
          {course.instructor} · {course.duration_hours} h
        </Text>
        {course.skills && course.skills.length > 0 ? (
          <View style={styles.tags}>
            {course.skills.map((s) => (
              <Badge key={s} label={s} />
            ))}
          </View>
        ) : null}
      </View>

      {modules.length === 0 ? (
        <EmptyState title="No lessons yet" message="This course has no published lessons." />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.caption}>
              Lesson {activeIndex + 1} of {modules.length}
            </Text>
            <Text style={styles.lessonTitle}>{current.title}</Text>
            <View style={styles.durationRow}>
              <Clock size={ICON.sm} color={COLORS.textMuted} />
              <Text style={styles.caption}>{current.duration}</Text>
            </View>
            {current.summary ? <Text style={styles.body}>{current.summary}</Text> : null}
            {saveError ? (
              <Text style={styles.error} accessibilityRole="alert">
                {saveError}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button
                  label={currentDone ? 'Completed' : 'Mark complete'}
                  variant={currentDone ? 'secondary' : 'primary'}
                  icon={
                    <CheckCircle2 size={ICON.md} color={currentDone ? COLORS.primary : COLORS.textInverse} />
                  }
                  onPress={() => toggleModule(current.id, !currentDone)}
                />
              </View>
              {!isLast ? (
                <Button
                  label="Next"
                  variant="secondary"
                  onPress={() => setActiveIndex(activeIndex + 1)}
                  accessibilityLabel="Next lesson"
                />
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.bodyStrong}>Progress</Text>
              <Text style={styles.percent}>{percent}%</Text>
            </View>
            <ProgressBar value={percent} />
            <Text style={styles.caption}>
              {doneCount} of {plural(modules.length, 'lesson')} completed
            </Text>
          </View>

          <View>
            <SectionHeader title={`Lessons (${modules.length})`} />
            <View style={styles.list}>
              {modules.map((item, index) => {
                const done = isDone(item.id, item.completed);
                const active = index === activeIndex;
                return (
                  <View key={item.id} style={[styles.row, active && styles.rowActive]}>
                    <TouchableOpacity
                      style={styles.checkBtn}
                      onPress={() => toggleModule(item.id, !done)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: done }}
                      accessibilityLabel={`Mark lesson ${index + 1} ${done ? 'incomplete' : 'complete'}`}
                    >
                      {done ? (
                        <CheckCircle2 size={ICON.md} color={COLORS.success} />
                      ) : (
                        <Circle size={ICON.md} color={COLORS.textMuted} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rowMain}
                      onPress={() => setActiveIndex(index)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Open lesson ${item.title}, ${item.duration}`}
                    >
                      <View style={styles.flex}>
                        <Text style={[styles.bodyStrong, active && styles.activeTitle]}>{item.title}</Text>
                        <Text style={styles.caption}>{item.duration}</Text>
                      </View>
                      <ChevronRight size={ICON.md} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  courseBlock: { gap: SPACE.xs },
  courseTitle: { ...TEXT.title },
  caption: { ...TEXT.caption },
  body: { ...TEXT.body },
  error: { ...TEXT.caption, color: COLORS.danger },
  bodyStrong: { ...TEXT.bodyStrong },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, marginTop: SPACE.xs },
  card: { ...CARD, padding: SPACE.md, gap: SPACE.sm },
  lessonTitle: { ...TEXT.section },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  actions: { flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percent: { ...TEXT.bodyStrong, color: COLORS.primary },
  list: { gap: SPACE.sm },
  row: { ...CARD, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  rowActive: { borderColor: COLORS.primary },
  checkBtn: {
    width: HIT,
    minHeight: HIT + SPACE.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
    minHeight: HIT + SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingRight: SPACE.md - SPACE.xs,
  },
  activeTitle: { color: COLORS.primary },
});
