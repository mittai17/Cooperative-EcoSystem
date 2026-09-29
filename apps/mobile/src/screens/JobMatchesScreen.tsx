import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, CARD, HIT, ICON, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { PillTabs } from '../components/PillTabs';
import { SearchField } from '../components/SearchField';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { IconChip } from '../components/IconChip';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { plural } from '../services/utils';
import { Briefcase, MapPin, CheckCircle2, Send, Heart } from 'lucide-react-native';
import { JobMatch } from '../types';

type JobFilter = 'all' | 'best' | 'saved';

const FILTER_TABS: readonly { key: JobFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'best', label: 'Best match' },
  { key: 'saved', label: 'Saved' },
];

const BEST_MATCH_MIN = 80;

export const JobMatchesScreen = () => {
  const [jobs, setJobs] = useState<JobMatch[] | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<JobFilter>('all');
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getJobs();
      setJobs(res.jobs);
      setIsLive(res.isLive);
    } catch {
      setJobs((prev) => prev ?? []);
      setIsLive(false);
    }
  }, []);

  useOnMount(load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const submitApplication = async (job: JobMatch) => {
    setApplying(job.id);
    setErrors((prev) => ({ ...prev, [job.id]: '' }));
    const res = await apiService.applyToJob(job.id);
    setApplying(null);
    if (res.success) {
      setApplied((prev) => ({ ...prev, [job.id]: true }));
    } else {
      setErrors((prev) => ({ ...prev, [job.id]: res.message }));
    }
  };

  const confirmApply = (job: JobMatch) => {
    Alert.alert('Apply', `Send your application for "${job.title}" to ${job.employer}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => submitApplication(job) },
    ]);
  };

  const toggleSaved = (id: string) => setSaved((prev) => ({ ...prev, [id]: !prev[id] }));

  const q = query.trim().toLowerCase();
  const filtered = (jobs ?? []).filter((j) => {
    if (filter === 'best' && (j.match_percentage ?? 0) < BEST_MATCH_MIN) return false;
    if (filter === 'saved' && !saved[j.id]) return false;
    return (
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.employer.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.skills_required.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollScreen
      tab
      title="Jobs"
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
      sticky={
        <>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search role, employer or skill" />
          <PillTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />
        </>
      }
    >
      {jobs === null ? <LoadingState /> : null}

      {jobs !== null && filtered.length === 0 ? (
        <EmptyState
          title="No jobs found"
          message={
            filter === 'saved' && !q
              ? 'Tap the heart on a job to save it.'
              : filter === 'best' && !q
                ? `No jobs match your skills at ${BEST_MATCH_MIN}% or more.`
                : 'Try a different filter or search term.'
          }
        />
      ) : null}

      {filtered.map((job) => {
        const hasApplied = applied[job.id] ?? !!job.applied;
        const isSaved = !!saved[job.id];
        const isBusy = applying === job.id;
        const facts = [job.salary, typeof job.openings === 'number' ? plural(job.openings, 'opening') : '']
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={job.id} style={styles.card}>
            <View style={styles.top}>
              <IconChip size={40}>
                <Briefcase size={ICON.md} color={COLORS.primary} />
              </IconChip>
              <View style={styles.flex}>
                <Text style={styles.title} numberOfLines={2}>
                  {job.title}
                </Text>
                <Text style={styles.caption} numberOfLines={2}>
                  {job.employer}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleSaved(job.id)}
                style={styles.saveBtn}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? `Remove ${job.title} from saved` : `Save ${job.title}`}
                accessibilityState={{ selected: isSaved }}
              >
                <Heart
                  size={ICON.md}
                  color={isSaved ? COLORS.primary : COLORS.textMuted}
                  fill={isSaved ? COLORS.primary : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {job.location ? (
              <View style={styles.metaRow}>
                <MapPin size={ICON.sm} color={COLORS.textMuted} />
                <Text style={styles.caption}>{job.location}</Text>
              </View>
            ) : null}
            {facts ? <Text style={styles.caption}>{facts}</Text> : null}

            {job.match_percentage !== undefined || job.skills_required.length > 0 ? (
              <View style={styles.tags}>
                {job.match_percentage !== undefined ? (
                  <Badge
                    label={`${job.match_percentage}% match`}
                    variant={job.match_percentage >= BEST_MATCH_MIN ? 'primary' : 'neutral'}
                  />
                ) : null}
                {job.skills_required.slice(0, 3).map((skill) => (
                  <Badge key={skill} label={skill} />
                ))}
              </View>
            ) : null}

            {hasApplied ? (
              <View style={styles.appliedRow}>
                <CheckCircle2 size={ICON.md} color={COLORS.success} />
                <Text style={styles.appliedText}>Application submitted</Text>
              </View>
            ) : (
              <Button
                label="Apply"
                icon={<Send size={ICON.md} color={COLORS.textInverse} />}
                loading={isBusy}
                onPress={() => confirmApply(job)}
                accessibilityLabel={`Apply for ${job.title}`}
              />
            )}
            {errors[job.id] ? (
              <Text style={styles.error} accessibilityRole="alert">
                {errors[job.id]}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { ...CARD, padding: SPACE.md, gap: SPACE.sm },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md - SPACE.xs },
  title: { ...TEXT.bodyStrong },
  caption: { ...TEXT.caption },
  saveBtn: {
    width: HIT,
    height: HIT,
    marginTop: -SPACE.sm - SPACE.xs,
    marginRight: -SPACE.sm - SPACE.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  appliedRow: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  appliedText: { ...TEXT.bodyStrong, color: COLORS.success },
  error: { ...TEXT.caption, color: COLORS.danger },
});
