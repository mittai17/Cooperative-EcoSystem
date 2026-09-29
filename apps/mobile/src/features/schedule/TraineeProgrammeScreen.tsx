import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import {
  MOCK_TIMETABLE_SLOTS,
  MOCK_TRAINEE_HOSTEL,
  MOCK_LOGISTICS_CHECKLIST,
} from './mockData';
import {
  Calendar,
  Clock,
  MapPin,
  Home,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  Building,
} from 'lucide-react-native';

export const TraineeProgrammeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const pendingLogistics = MOCK_LOGISTICS_CHECKLIST.filter((i) => !i.completed).length;

  return (
    <ScrollScreen
      tab
      title="Programme & Stay"
      subtitle="Your active batch timetable, residential stay, and onboarding logistics."
    >
      {/* Active Programme Banner */}
      <View style={styles.programmeBanner}>
        <View style={styles.progBadgeRow}>
          <Badge label="Enrolled Batch 1" variant="success" verified />
          <Badge label="On-Campus Residential" variant="neutral" />
        </View>
        <Text style={styles.progTitle}>Cooperative Management & Governance Excellence</Text>
        <View style={styles.institutionRow}>
          <Building size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.institutionText}>VAMNICOM Pune · Oct 15 - Nov 12, 2026</Text>
        </View>
      </View>

      {/* Quick Access Grid (Hostel, Logistics, Timetable) */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('HostelWaitlist')}
          activeOpacity={0.8}
        >
          <Home size={ICON.md} color={COLORS.primary} />
          <Text style={styles.quickTitle}>Hostel Room</Text>
          <Text style={styles.quickSub}>Room B-204 (Block B)</Text>
          <View style={styles.quickFooter}>
            <Text style={styles.quickLink}>View Details</Text>
            <ChevronRight size={ICON.sm} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('LogisticsChecklist')}
          activeOpacity={0.8}
        >
          <ClipboardList size={ICON.md} color={COLORS.primary} />
          <Text style={styles.quickTitle}>Onboarding</Text>
          <Text style={styles.quickSub}>
            {pendingLogistics > 0 ? `${pendingLogistics} pending tasks` : 'All cleared'}
          </Text>
          <View style={styles.quickFooter}>
            <Text style={styles.quickLink}>Checklist</Text>
            <ChevronRight size={ICON.sm} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Today's Timetable Section */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Weekly Class Timetable</Text>
            <Text style={styles.sectionSub}>Lecture halls and laboratory sessions</Text>
          </View>
          <Calendar size={ICON.md} color={COLORS.primary} />
        </View>

        {MOCK_TIMETABLE_SLOTS.slice(0, 3).map((slot) => {
          const isRescheduled = slot.status === 'rescheduled';
          return (
            <View
              key={slot.id}
              style={[styles.slotItem, isRescheduled && styles.slotItemRescheduled]}
            >
              <View style={styles.slotTopRow}>
                <View style={styles.slotTimeCol}>
                  <Clock size={ICON.sm} color={COLORS.primary} />
                  <Text style={styles.slotTimeText}>{slot.time}</Text>
                </View>
                {isRescheduled ? (
                  <Badge label="Rescheduled" variant="primary" />
                ) : (
                  <Text style={styles.slotDayText}>{slot.day}</Text>
                )}
              </View>

              <Text style={styles.slotTitle}>{slot.title}</Text>

              <View style={styles.slotBottomRow}>
                <View style={styles.slotRoomRow}>
                  <MapPin size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.slotRoomText}>{slot.room}</Text>
                </View>
                <Text style={styles.slotTrainerText}>{slot.trainer}</Text>
              </View>

              {isRescheduled && slot.rescheduled_reason && (
                <View style={styles.noticeBox}>
                  <AlertCircle size={ICON.sm} color={COLORS.primary} />
                  <Text style={styles.noticeText}>
                    Notice: Shifted to {slot.rescheduled_time} ({slot.rescheduled_reason})
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Hostel & Campus Services */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Hostel & Dining Assistance</Text>
        <Text style={styles.sectionSub}>Warden desk, dining hall timings, and room amenities</Text>

        <View style={styles.hostelSummaryBox}>
          <View style={styles.hostelSummaryItem}>
            <Text style={styles.hostelSummaryLabel}>Allocated Room</Text>
            <Text style={styles.hostelSummaryVal}>{MOCK_TRAINEE_HOSTEL.room_number}</Text>
          </View>
          <View style={styles.hostelSummaryItem}>
            <Text style={styles.hostelSummaryLabel}>Room Type</Text>
            <Text style={styles.hostelSummaryVal}>{MOCK_TRAINEE_HOSTEL.room_type}</Text>
          </View>
          <View style={styles.hostelSummaryItem}>
            <Text style={styles.hostelSummaryLabel}>Gate Curfew</Text>
            <Text style={styles.hostelSummaryVal}>10:00 PM</Text>
          </View>
        </View>

        <Button
          label="Accommodation Request & Preferences"
          onPress={() => navigation.navigate('HostelRequest')}
          variant="secondary"
        />
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  programmeBanner: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.xs,
  },
  progBadgeRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  progTitle: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    lineHeight: 22,
    marginTop: 2,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  institutionText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  quickCard: {
    flex: 1,
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    gap: 4,
  },
  quickTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  quickSub: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  quickFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  quickLink: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TEXT.section,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
  sectionSub: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  slotItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    gap: SPACE.xs,
    backgroundColor: COLORS.surface,
  },
  slotItemRescheduled: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTimeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotTimeText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  slotDayText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  slotTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  slotBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotRoomText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  slotTrainerText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryBorder,
  },
  noticeText: {
    ...TEXT.caption,
    color: COLORS.primary,
    fontSize: 10,
  },
  hostelSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.md,
  },
  hostelSummaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  hostelSummaryLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  hostelSummaryVal: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
    fontSize: 12,
  },
});
