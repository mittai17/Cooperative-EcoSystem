import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  Briefcase,
  Search,
  MapPin,
  Building,
  CheckCircle2,
  Send,
  SlidersHorizontal,
} from 'lucide-react-native';
import { JobMatch } from '../types';

export const JobMatchesScreen = ({ navigation }: any) => {
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<{ [id: string]: boolean }>({});
  const [isLive, setIsLive] = useState(true);

  const loadJobs = async () => {
    setRefreshing(true);
    try {
      const res = await apiService.getJobs();
      setJobs(res.jobs);
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleApply = (job: JobMatch) => {
    Alert.alert(
      'Apply with Skill Passport',
      `Submit your verified credentials to ${job.employer} for "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Application',
          onPress: () => {
            setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
            Alert.alert('Application Submitted', 'Your verified Skill Passport and diploma transcript have been shared.');
          },
        },
      ]
    );
  };

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.employer.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.skills_required.some((s) => s.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Job Matches"
        subtitle="AI-Matched Cooperative Vacancies"
        isLive={isLive}
      />

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by role, cooperative, or skill..."
            placeholderTextColor={COLORS.textMuted}
            value={filterQuery}
            onChangeText={setFilterQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadJobs} colors={[COLORS.primary]} />}
      >
        {/* Match Overview Banner */}
        <View style={styles.overviewCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.overviewTitle}>Placement Pipeline Active</Text>
            <Text style={styles.overviewDesc}>
              Matches are computed against your verified VAMNICOM / NCCT Skill Passport competencies.
            </Text>
          </View>
          <View style={styles.activeJobsCountBadge}>
            <Text style={styles.activeJobsCountText}>{filtered.length}</Text>
            <Text style={styles.activeJobsCountSub}>Roles</Text>
          </View>
        </View>

        {filtered.map((job) => {
          const hasApplied = appliedJobs[job.id];
          const matchPercent = job.match_percentage || 80;

          return (
            <View key={job.id} style={styles.jobCard}>
              {/* Card Header */}
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <View style={styles.employerRow}>
                    <Building size={14} color={COLORS.textSecondary} />
                    <Text style={styles.jobEmployer}>{job.employer}</Text>
                  </View>
                </View>

                {/* Match percentage gauge */}
                <View
                  style={[
                    styles.matchScoreBadge,
                    matchPercent >= 80 ? styles.highMatch : styles.medMatch,
                  ]}
                >
                  <Text
                    style={[
                      styles.matchScoreText,
                      matchPercent >= 80 ? styles.highMatchText : styles.medMatchText,
                    ]}
                  >
                    {matchPercent}%
                  </Text>
                  <Text
                    style={[
                      styles.matchScoreLabel,
                      matchPercent >= 80 ? styles.highMatchText : styles.medMatchText,
                    ]}
                  >
                    Match
                  </Text>
                </View>
              </View>

              {/* Meta details */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MapPin size={13} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{job.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaText}>💰 {job.salary}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaText}>👥 {job.openings} openings</Text>
                </View>
              </View>

              {/* Required Skills Badges */}
              <View style={styles.skillsSection}>
                <Text style={styles.skillsSectionLabel}>Required Skills:</Text>
                <View style={styles.skillsChipsWrap}>
                  {job.skills_required.map((skill, idx) => (
                    <Badge key={idx} label={skill} variant="neutral" />
                  ))}
                </View>
              </View>

              {/* Action Button */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.applyButton, hasApplied && styles.appliedButton]}
                  onPress={() => !hasApplied && handleApply(job)}
                  disabled={hasApplied}
                  activeOpacity={0.8}
                >
                  {hasApplied ? (
                    <>
                      <CheckCircle2 size={16} color={COLORS.success} />
                      <Text style={styles.appliedButtonText}>Application Submitted</Text>
                    </>
                  ) : (
                    <>
                      <Send size={16} color="#FFFFFF" />
                      <Text style={styles.applyButtonText}>One-Click Apply (Passport)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  overviewCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  overviewDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  activeJobsCountBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeJobsCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activeJobsCountSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  jobEmployer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  matchScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  highMatch: {
    backgroundColor: COLORS.successSurface,
  },
  medMatch: {
    backgroundColor: COLORS.warningSurface,
  },
  highMatchText: {
    color: COLORS.success,
  },
  medMatchText: {
    color: COLORS.warning,
  },
  matchScoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  matchScoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  skillsSection: {
    gap: 6,
  },
  skillsSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  skillsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  appliedButton: {
    backgroundColor: COLORS.successSurface,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  appliedButtonText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
  },
});
