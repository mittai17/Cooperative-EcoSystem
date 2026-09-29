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
import { MOCK_USER_NOMINATIONS, NominationRecord } from './mockData';
import { apiClient } from '../../api/client';
import {
  Calendar,
  Building,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Hourglass,
} from 'lucide-react-native';

type NominationFilter = 'all' | 'submitted' | 'under_review' | 'approved' | 'waitlisted';

const FILTER_TABS: readonly { key: NominationFilter; label: string }[] = [
  { key: 'all', label: 'All Nominations' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'waitlisted', label: 'Waitlisted' },
];

export const MyNominationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [nominations, setNominations] = useState<NominationRecord[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NominationFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadNominations = useCallback(async () => {
    try {
      const data = await apiClient<any[]>('/programmes/nominations/my');
      if (Array.isArray(data) && data.length > 0) {
        // Map backend rows into our rich record format
        const mapped: NominationRecord[] = data.map((item, index) => {
          const fallback = MOCK_USER_NOMINATIONS[index % MOCK_USER_NOMINATIONS.length];
          return {
            id: item.id || `nom-${index}`,
            programme_id: item.programme_id || fallback.programme_id,
            programme_title: item.programme_title || fallback.programme_title,
            institution_name: fallback.institution_name,
            trainee_id: fallback.trainee_id,
            trainee_name: fallback.trainee_name,
            trainee_email: fallback.trainee_email,
            trainee_phone: fallback.trainee_phone,
            designation: fallback.designation,
            nomination_type: fallback.nomination_type,
            society_name: fallback.society_name,
            society_registration_no: fallback.society_registration_no,
            justification: fallback.justification,
            status: item.status || fallback.status,
            batch_id: item.batch_id || fallback.batch_id,
            batch_name: fallback.batch_name,
            start_date: fallback.start_date,
            end_date: fallback.end_date,
            submitted_at: item.submitted_at || fallback.submitted_at,
            decision_note: item.decision_note || fallback.decision_note,
            room_allocated: fallback.room_allocated,
          };
        });
        setNominations(mapped);
      } else {
        setNominations(MOCK_USER_NOMINATIONS);
      }
    } catch {
      setNominations(MOCK_USER_NOMINATIONS);
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

  const getStatusBadge = (status: NominationRecord['status']) => {
    switch (status) {
      case 'approved':
        return <Badge label="Approved & Enrolled" variant="success" verified />;
      case 'under_review':
        return <Badge label="Under Scrutiny" variant="primary" />;
      case 'submitted':
        return <Badge label="Submitted" variant="neutral" />;
      case 'waitlisted':
        return <Badge label="Waitlisted" variant="neutral" />;
      case 'rejected':
        return <Badge label="Rejected" variant="neutral" />;
      default:
        return <Badge label={status.toUpperCase()} variant="neutral" />;
    }
  };

  const q = search.trim().toLowerCase();
  const filteredList = (nominations ?? []).filter((item) => {
    if (filter === 'submitted' && item.status !== 'submitted') return false;
    if (filter === 'under_review' && item.status !== 'under_review') return false;
    if (filter === 'approved' && item.status !== 'approved') return false;
    if (filter === 'waitlisted' && item.status !== 'waitlisted') return false;

    if (!q) return true;
    return (
      item.programme_title.toLowerCase().includes(q) ||
      item.institution_name.toLowerCase().includes(q) ||
      (item.society_name && item.society_name.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q)
    );
  });

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
            placeholder="Search by programme, institution or ID"
          />
          <PillTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />
        </>
      }
    >
      {nominations === null ? (
        <LoadingState />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No nominations found"
          message={
            search
              ? 'No applications match your search query.'
              : `You have no ${filter === 'all' ? '' : filter} nomination applications at this time.`
          }
          actionLabel="Browse Programmes"
          onAction={() => navigation.navigate('ProgrammeDetail', { programmeId: 'p-cmf-01' })}
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredList.map((item) => {
            const isApproved = item.status === 'approved';
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.nominationCard, isApproved && styles.nominationCardApproved]}
                onPress={() => navigation.navigate('NominationDetail', { nominationId: item.id })}
                activeOpacity={0.8}
              >
                {/* Header row: ID & Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.idChip}>
                    <FileText size={ICON.sm} color={COLORS.textSecondary} />
                    <Text style={styles.idText}>{item.id.toUpperCase()}</Text>
                  </View>
                  {getStatusBadge(item.status)}
                </View>

                {/* Title */}
                <Text style={styles.programmeTitle}>{item.programme_title}</Text>

                {/* Institution & Society */}
                <View style={styles.metaBlock}>
                  <View style={styles.metaRow}>
                    <Building size={ICON.sm} color={COLORS.primary} />
                    <Text style={styles.metaText}>{item.institution_name}</Text>
                  </View>
                  {item.society_name ? (
                    <Text style={styles.societyText}>Sponsoring: {item.society_name}</Text>
                  ) : null}
                </View>

                {/* Dates / Batch row */}
                <View style={styles.datesRow}>
                  {item.start_date && item.end_date ? (
                    <View style={styles.dateCol}>
                      <Calendar size={ICON.sm} color={COLORS.textMuted} />
                      <Text style={styles.dateText}>
                        {item.start_date} to {item.end_date}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.dateCol}>
                      <Clock size={ICON.sm} color={COLORS.textMuted} />
                      <Text style={styles.dateText}>
                        Applied on {new Date(item.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {item.batch_name && (
                    <View style={styles.batchPill}>
                      <Text style={styles.batchText}>{item.batch_name}</Text>
                    </View>
                  )}
                </View>

                {/* Decision note preview if exists */}
                {item.decision_note ? (
                  <View style={styles.notePreview}>
                    <Text style={styles.noteLabel}>Review Note:</Text>
                    <Text style={styles.noteText} numberOfLines={2}>
                      {item.decision_note}
                    </Text>
                  </View>
                ) : null}

                {/* Bottom link */}
                <View style={styles.cardFooter}>
                  <Text style={styles.detailLinkText}>View Status & Timeline</Text>
                  <ChevronRight size={ICON.sm} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  metaBlock: {
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  metaText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  societyText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
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
  batchPill: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACE.xs + 4,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  batchText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
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
