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
import { MOCK_USER_NOMINATIONS, NominationRecord } from './mockData';
import { User, Building, ChevronRight, FileCheck, Clock, CheckCircle } from 'lucide-react-native';

const STATUS_TABS = [
  { key: 'all', label: 'All Incoming' },
  { key: 'under_review', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'submitted', label: 'New Submissions' },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]['key'];

export const NominationInboxScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('all');

  const filtered = MOCK_USER_NOMINATIONS.filter((item) => {
    if (activeTab === 'under_review' && item.status !== 'under_review') return false;
    if (activeTab === 'approved' && item.status !== 'approved') return false;
    if (activeTab === 'submitted' && item.status !== 'submitted') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.trainee_name.toLowerCase().includes(q) ||
      item.programme_title.toLowerCase().includes(q) ||
      (item.society_name && item.society_name.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollScreen
      tab
      title="Nominations Inbox"
      subtitle="Review incoming candidate applications by programme and batch."
      sticky={
        <>
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search candidate, society, or programme"
          />
          <PillTabs tabs={STATUS_TABS} active={activeTab} onChange={setActiveTab} />
        </>
      }
    >
      <View style={styles.list}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('NominationReview', { nominationId: item.id })}
            activeOpacity={0.8}
          >
            <View style={styles.topRow}>
              <View style={styles.candidateRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.trainee_name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.candidateName}>{item.trainee_name}</Text>
                  <Text style={styles.designationText}>{item.designation}</Text>
                </View>
              </View>
              {item.status === 'approved' ? (
                <Badge label="Approved" variant="success" verified />
              ) : item.status === 'under_review' ? (
                <Badge label="Pending Review" variant="primary" />
              ) : (
                <Badge label="New Submission" variant="neutral" />
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.societyRow}>
              <Building size={ICON.sm} color={COLORS.textSecondary} />
              <Text style={styles.societyText}>
                {item.society_name || 'Individual Applicant (Self-Nominated)'}
              </Text>
            </View>

            <Text style={styles.programmeText}>{item.programme_title}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.dateText}>
                Received {new Date(item.submitted_at).toLocaleDateString()}
              </Text>
              <View style={styles.reviewBtn}>
                <Text style={styles.reviewText}>Review Candidate</Text>
                <ChevronRight size={ICON.sm} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  designationText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 2,
  },
  societyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  societyText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
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
