import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { PillTabs } from '../../components/PillTabs';
import { SearchField } from '../../components/SearchField';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingState } from '../../components/EmptyState';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { apiClient, ApiError } from '../../api/client';
import {
  ChevronRight,
  FileText,
  Layers,
} from 'lucide-react-native';

/** Shape returned by GET /programmes/nominations/my (backend/app/api/v1/programmes.py:my_nominations). */
interface MyNominationItem {
  id: string;
  programme_id: string;
  programme_title: string;
  status: string;
  batch_id: string | null;
  decision_note: string | null;
}

/** Extra, real fields pulled from GET /programmes/{id} to give each card a bit more
 * context than the bare nomination row has (sector/level/mode). Purely additive —
 * if this fetch fails for a programme we just render the card without the extras. */
interface ProgrammeContext {
  sector: string | null;
  level: string | null;
  mode: string | null;
}

type NominationFilter = 'all' | 'pending' | 'approved' | 'waitlisted' | 'rejected' | 'withdrawn';

const FILTER_TABS: readonly { key: NominationFilter; label: string }[] = [
  { key: 'all', label: 'All Nominations' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'waitlisted', label: 'Waitlisted' },
  { key: 'rejected', label: 'Rejected' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge label="Approved & Enrolled" variant="success" verified />;
    case 'pending':
      return <Badge label="Pending Review" variant="primary" />;
    case 'waitlisted':
      return <Badge label="Waitlisted" variant="neutral" />;
    case 'rejected':
      return <Badge label="Rejected" variant="neutral" />;
    case 'withdrawn':
      return <Badge label="Withdrawn" variant="neutral" />;
    default:
      return <Badge label={status.toUpperCase()} variant="neutral" />;
  }
};

export const MyNominationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nominations, setNominations] = useState<MyNominationItem[] | null>(null);
  const [programmeContext, setProgrammeContext] = useState<Record<string, ProgrammeContext>>({});
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NominationFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadNominations = useCallback(async () => {
    setError(null);
    try {
      const data = await apiClient<MyNominationItem[]>('/programmes/nominations/my');
      const rows = Array.isArray(data) ? data : [];
      setNominations(rows);

      // Best-effort enrichment: fetch real sector/level/mode per unique programme.
      // Never falls back to mock data — a failed fetch just leaves that programme's
      // context blank and the card renders without those badges.
      const uniqueIds = Array.from(new Set(rows.map((r) => r.programme_id).filter(Boolean)));
      if (uniqueIds.length > 0) {
        const results = await Promise.allSettled(
          uniqueIds.map((id) => apiClient<any>(`/programmes/${id}`))
        );
        const contextMap: Record<string, ProgrammeContext> = {};
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value) {
            contextMap[uniqueIds[idx]] = {
              sector: result.value.sector ?? null,
              level: result.value.level ?? null,
              mode: result.value.mode ?? null,
            };
          }
        });
        setProgrammeContext(contextMap);
      } else {
        setProgrammeContext({});
      }
    } catch (err) {
      setNominations(null);
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNominations();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadNominations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNominations();
    setRefreshing(false);
  };

  const q = search.trim().toLowerCase();
  const filteredList = (nominations ?? []).filter((item) => {
    if (filter !== 'all' && item.status !== filter) return false;

    if (!q) return true;
    return (
      item.programme_title.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const renderBody = () => {
    if (error) {
      return (
        <EmptyState
          title="Couldn't load your nominations"
          message={error}
          actionLabel="Retry"
          onAction={loadNominations}
        />
      );
    }

    if (nominations === null) {
      return <LoadingState />;
    }

    if (nominations.length === 0) {
      return (
        <EmptyState
          title="No nominations found"
          message="You have no nomination applications yet. Your sponsoring society or institution can submit one on your behalf."
        />
      );
    }

    if (filteredList.length === 0) {
      return (
        <EmptyState
          title="No nominations found"
          message={
            search
              ? 'No applications match your search query.'
              : `You have no ${filter === 'all' ? '' : filter} nomination applications at this time.`
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setFilter('all');
          }}
        />
      );
    }

    return (
      <View style={styles.listContainer}>
        {filteredList.map((item) => {
          const isApproved = item.status === 'approved';
          const context = programmeContext[item.programme_id];
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.nominationCard, isApproved && styles.nominationCardApproved]}
              onPress={() => navigation.navigate('NominationDetail', { nominationId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.idChip}>
                  <FileText size={ICON.sm} color={COLORS.textSecondary} />
                  <Text style={styles.idText}>{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                {getStatusBadge(item.status)}
              </View>

              <Text style={styles.programmeTitle}>{item.programme_title}</Text>

              {context && (context.sector || context.level || context.mode) ? (
                <View style={styles.contextRow}>
                  {context.sector ? <Text style={styles.contextPill}>{context.sector}</Text> : null}
                  {context.level ? <Text style={styles.contextPill}>{context.level}</Text> : null}
                  {context.mode ? <Text style={styles.contextPill}>{context.mode}</Text> : null}
                </View>
              ) : null}

              {item.batch_id ? (
                <View style={styles.metaRow}>
                  <Layers size={ICON.sm} color={COLORS.primary} />
                  <Text style={styles.metaText}>Batch assigned</Text>
                </View>
              ) : null}

              {item.decision_note ? (
                <View style={styles.notePreview}>
                  <Text style={styles.noteLabel}>Review Note:</Text>
                  <Text style={styles.noteText} numberOfLines={2}>
                    {item.decision_note}
                  </Text>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.detailLinkText}>View Status & Timeline</Text>
                <ChevronRight size={ICON.sm} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollScreen
      title="My Nominations"
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={onRefresh}
      sticky={
        <>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search by programme or ID"
          />
          <PillTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />
        </>
      }
    >
      {renderBody()}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: SPACE.md,
  },
  nominationCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    backgroundColor: COLORS.card,
  },
  nominationCardApproved: {
    borderColor: COLORS.primaryBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    borderRadius: RADII.sm,
  },
  idText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  programmeTitle: {
    ...TEXT.bodyStrong,
    fontSize: 15,
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  contextPill: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  metaText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 12,
  },
  notePreview: {
    backgroundColor: COLORS.surface,
    padding: SPACE.xs + 4,
    borderRadius: RADII.sm,
    gap: 2,
  },
  noteLabel: {
    ...TEXT.captionStrong,
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  noteText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingTop: 4,
  },
  detailLinkText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
});
