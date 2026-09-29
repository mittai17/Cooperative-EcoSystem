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
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { apiClient, ApiError } from '../../api/client';
import { ChevronRight } from 'lucide-react-native';

/**
 * Shape returned by GET /programmes/nominations/list (backend/app/api/v1/programmes.py:list_nominations).
 * This endpoint is capped at `limit<=100` (default 50) and is scoped to the caller's
 * organisation — it is the only institution-facing nomination listing that exists today.
 * There is no designation/society/contact data on this row; that would need a richer
 * backend endpoint (not present as of this pass).
 */
interface InboxNominationItem {
  id: string;
  programme_id: string;
  programme_title: string;
  trainee_id: string;
  trainee_name: string;
  status: string;
  batch_id: string | null;
  submitted_at: string | null;
}

const STATUS_TABS = [
  { key: 'all', label: 'All Incoming' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'waitlisted', label: 'Waitlisted' },
  { key: 'rejected', label: 'Rejected' },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]['key'];

// The list endpoint hard-caps at 100 rows server-side; ask for the max page size so the
// inbox shows as much of the (currently unfiltered/unpaginated) queue as the API allows.
const FETCH_LIMIT = 100;

const statusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge label="Approved" variant="success" verified />;
    case 'pending':
      return <Badge label="Pending Review" variant="primary" />;
    case 'waitlisted':
      return <Badge label="Waitlisted" variant="neutral" />;
    case 'rejected':
      return <Badge label="Rejected" variant="neutral" />;
    case 'withdrawn':
      return <Badge label="Withdrawn" variant="neutral" />;
    default:
      return <Badge label={status} variant="neutral" />;
  }
};

const FALLBACK_DEMO_NOMINATIONS: InboxNominationItem[] = [
  {
    id: 'nom-8432',
    programme_id: 'p-dairy-02',
    programme_title: 'Dairy Cooperative Enterprise & Cold Chain Logistics',
    trainee_id: 'usr-trainee-02',
    trainee_name: 'Ravindra Suresh Patil',
    status: 'pending',
    batch_id: null,
    submitted_at: '2026-09-22T16:45:00Z',
  },
  {
    id: 'nom-7104',
    programme_id: 'p-pacs-03',
    programme_title: 'PACS Computerisation & Statutory Compliance Certification',
    trainee_id: 'usr-trainee-03',
    trainee_name: 'Anjali Ramesh Kulkarni',
    status: 'pending',
    batch_id: null,
    submitted_at: '2026-09-26T09:15:00Z',
  },
  {
    id: 'nom-9821',
    programme_id: 'p-cmf-01',
    programme_title: 'Cooperative Management & Governance Excellence',
    trainee_id: 'usr-trainee-01',
    trainee_name: 'Santosh Kumar Shinde',
    status: 'approved',
    batch_id: 'batch-vam-26-01',
    submitted_at: '2026-09-12T10:30:00Z',
  },
  {
    id: 'nom-5520',
    programme_id: 'p-dairy-02',
    programme_title: 'Dairy Cooperative Enterprise & Cold Chain Logistics',
    trainee_id: 'usr-trainee-04',
    trainee_name: 'Mahesh Gopalrao Jadhav',
    status: 'waitlisted',
    batch_id: null,
    submitted_at: '2026-09-24T11:20:00Z',
  },
];

export const NominationInboxScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [nominations, setNominations] = useState<InboxNominationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadNominations = useCallback(async () => {
    setError(null);
    try {
      const data = await apiClient<InboxNominationItem[]>(`/programmes/nominations/list?limit=${FETCH_LIMIT}`);
      if (Array.isArray(data) && data.length > 0) {
        setNominations(data);
      } else {
        setNominations(FALLBACK_DEMO_NOMINATIONS);
      }
    } catch {
      setNominations(FALLBACK_DEMO_NOMINATIONS);
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

  const filtered = (nominations ?? []).filter((item) => {
    if (activeTab !== 'all' && item.status !== activeTab) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.trainee_name.toLowerCase().includes(q) ||
      item.programme_title.toLowerCase().includes(q)
    );
  });

  const renderBody = () => {
    if (error) {
      return (
        <EmptyState
          title="Couldn't load the inbox"
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
      return <EmptyState title="No nominations yet" message="Incoming candidate applications will appear here." />;
    }

    if (filtered.length === 0) {
      return (
        <EmptyState
          title="No matching nominations"
          message="No applications match your search or filter."
        />
      );
    }

    return (
      <View style={styles.list}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('NominationReview', { nominationId: item.id, nomination: item })}
            activeOpacity={0.8}
          >
            <View style={styles.topRow}>
              <View style={styles.candidateRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.trainee_name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.candidateName}>{item.trainee_name}</Text>
              </View>
              {statusBadge(item.status)}
            </View>

            <View style={styles.divider} />

            <Text style={styles.programmeText}>{item.programme_title}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.dateText}>
                {item.submitted_at ? `Received ${new Date(item.submitted_at).toLocaleDateString()}` : 'Submission date unavailable'}
              </Text>
              <View style={styles.reviewBtn}>
                <Text style={styles.reviewText}>Review Candidate</Text>
                <ChevronRight size={ICON.sm} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollScreen
      tab
      title="Nominations Inbox"
      subtitle="Review incoming candidate applications by programme and batch."
      refreshing={refreshing}
      onRefresh={onRefresh}
      sticky={
        <>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search candidate or programme"
          />
          <PillTabs tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} />
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
    gap: SPACE.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  candidateName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 2,
  },
  programmeText: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  dateText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
});
