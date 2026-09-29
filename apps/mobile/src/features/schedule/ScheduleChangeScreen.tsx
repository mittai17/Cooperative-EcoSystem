import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_TIMETABLE_SLOTS, TimetableSlotData } from './mockData';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Bell,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
} from 'lucide-react-native';

const TIME_SLOTS = [
  '09:00 - 10:30 AM',
  '11:00 AM - 12:30 PM',
  '02:00 - 03:30 PM',
  '04:00 - 05:30 PM',
];

const ROOMS = [
  'Lecture Hall 1 (Main Block)',
  'Lecture Hall 2 (Academic Annex)',
  'Computer Lab 2 (Terminal Block)',
  'Seminar Hall A (Guest Wing)',
  'Virtual Classroom (Online)',
];

const PRESET_REASONS = [
  'Trainer Medical Emergency',
  'Campus Electrical / Server Maintenance',
  'Guest Keynote Conflict',
  'Batch Field Study Immersion',
];

export const ScheduleChangeScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ScheduleChange'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slotId = route.params?.slotId || 'slot-103';
  const paramDate = route.params?.date || '2026-10-19';

  const slot: TimetableSlotData =
    MOCK_TIMETABLE_SLOTS.find((s) => s.id === slotId) || MOCK_TIMETABLE_SLOTS[2];

  const [changeType, setChangeType] = useState<'reschedule' | 'cancel'>('reschedule');
  const [newDate, setNewDate] = useState(paramDate);
  const [newTime, setNewTime] = useState(TIME_SLOTS[3]);
  const [newRoom, setNewRoom] = useState(ROOMS[2]);
  const [reason, setReason] = useState('Terminal Lab 1 server maintenance and operating system upgrade.');
  const [notifyTrainees, setNotifyTrainees] = useState(true);
  const [notifyDean, setNotifyDean] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for the schedule modification.');
      return;
    }

    setSubmitting(true);
    // Simulate brief network delay
    setTimeout(() => {
      setSubmitting(false);
      const actionTitle = changeType === 'reschedule' ? 'Timetable Rescheduled' : 'Session Cancelled';
      Alert.alert(
        actionTitle,
        changeType === 'reschedule'
          ? `Class "${slot.title}" successfully moved to ${newDate} at ${newTime} in ${newRoom}. Notifications dispatched to batch members.`
          : `Session "${slot.title}" has been cancelled for ${paramDate}. Trainees alerted via SMS and push notification.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 600);
  };

  return (
    <ScrollScreen
      title="Timetable Modification"
      onBack={() => navigation.goBack()}
      avoidKeyboard
    >
      {/* Current Slot Info Card */}
      <View style={styles.currentCard}>
        <View style={styles.currentHeader}>
          <Text style={styles.currentBadge}>CURRENT SCHEDULED SESSION</Text>
          <Badge label={slot.batch_name || 'Batch 1'} variant="primary" />
        </View>

        <Text style={styles.sessionTitle}>{slot.title}</Text>

        <View style={styles.metaRow}>
          <User size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.metaText}>Faculty: {slot.trainer}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailCol}>
            <Calendar size={ICON.sm} color={COLORS.textMuted} />
            <Text style={styles.detailText}>{slot.day}, {paramDate}</Text>
          </View>
          <View style={styles.detailCol}>
            <Clock size={ICON.sm} color={COLORS.textMuted} />
            <Text style={styles.detailText}>{slot.time}</Text>
          </View>
        </View>

        <View style={styles.roomRow}>
          <MapPin size={ICON.sm} color={COLORS.textMuted} />
          <Text style={styles.roomText}>{slot.room}</Text>
        </View>
      </View>

      {/* Action Type Toggle (Reschedule vs Cancel) */}
      <View style={styles.typeSelectorRow}>
        <TouchableOpacity
          style={[styles.typeBtn, changeType === 'reschedule' && styles.typeBtnActive]}
          onPress={() => setChangeType('reschedule')}
          activeOpacity={0.8}
        >
          <Clock
            size={ICON.md}
            color={changeType === 'reschedule' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.typeBtnText, changeType === 'reschedule' && styles.typeBtnTextActive]}>
            Reschedule to New Slot
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, changeType === 'cancel' && styles.typeBtnDangerActive]}
          onPress={() => setChangeType('cancel')}
          activeOpacity={0.8}
        >
          <AlertTriangle
            size={ICON.md}
            color={changeType === 'cancel' ? COLORS.danger : COLORS.textMuted}
          />
          <Text
            style={[styles.typeBtnText, changeType === 'cancel' && styles.typeBtnDangerTextActive]}
          >
            Cancel Session
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reschedule Parameters Section */}
      {changeType === 'reschedule' && (
        <View style={[styles.card, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>Select New Schedule & Venue</Text>

          <TextField
            label="New Date (YYYY-MM-DD) *"
            value={newDate}
            onChangeText={setNewDate}
            placeholder="2026-10-19"
          />

          {/* Time Slot Picker */}
          <Text style={styles.fieldLabel}>Select New Time Slot *</Text>
          <View style={styles.optionsWrap}>
            {TIME_SLOTS.map((t) => {
              const isSelected = newTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.optionPill, isSelected && styles.optionPillActive]}
                  onPress={() => setNewTime(t)}
                  activeOpacity={0.8}
                >
                  <Clock
                    size={ICON.sm}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Room Selector */}
          <Text style={styles.fieldLabel}>Select New Lecture Hall / Lab *</Text>
          <View style={styles.optionsCol}>
            {ROOMS.map((r) => {
              const isSelected = newRoom === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roomCard, isSelected && styles.roomCardActive]}
                  onPress={() => setNewRoom(r)}
                  activeOpacity={0.8}
                >
                  <MapPin
                    size={ICON.sm}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.roomCardText, isSelected && styles.roomCardTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Reason for Change Section */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Reason for Schedule Modification *</Text>

        {/* Preset Chips */}
        <View style={styles.chipsWrap}>
          {PRESET_REASONS.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              onPress={() => setReason(p)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextField
          label="Detailed Explanation (Displayed on Trainee Noticeboard) *"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
          style={styles.textArea}
          placeholder="State reason clearly for trainees and academic registrar..."
        />
      </View>

      {/* Broadcast Toggles */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Communication & Alerts</Text>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setNotifyTrainees(!notifyTrainees)}
          activeOpacity={0.8}
        >
          {notifyTrainees ? (
            <CheckSquare size={ICON.md} color={COLORS.primary} />
          ) : (
            <Square size={ICON.md} color={COLORS.textMuted} />
          )}
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Dispatch Push & SMS to All Enrolled Trainees</Text>
            <Text style={styles.toggleSub}>Instantly updates trainee timetable calendar.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setNotifyDean(!notifyDean)}
          activeOpacity={0.8}
        >
          {notifyDean ? (
            <CheckSquare size={ICON.md} color={COLORS.primary} />
          ) : (
            <Square size={ICON.md} color={COLORS.textMuted} />
          )}
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Notify Academic Dean & Department Head</Text>
            <Text style={styles.toggleSub}>Logs timetable exception in institutional audit trail.</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Submit Action */}
      <View style={styles.actionContainer}>
        <Button
          label={changeType === 'reschedule' ? 'Publish Reschedule Notice' : 'Confirm Class Cancellation'}
          onPress={handleSubmit}
          variant="primary"
          loading={submitting}
          icon={<CheckCircle size={ICON.sm} color={COLORS.textInverse} />}
        />
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  currentCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.xs,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentBadge: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  sessionTitle: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  metaText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: SPACE.md,
    paddingVertical: 2,
  },
  detailCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  typeBtnDangerActive: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerSurface,
  },
  typeBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  typeBtnTextActive: {
    color: COLORS.primary,
  },
  typeBtnDangerTextActive: {
    color: COLORS.danger,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
  },
  sectionTitle: {
    ...TEXT.section,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
  fieldLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  optionText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  optionTextActive: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  optionsCol: {
    gap: SPACE.xs,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
  },
  roomCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  roomCardText: {
    ...TEXT.caption,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  roomCardTextActive: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: SPACE.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    paddingVertical: 4,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    ...TEXT.bodyStrong,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  toggleSub: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actionContainer: {
    paddingTop: SPACE.sm,
  },
});
