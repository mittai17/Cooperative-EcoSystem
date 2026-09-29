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
import { PillTabs } from '../../components/PillTabs';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import {
  MOCK_TRAINEE_HOSTEL,
  MOCK_HOSTEL_WAITLIST,
  HostelAllocationData,
  HostelWaitlistRecord,
} from './mockData';
import {
  Home,
  Building,
  User,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldAlert,
  Download,
  Utensils,
  Wifi,
} from 'lucide-react-native';

const VIEW_TABS = [
  { key: 'my_allocation', label: 'My Room Allocation' },
  { key: 'waitlist_queue', label: 'Campus Waitlist Matrix' },
] as const;

type ViewTab = (typeof VIEW_TABS)[number]['key'];

export const HostelWaitlistScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<ViewTab>('my_allocation');
  const [allocation, setAllocation] = useState<HostelAllocationData>(MOCK_TRAINEE_HOSTEL);
  const [waitlist, setWaitlist] = useState<HostelWaitlistRecord[]>(MOCK_HOSTEL_WAITLIST);

  const handleDownloadPass = () => {
    Alert.alert(
      'Allocation Pass Generated',
      `Room allotment confirmation for ${allocation.room_number} in ${allocation.block_name} has been downloaded to your device.`
    );
  };

  const handleAllocateWaitlist = (record: HostelWaitlistRecord) => {
    Alert.alert(
      'Allocate Room',
      `Assign vacant room B-206 to waitlisted trainee "${record.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Allotment',
          onPress: () => {
            setWaitlist((prev) =>
              prev.map((item) =>
                item.id === record.id ? { ...item, status: 'allocated' } : item
              )
            );
            Alert.alert('Allotment Complete', `Room B-206 assigned to ${record.name}. Notification sent.`);
          },
        },
      ]
    );
  };

  return (
    <ScrollScreen
      title="Hostel Allocations"
      onBack={() => navigation.goBack()}
      sticky={<PillTabs tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} />}
    >
      {activeTab === 'my_allocation' ? (
        <View style={styles.tabContent}>
          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusBannerLeft}>
              <View style={styles.keyCircle}>
                <Key size={ICON.md} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statusTitle}>ROOM ALLOCATED & CONFIRMED</Text>
                <Text style={styles.statusSub}>Keys available at Block Warden Office</Text>
              </View>
            </View>
            <Badge label="Active" variant="success" verified />
          </View>

          {/* Room Allotment Card */}
          <View style={[styles.card, styles.sectionCard]}>
            <View style={styles.cardHeaderRow}>
              <Home size={ICON.md} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Room Particulars</Text>
            </View>

            <View style={styles.roomHero}>
              <Text style={styles.roomHeroNumber}>{allocation.room_number}</Text>
              <Text style={styles.roomHeroType}>
                {allocation.room_type} · {allocation.bed_label}
              </Text>
              <Text style={styles.roomHeroBlock}>{allocation.block_name}</Text>
              <Text style={styles.roomHeroFloor}>{allocation.floor}</Text>
            </View>

            <View style={styles.datesRow}>
              <View style={styles.dateCol}>
                <Calendar size={ICON.sm} color={COLORS.textMuted} />
                <View>
                  <Text style={styles.dateLabel}>Check-in Date</Text>
                  <Text style={styles.dateValue}>{allocation.check_in_date}</Text>
                </View>
              </View>
              <View style={styles.dateCol}>
                <Calendar size={ICON.sm} color={COLORS.textMuted} />
                <View>
                  <Text style={styles.dateLabel}>Check-out Date</Text>
                  <Text style={styles.dateValue}>{allocation.check_out_date}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Warden Contact Card */}
          <View style={[styles.card, styles.sectionCard]}>
            <View style={styles.cardHeaderRow}>
              <User size={ICON.md} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Hostel Warden & Administration</Text>
            </View>

            <View style={styles.wardenInfo}>
              <Text style={styles.wardenName}>{allocation.warden_name}</Text>
              <Text style={styles.wardenOffice}>{allocation.warden_office}</Text>

              <TouchableOpacity
                style={styles.wardenPhoneBtn}
                onPress={() =>
                  Alert.alert('Calling Warden', `Dialling ${allocation.warden_phone}...`)
                }
              >
                <Phone size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.wardenPhoneText}>{allocation.warden_phone}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timingBox}>
              <Clock size={ICON.sm} color={COLORS.danger} />
              <Text style={styles.timingText}>Campus Gate Curfew: {allocation.gate_curfew}</Text>
            </View>
          </View>

          {/* Mess Timings & Amenities */}
          <View style={[styles.card, styles.sectionCard]}>
            <View style={styles.cardHeaderRow}>
              <Utensils size={ICON.md} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Dining & Mess Schedule</Text>
            </View>

            <View style={styles.messRow}>
              <View style={styles.messItem}>
                <Text style={styles.messLabel}>Breakfast</Text>
                <Text style={styles.messTime}>{allocation.mess_timings.breakfast}</Text>
              </View>
              <View style={styles.messItem}>
                <Text style={styles.messLabel}>Lunch</Text>
                <Text style={styles.messTime}>{allocation.mess_timings.lunch}</Text>
              </View>
              <View style={styles.messItem}>
                <Text style={styles.messLabel}>Dinner</Text>
                <Text style={styles.messTime}>{allocation.mess_timings.dinner}</Text>
              </View>
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: SPACE.sm }]}>Room Amenities</Text>
            {allocation.amenities.map((item, idx) => (
              <View key={idx} style={styles.amenityRow}>
                <CheckCircle2 size={ICON.sm} color={COLORS.success} />
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Action button */}
          <View style={styles.actionContainer}>
            <Button
              label="Download Room Allocation Pass"
              onPress={handleDownloadPass}
              variant="primary"
              icon={<Download size={ICON.sm} color={COLORS.textInverse} />}
            />
          </View>
        </View>
      ) : (
        <View style={styles.tabContent}>
          {/* Institutional Waitlist Matrix */}
          <View style={styles.waitlistSummaryCard}>
            <View>
              <Text style={styles.waitlistHeading}>Hostel Occupancy & Waitlist</Text>
              <Text style={styles.waitlistSub}>Block B: 42 of 48 Rooms Occupied (6 Vacant)</Text>
            </View>
            <Badge label="6 Vacant Beds" variant="neutral" />
          </View>

          {waitlist.map((item) => {
            const isAllocated = item.status === 'allocated';
            return (
              <View key={item.id} style={styles.waitlistCard}>
                <View style={styles.waitlistTop}>
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueText}>#{item.queue_position}</Text>
                  </View>
                  <View style={styles.waitlistTraineeInfo}>
                    <Text style={styles.waitlistName}>{item.name}</Text>
                    <Text style={styles.waitlistProg} numberOfLines={1}>
                      {item.programme}
                    </Text>
                  </View>
                  {isAllocated ? (
                    <Badge label="Allocated" variant="success" verified />
                  ) : (
                    <Badge label="Waitlisted" variant="primary" />
                  )}
                </View>

                <View style={styles.waitlistMetaRow}>
                  <Text style={styles.waitlistMetaText}>
                    Pref: {item.preference} · {item.dietary}
                  </Text>
                  <Text style={styles.waitlistApplied}>
                    Applied {new Date(item.applied_on).toLocaleDateString()}
                  </Text>
                </View>

                {item.special_notes ? (
                  <View style={styles.specialNoteBox}>
                    <ShieldAlert size={ICON.sm} color={COLORS.primary} />
                    <Text style={styles.specialNoteText}>{item.special_notes}</Text>
                  </View>
                ) : null}

                {!isAllocated && (
                  <TouchableOpacity
                    style={styles.allocateActionBtn}
                    onPress={() => handleAllocateWaitlist(item)}
                    activeOpacity={0.8}
                  >
                    <Key size={ICON.sm} color={COLORS.textInverse} />
                    <Text style={styles.allocateActionText}>Allocate Vacant Room</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    gap: SPACE.md,
  },
  statusBanner: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  keyCircle: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusSub: {
    ...TEXT.caption,
    color: COLORS.textMuted,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACE.xs,
  },
  cardTitle: {
    ...TEXT.section,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
  roomHero: {
    alignItems: 'center',
    paddingVertical: SPACE.xs,
    gap: 2,
  },
  roomHeroNumber: {
    ...TEXT.title,
    fontSize: 26,
    color: COLORS.primary,
  },
  roomHeroType: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  roomHeroBlock: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  roomHeroFloor: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.sm,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  dateLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  dateValue: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  wardenInfo: {
    gap: 4,
  },
  wardenName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  wardenOffice: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  wardenPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: 2,
  },
  wardenPhoneText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  timingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
  },
  timingText: {
    ...TEXT.captionStrong,
    color: COLORS.danger,
    fontSize: 11,
  },
  messRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
  },
  messItem: {
    alignItems: 'center',
    gap: 2,
  },
  messLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  messTime: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    fontSize: 11,
  },
  subSectionTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
    fontSize: 12,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: 2,
  },
  amenityText: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  actionContainer: {
    paddingTop: SPACE.xs,
  },
  waitlistSummaryCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  waitlistHeading: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  waitlistSub: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  waitlistCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  waitlistTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  queueBadge: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  waitlistTraineeInfo: {
    flex: 1,
  },
  waitlistName: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  waitlistProg: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  waitlistMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  waitlistMetaText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  waitlistApplied: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  specialNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    backgroundColor: COLORS.surface,
    padding: SPACE.xs + 2,
    borderRadius: RADII.sm,
  },
  specialNoteText: {
    ...TEXT.caption,
    color: COLORS.primary,
    fontSize: 11,
  },
  allocateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADII.sm,
    marginTop: SPACE.xs,
  },
  allocateActionText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
    fontSize: 12,
  },
});
