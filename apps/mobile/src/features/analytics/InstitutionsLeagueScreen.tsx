import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SearchField } from '../../components/SearchField';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
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
  ChevronRight,
  TrendingUp,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react-native';

const ZONES = ['All', 'West', 'South', 'North', 'East', 'Central', 'North-East'] as const;
type SortKey = 'placement' | 'completion' | 'enrolled';

export const InstitutionsLeagueScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortKey>('placement');

  // Filter & sort
  const sortedInstitutions = useMemo(() => {
    let list = NCCT_INSTITUTIONS.filter((inst) => {
      const matchesZone = selectedZone === 'All' || inst.zone === selectedZone;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q) ||
        inst.state.toLowerCase().includes(q) ||
        inst.shortCode.toLowerCase().includes(q);

      return matchesZone && matchesQuery;
    });

    list.sort((a, b) => {
      if (sortBy === 'placement') return b.placementRate - a.placementRate;
      if (sortBy === 'completion') return b.completionRate - a.completionRate;
      if (sortBy === 'enrolled') return b.totalEnrolled - a.totalEnrolled;
      return 0;
    });

    return list;
  }, [searchQuery, selectedZone, sortBy]);

  return (
    <ScrollScreen
      title="Institutions League Table"
      subtitle="Ranked performance of 14 RICMs/ICMs and VAMNICOM"
      tab
      sticky={
        <View style={styles.stickyWrap}>
          <SearchField
            placeholder="Search institute by name, city, or state..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Zone Filter Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zonesRow}
          >
            {ZONES.map((zone) => {
              const active = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.zoneChip, active && styles.zoneChipActive]}
                  onPress={() => setSelectedZone(zone)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.zoneChipText, active && styles.zoneChipTextActive]}>
                    {zone === 'All' ? 'All Zones' : `${zone} Zone`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sort Control Strip */}
          <View style={styles.sortStrip}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'placement' && styles.sortButtonActive]}
              onPress={() => setSortBy('placement')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'placement' && styles.sortButtonTextActive]}>
                Placement Rate
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'completion' && styles.sortButtonActive]}
              onPress={() => setSortBy('completion')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'completion' && styles.sortButtonTextActive]}>
                Completion
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'enrolled' && styles.sortButtonActive]}
              onPress={() => setSortBy('enrolled')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'enrolled' && styles.sortButtonTextActive]}>
                Volume
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    >
      <View style={styles.container}>
        {sortedInstitutions.length === 0 ? (
          <EmptyState
            title="No institutes found"
            message="Try clearing your search query or selecting All Zones."
          />
        ) : (
          <View style={styles.institutionsList}>
            {sortedInstitutions.map((inst, index) => {
              const rank = index + 1;
              return (
                <TouchableOpacity
                  key={inst.id}
                  style={styles.institutionCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate('InstitutionAnalytics', { orgId: inst.id })
                  }
                >
                  {/* Top Bar: Rank & Badges */}
                  <View style={styles.cardTopBar}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankNumber}>#{rank}</Text>
                    </View>
                    <View style={styles.cardHeaderBadges}>
                      <Badge
                        label={inst.type === 'Apex' ? 'Apex Institute' : inst.type}
                        variant={inst.type === 'Apex' ? 'primary' : 'neutral'}
                      />
                      <Badge label={`${inst.zone} Zone`} />
                    </View>
                  </View>

                  {/* Main Details */}
                  <View style={styles.cardBody}>
                    <Text style={styles.instName}>{inst.name}</Text>
                    <View style={styles.locationRow}>
                      <MapPin size={12} color={COLORS.textMuted} />
                      <Text style={styles.locationText}>
                        {inst.city}, {inst.state}
                      </Text>
                    </View>
                  </View>

                  {/* Metrics Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricVal}>{inst.totalEnrolled.toLocaleString()}</Text>
                      <Text style={styles.metricLbl}>Enrolled</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricVal}>{inst.completionRate}%</Text>
                      <Text style={styles.metricLbl}>Completion</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricVal, { color: COLORS.success }]}>
                        {inst.placementRate}%
                      </Text>
                      <Text style={styles.metricLbl}>Placement</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricVal}>{inst.attendanceRate}%</Text>
                      <Text style={styles.metricLbl}>Attendance</Text>
                    </View>
                  </View>

                  {/* Footer link */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.viewAnalyticsText}>View Detailed Analytics & Demographics</Text>
                    <ChevronRight size={ICON.sm} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  stickyWrap: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACE.xs,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
  },
  zoneChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  zoneChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  zoneChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  zoneChipTextActive: {
    color: COLORS.textInverse,
  },
  sortStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
  },
  sortLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primaryDark,
  },
  sortButtonText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sortButtonTextActive: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  container: {
    padding: SPACE.md,
  },
  institutionsList: {
    gap: SPACE.md,
  },
  institutionCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  rankNumber: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  cardHeaderBadges: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  cardBody: {
    gap: 4,
  },
  instName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
    lineHeight: 20,
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACE.xs + 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  metricLbl: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: COLORS.border,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  viewAnalyticsText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
});
