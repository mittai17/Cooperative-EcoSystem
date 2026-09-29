import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SearchField } from '../../components/SearchField';
import { PillTabs } from '../../components/PillTabs';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingState } from '../../components/EmptyState';
import { COLORS, SPACE, TEXT, CARD, ICON } from '../../constants/theme';
import { apiClient, ApiError } from '../../api/client';
import { Users, Clock, ChevronRight } from 'lucide-react-native';

const SECTOR_TABS = [
  { key: 'all', label: 'All Sectors' },
  { key: 'pacs', label: 'PACS & Credit' },
  { key: 'dairy', label: 'Dairy & Livestock' },
  { key: 'governance', label: 'Management' },
] as const;

type SectorTab = (typeof SECTOR_TABS)[number]['key'];

/** Shape actually returned by GET /programmes/ (backend/app/api/v1/programmes.py:list_programmes) */
interface ProgrammeListItem {
  id: string;
  title: string;
  sector: string | null;
  level: string | null;
  mode: string | null;
  duration_weeks: number | null;
  seats_total: number | null;
  seats_filled: number | null;
}

// The list endpoint has no server-side max limit but defaults to 20; request a
// large page so client-side search/sector filtering has the full catalog to work with.
const FETCH_LIMIT = 500;

export const ProgrammeCatalogScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<SectorTab>('all');
  const [programmes, setProgrammes] = useState<ProgrammeListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgrammes = useCallback(async () => {
    setError(null);
    try {
      const data = await apiClient<ProgrammeListItem[]>(`/programmes/?limit=${FETCH_LIMIT}`);
      setProgrammes(Array.isArray(data) ? data : []);
    } catch (err) {
      setProgrammes(null);
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProgrammes();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProgrammes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgrammes();
    setRefreshing(false);
  };

  const filtered = (programmes ?? []).filter((p) => {
    const sector = (p.sector ?? '').toLowerCase();
    const title = (p.title ?? '').toLowerCase();
    if (sectorFilter === 'pacs' && !sector.includes('pacs') && !sector.includes('banking') && !sector.includes('credit')) return false;
    if (sectorFilter === 'dairy' && !sector.includes('dairy')) return false;
    if (sectorFilter === 'governance' && !sector.includes('multi-state') && !sector.includes('governance') && !title.includes('governance')) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return title.includes(q) || sector.includes(q);
  });

  const renderBody = () => {
    if (error) {
      return (
        <EmptyState
          title="Couldn't load programmes"
          message={error}
          actionLabel="Retry"
          onAction={loadProgrammes}
        />
      );
    }

    if (programmes === null) {
      return <LoadingState />;
    }

    if (programmes.length === 0) {
      return <EmptyState title="No programmes available" message="Check back later for new cooperative training programmes." />;
    }

    if (filtered.length === 0) {
      return (
        <EmptyState
          title="No matching programmes"
          message="No programmes match your search or filter. Try a different keyword or sector."
        />
      );
    }

    return (
      <View style={styles.list}>
        {filtered.map((item) => {
          const seatsTotal = item.seats_total ?? 0;
          const seatsFilled = item.seats_filled ?? 0;
          const seatsAvailable = Math.max(0, seatsTotal - seatsFilled);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('ProgrammeDetail', { programmeId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.badgeRow}>
                {item.sector ? <Badge label={item.sector} variant="primary" /> : null}
                {item.level ? <Badge label={item.level} variant="neutral" /> : null}
                {item.mode ? <Badge label={item.mode} variant="neutral" /> : null}
              </View>

              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.metricsRow}>
                {item.duration_weeks != null ? (
                  <View style={styles.metricItem}>
                    <Clock size={ICON.sm} color={COLORS.textMuted} />
                    <Text style={styles.metricText}>{item.duration_weeks} Wks</Text>
                  </View>
                ) : null}
                <View style={styles.metricItem}>
                  <Users size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.metricText}>
                    {seatsTotal > 0 ? `${seatsAvailable} seats available` : 'Seats TBD'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.viewLink}>
                  <Text style={styles.viewText}>View Curriculum</Text>
                  <ChevronRight size={ICON.sm} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollScreen
      tab
      title="Programme Catalog"
      subtitle="Cooperative executive training and certification programmes."
      refreshing={refreshing}
      onRefresh={onRefresh}
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
      {renderBody()}
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
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  title: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    color: COLORS.primaryDark,
    lineHeight: 22,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.xs + 2,
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
