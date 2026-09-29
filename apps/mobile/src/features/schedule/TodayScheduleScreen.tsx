import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_TIMETABLE_SLOTS } from './mockData';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  CalendarDays,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';

export const TodayScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const todaySlots = MOCK_TIMETABLE_SLOTS.slice(0, 3);

  return (
    <ScrollScreen
      tab
      title="Today's Teaching Schedule"
      subtitle="Trainer daily classes, lecture halls, and session management."
    >
      {/* Date & Batch Overview */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.dateRow}>
            <CalendarDays size={ICON.md} color={COLORS.primary} />
            <Text style={styles.dateText}>Monday, 19 October 2026</Text>
          </View>
          <Badge label="3 Classes Today" variant="primary" />
        </View>
        <Text style={styles.batchInfo}>Batch 1 - Cooperative Management & Governance</Text>
      </View>

      {/* Class Slots */}
      <View style={styles.slotsList}>
        {todaySlots.map((slot, index) => {
          const isFirst = index === 0;
          return (
            <View key={slot.id} style={[styles.slotCard, isFirst && styles.slotCardActive]}>
              <View style={styles.slotHeader}>
                <View style={styles.timeWrap}>
                  <Clock size={ICON.sm} color={isFirst ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.timeText, isFirst && styles.timeTextActive]}>
                    {slot.time}
                  </Text>
                </View>
                {isFirst ? (
                  <Badge label="Next Up" variant="primary" />
                ) : slot.status === 'rescheduled' ? (
                  <Badge label="Rescheduled" variant="neutral" />
                ) : null}
              </View>

              <Text style={styles.slotTitle}>{slot.title}</Text>

              <View style={styles.metaRow}>
                <View style={styles.roomCol}>
                  <MapPin size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.roomText}>{slot.room}</Text>
                </View>
                <View style={styles.traineesCol}>
                  <Users size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.traineesText}>38 Trainees Enrolled</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <View style={styles.startBtnWrap}>
                  <Button
                    label="Start Session Console"
                    onPress={() => navigation.navigate('StartSession', { slotId: slot.id })}
                    variant={isFirst ? 'primary' : 'secondary'}
                    icon={<Play size={ICON.sm} color={isFirst ? COLORS.textInverse : COLORS.primary} />}
                  />
                </View>
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() =>
                    navigation.navigate('ScheduleChange', {
                      slotId: slot.id,
                      date: '2026-10-19',
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.rescheduleText}>Reschedule / Exception</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  dateText: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  batchInfo: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  slotsList: {
    gap: SPACE.md,
  },
  slotCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    gap: SPACE.sm,
  },
  slotCardActive: {
    borderColor: COLORS.primaryBorder,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
  timeTextActive: {
    color: COLORS.primary,
  },
  slotTitle: {
    ...TEXT.bodyStrong,
    fontSize: 15,
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.xs + 2,
  },
  roomCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  traineesCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  traineesText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  actionsRow: {
    gap: SPACE.xs,
    paddingTop: 4,
  },
  startBtnWrap: {
    width: '100%',
  },
  rescheduleBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  rescheduleText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
});
