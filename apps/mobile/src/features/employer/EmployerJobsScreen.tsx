import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  INITIAL_JOBS,
  CooperativeJob,
} from './employerData';
import {
  Briefcase,
  Users,
  MapPin,
  Plus,
  ChevronRight,
  Clock,
  Edit3,
  Calendar,
} from 'lucide-react-native';

export const EmployerJobsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<CooperativeJob[]>(INITIAL_JOBS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'open' | 'closed'>('all');

  const filteredJobs = jobs.filter((j) => {
    if (selectedFilter === 'all') return true;
    return j.status === selectedFilter;
  });

  return (
    <ScrollScreen
      title="Manage Openings"
      subtitle={`${jobs.length} cooperative vacancies posted`}
      tab
      rightAction={
        <TouchableOpacity
          style={styles.postJobBtn}
          onPress={() => navigation.navigate('JobEditor')}
        >
          <Plus size={ICON.sm} color={COLORS.textInverse} />
          <Text style={styles.postJobBtnText}>Post Job</Text>
        </TouchableOpacity>
      }
      sticky={
        <View style={styles.filterTabsRow}>
          {(['all', 'open', 'closed'] as const).map((filter) => {
            const active = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {filter === 'all' ? 'All Postings' : filter === 'open' ? 'Active' : 'Closed'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      }
    >
      <View style={styles.container}>
        {filteredJobs.length === 0 ? (
          <EmptyState
            title="No vacancies found"
            message="Post a new cooperative role to start receiving matched applications from NCCT institutes."
          />
        ) : (
          <View style={styles.jobsList}>
            {filteredJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobCardHeader}>
                  <View style={styles.titleWrap}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.jobSector}>{job.sector} • {job.type}</Text>
                  </View>
                  <Badge
                    label={job.status.toUpperCase()}
                    variant={job.status === 'open' ? 'success' : 'neutral'}
                  />
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{job.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{job.openings} Openings</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{job.salary}</Text>
                  </View>
                </View>

                {/* Skills tags preview */}
                <View style={styles.skillsRow}>
                  {job.skills_required.map((skill) => (
                    <View key={skill} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer Buttons */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('JobEditor', { jobId: job.id })}
                  >
                    <Edit3 size={14} color={COLORS.textSecondary} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewApplicantsBtn}
                    onPress={() => navigation.navigate('JobApplicants', { jobId: job.id })}
                  >
                    <Users size={14} color={COLORS.primary} />
                    <Text style={styles.viewApplicantsText}>
                      View Applicants ({job.applicants_count || 0})
                    </Text>
                    <ChevronRight size={ICON.sm} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  postJobBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.textInverse,
  },
  container: {
    padding: SPACE.md,
  },
  jobsList: {
    gap: SPACE.md,
  },
  jobCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  jobTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  jobSector: {
    ...TEXT.caption,
    color: COLORS.primary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  skillChip: {
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.badgeBorder,
  },
  skillChipText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACE.sm,
  },
  editBtnText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  viewApplicantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACE.sm,
  },
  viewApplicantsText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
});
