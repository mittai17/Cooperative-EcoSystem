import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SearchField } from '../../components/SearchField';
import { PillTabs } from '../../components/PillTabs';
import { Badge } from '../../components/Badge';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_PROGRAMMES } from './mockData';
import { Calendar, Users, Clock, Building2, ChevronRight } from 'lucide-react-native';

const SECTOR_TABS = [
  { key: 'all', label: 'All Sectors' },
  { key: 'pacs', label: 'PACS & Credit' },
  { key: 'dairy', label: 'Dairy & Livestock' },
  { key: 'governance', label: 'Management' },
] as const;

type SectorTab = (typeof SECTOR_TABS)[number]['key'];

export const ProgrammeCatalogScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<SectorTab>('all');

  const programmesList = Object.values(MOCK_PROGRAMMES);

  const filtered = programmesList.filter((p) => {
    if (sectorFilter === 'pacs' && !p.sector.toLowerCase().includes('pacs') && !p.sector.toLowerCase().includes('banking')) return false;
    if (sectorFilter === 'dairy' && !p.sector.toLowerCase().includes('dairy')) return false;
    if (sectorFilter === 'governance' && !p.sector.toLowerCase().includes('multi-state') && !p.title.toLowerCase().includes('governance')) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q) ||
      p.institution_name.toLowerCase().includes(q)
    );
  });

  return (
    <ScrollScreen
      tab
      title="Programme Catalog"
      subtitle="Cooperative executive training and certification programmes."
      sticky={
        <>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search programmes by keyword or sector"
          />
          <PillTabs tabs={SECTOR_TABS} active={sectorFilter} onChange={setSectorFilter} />
        </>
      }
    >
      <View style={styles.list}>
        {filtered.map((item) => {
          const seatsAvailable = Math.max(0, item.seats_total - item.seats_filled);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('ProgrammeDetail', { programmeId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.badgeRow}>
                <Badge label={item.sector} variant="primary" />
                <Badge label={item.level} variant="neutral" />
              </View>

              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.institutionRow}>
                <Building2 size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.institutionText}>{item.institution_name}</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Clock size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.metricText}>{item.duration_weeks} Wks ({item.duration_hours}h)</Text>
                </View>
                <View style={styles.metricItem}>
                  <Users size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.metricText}>{seatsAvailable} seats available</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.dateCol}>
                  <Calendar size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.dateText}>Starts {item.start_date}</Text>
                </View>
                <View style={styles.viewLink}>
                  <Text style={styles.viewText}>View Curriculum</Text>
                  <ChevronRight size={ICON.sm} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: SPACE.md,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  title: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    lineHeight: 22,
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
  metricsRow: {
    flexDirection: 'row',
    gap: SPACE.md,
    paddingVertical: 2,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.xs + 2,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
});
