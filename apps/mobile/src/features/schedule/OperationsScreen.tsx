import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import {
  Home,
  Calendar,
  Truck,
  ClipboardList,
  Bell,
  ChevronRight,
  Building,
  Users,
  ShieldCheck,
} from 'lucide-react-native';

export const OperationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollScreen
      tab
      title="Campus Operations"
      subtitle="Manage accommodation, timetable exceptions, and onboarding logistics."
    >
      {/* Key Status Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>42/48</Text>
          <Text style={styles.metricLabel}>Rooms Occupied</Text>
          <Badge label="6 Vacant" variant="success" />
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>4</Text>
          <Text style={styles.metricLabel}>Waitlist Queue</Text>
          <Badge label="Hostel" variant="primary" />
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>92%</Text>
          <Text style={styles.metricLabel}>Induction Clear</Text>
          <Badge label="Active Batch" variant="neutral" />
        </View>
      </View>

      {/* Main Operations Navigation Menu */}
      <View style={styles.menuContainer}>
        {/* Hostel Management */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('HostelWaitlist')}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <Home size={ICON.lg} color={COLORS.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Hostel Room Matrix & Waitlist</Text>
            <Text style={styles.menuSub}>
              Allocate vacant beds, examine waitlist applications, and manage Block A/B/C warden desks.
            </Text>
          </View>
          <ChevronRight size={ICON.md} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Timetable Exception Management */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            navigation.navigate('ScheduleChange', {
              slotId: 'slot-103',
              date: '2026-10-19',
            })
          }
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <Calendar size={ICON.lg} color={COLORS.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Timetable Rescheduling & Exceptions</Text>
            <Text style={styles.menuSub}>
              Publish class cancellations, room changes, or trainer substitutions with automated push alerts.
            </Text>
          </View>
          <ChevronRight size={ICON.md} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Onboarding & Logistics Clearance */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('LogisticsChecklist')}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <ClipboardList size={ICON.lg} color={COLORS.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Trainee Onboarding Logistics</Text>
            <Text style={styles.menuSub}>
              Monitor induction kits, smart ID cards, Wi-Fi credentials, library cards, and mess card issuance.
            </Text>
          </View>
          <ChevronRight size={ICON.md} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Notifications & Announcements */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate('Inbox')}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <Bell size={ICON.lg} color={COLORS.primary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Broadcast Alerts & Notification Desk</Text>
            <Text style={styles.menuSub}>
              Send urgent SMS and push notices to trainees and faculty regarding campus events and weather updates.
            </Text>
          </View>
          <ChevronRight size={ICON.md} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Campus Shuttle Fleet Logistics Block */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Truck size={ICON.md} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Campus Shuttle & Fleet Dispatch</Text>
        </View>

        <View style={styles.fleetItem}>
          <View style={styles.fleetLeft}>
            <Text style={styles.fleetVehicle}>MH-12-QX-4012 (32-Seater Mini Bus)</Text>
            <Text style={styles.fleetRoute}>Route: Pune Railway Station ⇄ VAMNICOM Campus</Text>
            <Text style={styles.fleetDriver}>Driver: Shri Ramesh Jadhav (+91 98224 11223)</Text>
          </View>
          <Badge label="On Time" variant="success" />
        </View>

        <View style={styles.fleetItem}>
          <View style={styles.fleetLeft}>
            <Text style={styles.fleetVehicle}>MH-12-TR-8821 (Field Study Coach)</Text>
            <Text style={styles.fleetRoute}>Route: Katraj Dairy Industrial Immersion Visit</Text>
            <Text style={styles.fleetDriver}>Driver: Shri Santosh Mane (+91 98225 66778)</Text>
          </View>
          <Badge label="Scheduled 2 PM" variant="neutral" />
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  metricCard: {
    flex: 1,
    ...CARD,
    padding: SPACE.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  metricVal: {
    ...TEXT.title,
    fontSize: 18,
    color: COLORS.primaryDark,
  },
  metricLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  menuContainer: {
    gap: SPACE.sm,
  },
  menuCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    ...TEXT.bodyStrong,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
  menuSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
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
  fleetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.md,
  },
  fleetLeft: {
    flex: 1,
    gap: 2,
    paddingRight: SPACE.xs,
  },
  fleetVehicle: {
    ...TEXT.bodyStrong,
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  fleetRoute: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  fleetDriver: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
