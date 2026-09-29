import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  NATIONAL_APEX_METRICS,
  NCCT_INSTITUTIONS,
} from './analyticsData';
import {
  Globe,
  Award,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowUpRight,
} from 'lucide-react-native';

export const NationalOverviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const metrics = NATIONAL_APEX_METRICS;

  return (
    <ScrollScreen
      title="National Cooperative Monitoring"
      subtitle="NCCT Apex Real-Time Training & Employment Intelligence"
      tab
      rightAction={
        <Badge label="Live NCCT Network" variant="success" verified />
      }
    >
      <View style={styles.container}>
        {/* Ministry / NCCT Apex Header Banner */}
        <View style={styles.apexBanner}>
          <View style={styles.apexIconBox}>
            <Globe size={ICON.lg} color={COLORS.primary} />
          </View>
          <View style={styles.apexInfo}>
            <Text style={styles.apexTitle}>National Council for Cooperative Training</Text>
            <Text style={styles.apexSubtitle}>
              Ministry of Cooperation • 14 RICMs/ICMs + VAMNICOM Apex
            </Text>
          </View>
        </View>

        {/* National Macro KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Users size={ICON.md} color={COLORS.primary} />
            <Text style={styles.kpiValue}>{metrics.totalTrainees.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Total Trainees Enrolled</Text>
          </View>

          <View style={styles.kpiCard}>
            <CheckCircle2 size={ICON.md} color={COLORS.success} />
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>
              {metrics.totalCertified.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Trainees Certified</Text>
          </View>

          <View style={styles.kpiCard}>
            <Award size={ICON.md} color="#D97706" />
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>
              {metrics.totalPlaced.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Placed in Cooperatives</Text>
          </View>

          <View style={styles.kpiCard}>
            <Building2 size={ICON.md} color={COLORS.primaryDark} />
            <Text style={styles.kpiValue}>{metrics.activeEmployers.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Cooperative Employers</Text>
          </View>
        </View>

        {/* National Employment Funnel */}
        <SectionHeader title="National Employment Pipeline Funnel" />
        <View style={styles.card}>
          <Text style={styles.cardHint}>
            End-to-end traversal from admission across 14 RICMs/ICMs to cooperative placement:
          </Text>
          <View style={styles.funnelList}>
            {metrics.funnel.map((step, idx) => (
              <View key={step.stage} style={styles.funnelItem}>
                <View style={styles.funnelLabelRow}>
                  <Text style={styles.funnelStageName}>
                    {idx + 1}. {step.stage}
                  </Text>
                  <Text style={styles.funnelStageCount}>
                    {step.count.toLocaleString()} ({step.percentage}%)
                  </Text>
                </View>
                <ProgressBar
                  value={step.percentage}
                  height={7}
                  color={idx === metrics.funnel.length - 1 ? COLORS.success : COLORS.primary}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Sectoral Workforce Distribution */}
        <SectionHeader title="Cooperative Sector Workforce Distribution" />
        <View style={styles.card}>
          <Text style={styles.cardHint}>
            National deployment of certified cooperative talent across primary sectors:
          </Text>
          <View style={styles.sectorList}>
            {metrics.sectorWorkforce.map((sec, idx) => {
              const colors = [COLORS.primary, '#D97706', COLORS.success, '#6366F1', '#EC4899', '#14B8A6'];
              const color = colors[idx % colors.length];
              return (
                <View key={sec.sector} style={styles.sectorItem}>
                  <View style={styles.sectorTextRow}>
                    <Text style={styles.sectorTitle}>{sec.sector}</Text>
                    <Text style={styles.sectorMetrics}>
                      {sec.count.toLocaleString()} ({sec.percentage}%)
                    </Text>
                  </View>
                  <ProgressBar value={sec.percentage * 2.5} height={7} color={color} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Regional Zone Performance */}
        <SectionHeader title="Regional Training Distribution" />
        <View style={styles.card}>
          <View style={styles.zoneList}>
            {metrics.zones.map((zone) => (
              <View key={zone.zone} style={styles.zoneItem}>
                <View style={styles.zoneTextRow}>
                  <Text style={styles.zoneName}>{zone.zone}</Text>
                  <Text style={styles.zoneCount}>
                    {zone.trainees.toLocaleString()} ({zone.percentage}%)
                  </Text>
                </View>
                <ProgressBar value={zone.percentage * 3} height={6} color={COLORS.primaryDark} />
              </View>
            ))}
          </View>
        </View>

        {/* Top 3 Institutions Spotlight */}
        <SectionHeader
          title="Apex & Lead Institutes Spotlight"
          actionLabel="View All 14"
          onAction={() => navigation.navigate('InstitutionsTab')}
        />
        <View style={styles.spotlightList}>
          {NCCT_INSTITUTIONS.slice(0, 3).map((inst) => (
            <TouchableOpacity
              key={inst.id}
              style={styles.spotlightCard}
              activeOpacity={0.88}
              onPress={() =>
                navigation.navigate('InstitutionAnalytics', { orgId: inst.id })
              }
            >
              <View style={styles.spotlightTop}>
                <View style={styles.spotlightInfo}>
                  <View style={styles.badgeRow}>
                    <Badge label={inst.type} variant={inst.type === 'Apex' ? 'primary' : 'neutral'} />
                    <Text style={styles.spotlightCity}>{inst.city}, {inst.state}</Text>
                  </View>
                  <Text style={styles.spotlightName}>{inst.name}</Text>
                </View>
                <ArrowUpRight size={ICON.md} color={COLORS.primary} />
              </View>

              <View style={styles.spotlightStatsRow}>
                <View style={styles.spotlightStat}>
                  <Text style={styles.spotlightStatVal}>{inst.totalEnrolled.toLocaleString()}</Text>
                  <Text style={styles.spotlightStatLbl}>Enrolled</Text>
                </View>
                <View style={styles.spotlightStat}>
                  <Text style={[styles.spotlightStatVal, { color: COLORS.success }]}>
                    {inst.placementRate}%
                  </Text>
                  <Text style={styles.spotlightStatLbl}>Placement</Text>
                </View>
                <View style={styles.spotlightStat}>
                  <Text style={styles.spotlightStatVal}>{inst.completionRate}%</Text>
                  <Text style={styles.spotlightStatLbl}>Completion</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  apexBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  apexIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apexInfo: {
    flex: 1,
  },
  apexTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  apexSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cardHint: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginBottom: SPACE.xs,
  },
  funnelList: {
    gap: SPACE.sm + 2,
  },
  funnelItem: {
    gap: 4,
  },
  funnelLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  funnelStageName: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  funnelStageCount: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  sectorList: {
    gap: SPACE.sm + 2,
  },
  sectorItem: {
    gap: 4,
  },
  sectorTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectorTitle: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  sectorMetrics: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  zoneList: {
    gap: SPACE.sm,
  },
  zoneItem: {
    gap: 4,
  },
  zoneTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  zoneName: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
  },
  zoneCount: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
    fontSize: 11,
  },
  spotlightList: {
    gap: SPACE.sm,
  },
  spotlightCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  spotlightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotlightInfo: {
    flex: 1,
    marginRight: SPACE.sm,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  spotlightCity: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  spotlightName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  spotlightStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  spotlightStat: {
    alignItems: 'center',
  },
  spotlightStatVal: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  spotlightStatLbl: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
