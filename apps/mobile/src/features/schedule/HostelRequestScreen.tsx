import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import {
  Home,
  Calendar,
  Utensils,
  CheckCircle,
  CheckSquare,
  Square,
  HelpCircle,
  Building,
  UserCheck,
  ShieldAlert,
} from 'lucide-react-native';

type RoomType = 'Single' | 'Double Sharing' | 'Triple Sharing';
type DietaryType = 'Vegetarian' | 'Non-Vegetarian' | 'Jain';

export const HostelRequestScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [checkInDate, setCheckInDate] = useState('2026-10-14');
  const [checkOutDate, setCheckOutDate] = useState('2026-11-13');
  const [roomType, setRoomType] = useState<RoomType>('Double Sharing');
  const [dietary, setDietary] = useState<DietaryType>('Vegetarian');
  const [specialNotes, setSpecialNotes] = useState(
    'Ground floor room preferred if available. No special dietary allergies.'
  );
  const [emergencyContactName, setEmergencyContactName] = useState('Balasaheb Thorat (Society Chairman)');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98221 55667');
  const [rulesAccepted, setRulesAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!checkInDate.trim() || !checkOutDate.trim()) {
      Alert.alert('Dates Required', 'Please specify expected check-in and check-out dates.');
      return;
    }
    if (!rulesAccepted) {
      Alert.alert('Hostel Rules', 'Please accept the campus residential code of conduct.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Accommodation Request Received',
        `Your request for ${roomType} (${dietary} mess) has been registered. You can track your room allocation and waitlist status in real-time.`,
        [
          {
            text: 'View Allocation Status',
            onPress: () => navigation.navigate('HostelWaitlist'),
          },
        ]
      );
    }, 600);
  };

  return (
    <ScrollScreen
      title="Hostel Room Request"
      onBack={() => navigation.goBack()}
      avoidKeyboard
    >
      {/* Programme Context Header */}
      <View style={styles.topCard}>
        <View style={styles.topHeader}>
          <Text style={styles.topBadge}>ENROLLED TRAINING PROGRAMME</Text>
          <Badge label="Residential Required" variant="primary" />
        </View>
        <Text style={styles.progTitle}>Cooperative Management & Governance Excellence</Text>
        <Text style={styles.campusName}>VAMNICOM Pune Campus · Oct 15 to Nov 12, 2026</Text>
      </View>

      {/* Dates Selection Card */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Calendar size={ICON.md} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Stay Duration (Check-in & Check-out)</Text>
        </View>
        <Text style={styles.hintText}>
          Trainees may check in 24 hours prior to the programme commencement date.
        </Text>

        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <TextField
              label="Check-in Date *"
              value={checkInDate}
              onChangeText={setCheckInDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.splitCol}>
            <TextField
              label="Check-out Date *"
              value={checkOutDate}
              onChangeText={setCheckOutDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
      </View>

      {/* Room Type Selector */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Home size={ICON.md} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Room Preference Category</Text>
        </View>

        <View style={styles.roomTypeCol}>
          <TouchableOpacity
            style={[styles.roomCard, roomType === 'Double Sharing' && styles.roomCardActive]}
            onPress={() => setRoomType('Double Sharing')}
            activeOpacity={0.8}
          >
            <View style={styles.roomInfo}>
              <Text style={[styles.roomTitle, roomType === 'Double Sharing' && styles.roomTitleActive]}>
                Double Sharing (Twin Bedded)
              </Text>
              <Text style={styles.roomDesc}>
                Attached bath, individual study table, air cooler, wardrobe. Most common allotment.
              </Text>
            </View>
            <Badge label="Popular" variant="primary" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roomCard, roomType === 'Single' && styles.roomCardActive]}
            onPress={() => setRoomType('Single')}
            activeOpacity={0.8}
          >
            <View style={styles.roomInfo}>
              <Text style={[styles.roomTitle, roomType === 'Single' && styles.roomTitleActive]}>
                Single Occupancy (Private Room)
              </Text>
              <Text style={styles.roomDesc}>
                Private room, AC, attached bath, reserved primarily for senior cooperative executives.
              </Text>
            </View>
            <Badge label="Executive" variant="neutral" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roomCard, roomType === 'Triple Sharing' && styles.roomCardActive]}
            onPress={() => setRoomType('Triple Sharing')}
            activeOpacity={0.8}
          >
            <View style={styles.roomInfo}>
              <Text style={[styles.roomTitle, roomType === 'Triple Sharing' && styles.roomTitleActive]}>
                Triple Sharing (Standard Block)
              </Text>
              <Text style={styles.roomDesc}>
                Spacious three-bed room, balcony, high-speed Wi-Fi, shared lobby.
              </Text>
            </View>
            <Badge label="Standard" variant="neutral" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dietary Requirements */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Utensils size={ICON.md} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Dietary & Dining Preferences</Text>
        </View>

        <View style={styles.dietaryRow}>
          {(['Vegetarian', 'Non-Vegetarian', 'Jain'] as DietaryType[]).map((d) => {
            const isSelected = dietary === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dietaryBtn, isSelected && styles.dietaryBtnActive]}
                onPress={() => setDietary(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dietaryText, isSelected && styles.dietaryTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hintText}>
          {dietary === 'Jain'
            ? 'Dedicated Jain counter serving satvik food with zero root vegetables.'
            : dietary === 'Non-Vegetarian'
            ? 'Non-veg served on scheduled dinner days (Wednesday & Sunday).'
            : 'Standard pure vegetarian dining with fresh dairy from Katraj cooperative.'}
        </Text>
      </View>

      {/* Special Assistance & Emergency Contact */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Special Assistance & Emergency Contact</Text>

        <TextField
          label="Accessibility or Special Health Notes"
          value={specialNotes}
          onChangeText={setSpecialNotes}
          multiline
          numberOfLines={2}
          style={styles.textArea}
          placeholder="e.g. Ground floor preference, medical support..."
        />

        <TextField
          label="Emergency Contact Name *"
          value={emergencyContactName}
          onChangeText={setEmergencyContactName}
          placeholder="Contact person name"
        />

        <TextField
          label="Emergency Phone Number *"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          keyboardType="phone-pad"
          placeholder="+91 98765 43210"
        />
      </View>

      {/* Code of Conduct Checkbox */}
      <TouchableOpacity
        style={[styles.rulesCard, rulesAccepted && styles.rulesCardActive]}
        onPress={() => setRulesAccepted(!rulesAccepted)}
        activeOpacity={0.8}
      >
        {rulesAccepted ? (
          <CheckSquare size={ICON.md} color={COLORS.primary} />
        ) : (
          <Square size={ICON.md} color={COLORS.textMuted} />
        )}
        <Text style={styles.rulesText}>
          I agree to comply with VAMNICOM residential hostel rules, quiet hours (10:30 PM), gate
          biometric timings, and maintain campus decorum during the training duration.
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <View style={styles.actionContainer}>
        <Button
          label="Submit Accommodation Request"
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
  topCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.xs,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBadge: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  progTitle: {
    ...TEXT.bodyStrong,
    fontSize: 15,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  campusName: {
    ...TEXT.caption,
    color: COLORS.primary,
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
    alignItems: 'center',
    gap: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACE.xs,
  },
  sectionTitle: {
    ...TEXT.section,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
  hintText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  splitRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  splitCol: {
    flex: 1,
  },
  roomTypeCol: {
    gap: SPACE.xs,
  },
  roomCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
  },
  roomCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  roomInfo: {
    flex: 1,
    paddingRight: SPACE.xs,
    gap: 2,
  },
  roomTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  roomTitleActive: {
    color: COLORS.primary,
  },
  roomDesc: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  dietaryRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  dietaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingVertical: SPACE.xs + 2,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  dietaryBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  dietaryText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  dietaryTextActive: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: SPACE.xs,
  },
  rulesCard: {
    flexDirection: 'row',
    gap: SPACE.sm,
    padding: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    alignItems: 'flex-start',
  },
  rulesCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  rulesText: {
    ...TEXT.caption,
    flex: 1,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  actionContainer: {
    paddingTop: SPACE.sm,
  },
});
