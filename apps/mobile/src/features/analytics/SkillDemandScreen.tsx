import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  SKILL_DEMAND_INTELLIGENCE,
  SkillDemandItem,
} from './analyticsData';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Layers,
  MapPin,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react-native';

const SECTOR_TABS = ['All', 'Credit & Banking', 'Dairy', 'Agriculture & Marketing', 'Governance', 'Handloom', 'Fisheries'] as const;

export const SkillDemandScreen: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<string>('All');

  const filteredSkills = SKILL_DEMAND_INTELLIGENCE.filter((item) => {
    if (selectedSector === 'All') return true;
    return item.sector === selectedSector;
  });

  const totalDemand = SKILL_DEMAND_INTELLIGENCE.reduce((acc, i) => acc + i.demandCount, 0);
  const totalTrained = SKILL_DEMAND_INTELLIGENCE.reduce((acc, i) => acc + i.trainedCount, 0);
  const totalGap = SKILL_DEMAND_INTELLIGENCE.reduce((acc, i) => acc + i.gapCount, 0);

  return (
    <ScrollScreen
      title="Skill Demand & Workforce Gaps"
      subtitle="Intelligence gathered from 1,450+ cooperative employers & post-placement feedback"
      tab
      sticky={
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorBar}
        >
          {SECTOR_TABS.map((sec) => {
            const active = selectedSector === sec;
            return (
              <TouchableOpacity
                key={sec}
                style={[styles.sectorChip, active && styles.sectorChipActive]}
                onPress={() => setSelectedSector(sec)}
              >
                <Text style={[styles.sectorChipText, active && styles.sectorChipTextActive]}>
                  {sec}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      }
    >
      <View style={styles.container}>
        {/* National Demand Overview Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Briefcase size={ICON.md} color={COLORS.primary} />
            <Text style={styles.kpiValue}>{totalDemand.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Employer Vacancies</Text>
          </View>

          <View style={styles.kpiCard}>
            <CheckCircle2 size={ICON.md} color={COLORS.success} />
            <Text style={[styles.kpiValue, { color: COLORS.success }]}>
              {totalTrained.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Trained Supply</Text>
          </View>

          <View style={styles.kpiCard}>
            <AlertTriangle size={ICON.md} color={COLORS.danger} />
            <Text style={[styles.kpiValue, { color: COLORS.danger }]}>
              -{totalGap.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Unfulfilled Gap</Text>
          </View>
        </View>

        {/* Explainability Note */}
        <View style={styles.noteBanner}>
          <Sparkles size={ICON.md} color={COLORS.primary} />
          <View style={styles.noteTextWrap}>
            <Text style={styles.noteTitle}>Real-time Cooperative Feedback Loop</Text>
            <Text style={styles.noteDesc}>
              Employer post-placement feedback automatically feeds this intelligence registry, informing upcoming batch allocations at RICMs/ICMs.
            </Text>
          </View>
        </View>

        {/* In-Demand Skills List */}
        <SectionHeader title="Top Cooperative Skills in Demand" />
        <View style={styles.skillsList}>
          {filteredSkills.map((item) => {
            const isCritical = item.trend === 'critical';
            const isRising = item.trend === 'rising';
            const fulfillRate = Math.round((item.trainedCount / item.demandCount) * 100);

            return (
              <View key={item.id} style={styles.skillCard}>
                <View style={styles.skillCardHeader}>
                  <View style={styles.skillTitleWrap}>
                    <Text style={styles.skillName}>{item.skill}</Text>
                    <Text style={styles.skillSector}>{item.sector}</Text>
                  </View>
                  <Badge
                    label={item.trendLabel}
                    variant={isCritical ? 'primary' : isRising ? 'primary' : 'neutral'}
                  />
                </View>

                {/* Progress bar of fulfilled demand */}
                <View style={styles.fulfillProgressWrap}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>
                      Supply: {item.trainedCount.toLocaleString()} / Demand: {item.demandCount.toLocaleString()}
                    </Text>
                    <Text style={styles.progressPercent}>{fulfillRate}% fulfilled</Text>
                  </View>
                  <ProgressBar
                    value={fulfillRate}
                    height={7}
                    color={fulfillRate >= 80 ? COLORS.success : COLORS.primary}
                  />
                </View>

                {/* Metric footer */}
                <View style={styles.skillCardFooter}>
                  <View style={styles.gapStat}>
                    <Text style={styles.gapLabel}>Net Deficit:</Text>
                    <Text style={styles.gapValue}>{item.gapCount.toLocaleString()} trainees needed</Text>
                  </View>
                  <View style={styles.trendIndicator}>
                    <TrendingUp size={12} color={isCritical ? COLORS.danger : COLORS.primary} />
                    <Text style={styles.trendIndicatorText}>
                      {isCritical ? 'Urgent Curriculum Priority' : 'High Industry Intake'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Regional Workforce Hotspots */}
        <SectionHeader title="Regional Demand Hotspots (Highest Vacancies)" />
        <View style={styles.card}>
          <View style={styles.hotspotItem}>
            <View style={styles.hotspotTop}>
              <View style={styles.stateRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.stateName}>Maharashtra (Pune, Kolhapur, Nagpur)</Text>
              </View>
              <Text style={styles.hotspotVacancies}>5,800 vacancies</Text>
            </View>
            <Text style={styles.hotspotDesc}>High demand in Cooperative Sugar Mills, MSCB Credit Banking, & Mahanand Dairy.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.hotspotItem}>
            <View style={styles.hotspotTop}>
              <View style={styles.stateRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.stateName}>Gujarat (Anand, Mehsana, Gandhinagar)</Text>
              </View>
              <Text style={styles.hotspotVacancies}>4,950 vacancies</Text>
            </View>
            <Text style={styles.hotspotDesc}>Primary union demand in Dairy Operations, Cold Chain, and Automated Quality Testing.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.hotspotItem}>
            <View style={styles.hotspotTop}>
              <View style={styles.stateRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.stateName}>Uttar Pradesh (Lucknow, Meerut, Varanasi)</Text>
              </View>
              <Text style={styles.hotspotVacancies}>4,200 vacancies</Text>
            </View>
            <Text style={styles.hotspotDesc}>Massive demand for PACS computerization operators and Cooperative Sugar plant supervisors.</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.hotspotItem}>
            <View style={styles.hotspotTop}>
              <View style={styles.stateRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.stateName}>Tamil Nadu (Madurai, Coimbatore, Chennai)</Text>
              </View>
              <Text style={styles.hotspotVacancies}>3,400 vacancies</Text>
            </View>
            <Text style={styles.hotspotDesc}>Co-optex Handloom Weavers and Aavin Dairy federations scaling modern export workflows.</Text>
          </View>
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  sectorBar: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectorChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectorChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sectorChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  sectorChipTextActive: {
    color: COLORS.textInverse,
  },
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACE.xs + 2,
  },
  kpiCard: {
    ...CARD,
    flex: 1,
    padding: SPACE.sm + 2,
    gap: 2,
    alignItems: 'center',
  },
  kpiValue: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  kpiLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  noteTextWrap: {
    flex: 1,
  },
  noteTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  noteDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  skillsList: {
    gap: SPACE.md,
  },
  skillCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skillTitleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  skillName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  skillSector: {
    ...TEXT.caption,
    color: COLORS.primary,
    marginTop: 2,
  },
  fulfillProgressWrap: {
    gap: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    ...TEXT.captionStrong,
    fontSize: 11,
    color: COLORS.primaryDark,
  },
  skillCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  gapStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gapLabel: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  gapValue: {
    ...TEXT.captionStrong,
    fontSize: 11,
    color: COLORS.danger,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendIndicatorText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  hotspotItem: {
    gap: 2,
  },
  hotspotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stateName: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  hotspotVacancies: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  hotspotDesc: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    marginLeft: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
});
