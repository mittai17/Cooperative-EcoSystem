import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  NCCT_INSTITUTIONS,
  NCCTInstitution,
} from './analyticsData';
import {
  Building2,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  PieChart,
  Calendar,
  Layers,
  GraduationCap,
} from 'lucide-react-native';

export const InstitutionAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'InstitutionAnalytics'>>();
  const orgId = route.params?.orgId;

  const institution: NCCTInstitution = useMemo(() => {
    return (
      NCCT_INSTITUTIONS.find(
        (inst) => inst.id === orgId || inst.shortCode.toLowerCase() === orgId?.toLowerCase()
      ) || NCCT_INSTITUTIONS[0]
    );
  }, [orgId]);

  return (
    <ScrollScreen
      title="Institutional Analytics"
      subtitle={`${institution.shortCode} • ${institution.zone} Zone`}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Header Institution Overview Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.iconCircle}>
              <Building2 size={ICON.lg} color={COLORS.primary} />
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.badgeRow}>
                <Badge
                  label={institution.type === 'Apex' ? 'Apex National Institute' : `${institution.type}`}
                  variant={institution.type === 'Apex' ? 'primary' : 'neutral'}
                />
                <Badge label={`${institution.zone} Zone`} />
              </View>
              <Text style={styles.institutionName}>{institution.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={COLORS.textMuted} />
                <Text style={styles.locationText}>
                  {institution.city}, {institution.state}
                </Text>
              </View>
            </View>
          </View>

          {/* Director & Contact Strip */}
          <View style={styles.contactStrip}>
            <Text style={styles.directorText}>Director: {institution.directorName}</Text>
            <View style={styles.contactDetails}>
              <Text style={styles.contactItemText}>{institution.phone}</Text>
              <Text style={styles.contactDot}>•</Text>
              <Text style={styles.contactItemText}>{institution.email}</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Key Performance Indicators */}
        <SectionHeader title="Core Institutional KPIs" />
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Users size={ICON.md} color={COLORS.primary} />
            <Text style={styles.kpiValue}>{institution.totalEnrolled.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Total Enrolled Trainees</Text>
          </View>

          <View style={styles.kpiCard}>
            <CheckCircle2 size={ICON.md} color={COLORS.success} />
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>
              {institution.completionRate}%
            </Text>
            <Text style={styles.kpiLabel}>Completion Rate</Text>
          </View>

          <View style={styles.kpiCard}>
            <Award size={ICON.md} color="#D97706" />
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>
              {institution.placementRate}%
            </Text>
            <Text style={styles.kpiLabel}>Placement Rate</Text>
          </View>

          <View style={styles.kpiCard}>
            <TrendingUp size={ICON.md} color={COLORS.primaryDark} />
            <Text style={styles.kpiValue}>{institution.attendanceRate}%</Text>
            <Text style={styles.kpiLabel}>Average Attendance</Text>
          </View>
        </View>

        {/* Additional Capacity KPIs */}
        <View style={styles.capacityCard}>
          <View style={styles.capacityItem}>
            <Text style={styles.capacityValue}>{institution.activeProgrammes}</Text>
            <Text style={styles.capacityLabel}>Active Programmes</Text>
          </View>
          <View style={styles.capacityDivider} />
          <View style={styles.capacityItem}>
            <Text style={styles.capacityValue}>{institution.activeBatches}</Text>
            <Text style={styles.capacityLabel}>Training Batches</Text>
          </View>
          <View style={styles.capacityDivider} />
          <View style={styles.capacityItem}>
            <Text style={styles.capacityValue}>{institution.certificatesIssued.toLocaleString()}</Text>
            <Text style={styles.capacityLabel}>Certificates Issued</Text>
          </View>
          <View style={styles.capacityDivider} />
          <View style={styles.capacityItem}>
            <Text style={styles.capacityValue}>{institution.hostelOccupancy}/{institution.hostelCapacity}</Text>
            <Text style={styles.capacityLabel}>Hostel Occupancy</Text>
          </View>
        </View>

        {/* Section 2: Trainees by Gender & Social Category */}
        <SectionHeader title="Demographics & Inclusion" />
        <View style={styles.card}>
          {/* Gender Ratio */}
          <Text style={styles.subhead}>Gender Representation</Text>
          <View style={styles.genderRow}>
            <View style={styles.genderItem}>
              <Text style={styles.genderLabel}>Female: {institution.demographics.gender.female}%</Text>
              <Text style={styles.genderCount}>
                {Math.round((institution.totalEnrolled * institution.demographics.gender.female) / 100)} trainees
              </Text>
            </View>
            <View style={styles.genderItemRight}>
              <Text style={styles.genderLabel}>Male: {institution.demographics.gender.male}%</Text>
              <Text style={styles.genderCount}>
                {Math.round((institution.totalEnrolled * institution.demographics.gender.male) / 100)} trainees
              </Text>
            </View>
          </View>
          <View style={styles.ratioBarWrap}>
            <View
              style={[
                styles.ratioBarFemale,
                { width: `${institution.demographics.gender.female}%` },
              ]}
            />
            <View
              style={[
                styles.ratioBarMale,
                { width: `${institution.demographics.gender.male}%` },
              ]}
            />
          </View>

          {/* Social Category Representation */}
          <Text style={[styles.subhead, { marginTop: SPACE.md }]}>Social Category Diversity</Text>
          <View style={styles.categoryStack}>
            <View style={styles.categoryItem}>
              <View style={styles.catLabelRow}>
                <Text style={styles.catTitle}>SC / ST Communities</Text>
                <Text style={styles.catPercent}>{institution.demographics.category.scSt}%</Text>
              </View>
              <ProgressBar value={institution.demographics.category.scSt} height={6} color={COLORS.primary} />
            </View>

            <View style={styles.categoryItem}>
              <View style={styles.catLabelRow}>
                <Text style={styles.catTitle}>Other Backward Classes (OBC)</Text>
                <Text style={styles.catPercent}>{institution.demographics.category.obc}%</Text>
              </View>
              <ProgressBar value={institution.demographics.category.obc} height={6} color="#D97706" />
            </View>

            <View style={styles.categoryItem}>
              <View style={styles.catLabelRow}>
                <Text style={styles.catTitle}>General / Open Merit</Text>
                <Text style={styles.catPercent}>{institution.demographics.category.general}%</Text>
              </View>
              <ProgressBar value={institution.demographics.category.general} height={6} color={COLORS.textSecondary} />
            </View>
          </View>

          {/* Rural Inclusion Tag */}
          <View style={styles.ruralTag}>
            <GraduationCap size={ICON.sm} color={COLORS.success} />
            <Text style={styles.ruralTagText}>
              {institution.demographics.ruralPercentage}% of trainees hail from Rural Primary Societies (PACS/FPOs)
            </Text>
          </View>
        </View>

        {/* Section 3: Sector Distribution Bar Chart */}
        <SectionHeader title="Sector Distribution (Workforce Trained)" />
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Distribution of trainees across cooperative sectors trained at {institution.shortCode}:
          </Text>
          <View style={styles.sectorBarList}>
            {institution.sectorDistribution.map((sec, idx) => {
              const barColors = [COLORS.primary, '#D97706', COLORS.success, '#6366F1', '#EC4899'];
              const color = barColors[idx % barColors.length];
              return (
                <View key={sec.sector} style={styles.sectorBarItem}>
                  <View style={styles.sectorBarTextRow}>
                    <Text style={styles.sectorName}>{sec.sector}</Text>
                    <Text style={styles.sectorStat}>
                      {sec.trainees} trainees ({sec.percentage}%)
                    </Text>
                  </View>
                  <ProgressBar value={sec.percentage} height={8} color={color} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Section 4: Monthly Outcomes Trend */}
        <SectionHeader title="Monthly Outcomes Trend (Past 6 Months)" />
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Comparison of Enrolled vs Certified vs Placed trainees:
          </Text>

          {/* Trend Table / Graph Cards */}
          <View style={styles.trendList}>
            {institution.monthlyTrend.map((item) => (
              <View key={item.month} style={styles.trendRow}>
                <View style={styles.monthCol}>
                  <Text style={styles.monthText}>{item.month} 2026</Text>
                </View>
                <View style={styles.trendStatsCol}>
                  <View style={styles.trendStatBadge}>
                    <Text style={styles.trendStatNumber}>{item.enrolled}</Text>
                    <Text style={styles.trendStatLabel}>Enrolled</Text>
                  </View>
                  <View style={[styles.trendStatBadge, { backgroundColor: COLORS.primarySurface }]}>
                    <Text style={[styles.trendStatNumber, { color: COLORS.primary }]}>
                      {item.certified}
                    </Text>
                    <Text style={styles.trendStatLabel}>Certified</Text>
                  </View>
                  <View style={[styles.trendStatBadge, { backgroundColor: COLORS.successSurface }]}>
                    <Text style={[styles.trendStatNumber, { color: COLORS.success }]}>
                      {item.placed}
                    </Text>
                    <Text style={styles.trendStatLabel}>Placed</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  headerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  headerTop: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  institutionName: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  contactStrip: {
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 2,
  },
  directorText: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  contactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactItemText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  contactDot: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  kpiCard: {
    ...CARD,
    flex: 1,
    minWidth: '45%',
    padding: SPACE.md,
    gap: 2,
  },
  kpiValue: {
    ...TEXT.title,
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  kpiLabel: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  capacityCard: {
    ...CARD,
    flexDirection: 'row',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xs,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  capacityItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  capacityValue: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  capacityLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  capacityDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.borderLight,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cardDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACE.xs,
  },
  subhead: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderItem: {
    alignItems: 'flex-start',
  },
  genderItemRight: {
    alignItems: 'flex-end',
  },
  genderLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  genderCount: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  ratioBarWrap: {
    flexDirection: 'row',
    height: 10,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    marginTop: 4,
  },
  ratioBarFemale: {
    backgroundColor: '#EC4899',
    height: '100%',
  },
  ratioBarMale: {
    backgroundColor: '#3B82F6',
    height: '100%',
  },
  categoryStack: {
    gap: SPACE.sm,
  },
  categoryItem: {
    gap: 4,
  },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catTitle: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
  },
  catPercent: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  ruralTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successSurface,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
    marginTop: SPACE.xs,
  },
  ruralTagText: {
    ...TEXT.caption,
    fontSize: 11,
    color: '#22543D',
    fontWeight: '600',
    flex: 1,
  },
  sectorBarList: {
    gap: SPACE.md,
  },
  sectorBarItem: {
    gap: 4,
  },
  sectorBarTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectorName: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  sectorStat: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  trendList: {
    gap: SPACE.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  monthCol: {
    width: 70,
  },
  monthText: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  trendStatsCol: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  trendStatBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    alignItems: 'center',
    minWidth: 62,
  },
  trendStatNumber: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  trendStatLabel: {
    ...TEXT.caption,
    fontSize: 9,
    color: COLORS.textMuted,
  },
});
