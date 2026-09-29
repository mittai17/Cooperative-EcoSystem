import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { COLORS, CARD, HIT, ICON, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { HeaderIconButton } from '../components/AppHeader';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { ProgressRing } from '../components/ProgressRing';
import { ProgressBar } from '../components/ProgressBar';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { formatDate } from '../services/utils';
import { Award, Share2, ChevronRight, ChevronDown, ChevronUp, FileCheck } from 'lucide-react-native';
import { SkillPassportData, SkillPassportItem } from '../types';

export const SkillPassportScreen = ({ navigation }: any) => {
  const [passport, setPassport] = useState<SkillPassportData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getSkillPassport();
      setPassport(res.passport);
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    }
  }, []);

  useOnMount(load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const skills = passport?.skills ?? [];
  const verified = skills.filter((s) => s.verified);
  const summary = passport?.summary ?? {
    total_skills: skills.length,
    verified_count: verified.length,
    avg_confidence: skills.length ? skills.reduce((a, s) => a + s.confidence, 0) / skills.length : 0,
  };
  const evidenceCount = skills.reduce((acc, s) => acc + (s.evidence?.length || 0), 0);

  const handleShare = async () => {
    const lines = skills.map((s) => `${s.name} (${s.level}${s.verified ? ', verified' : ''})`);
    try {
      await Share.share({
        title: 'Cooperative Skill Passport',
        message: `Cooperative Skill Passport: ${summary.verified_count} of ${summary.total_skills} skills verified.\n${lines.join('\n')}`,
      });
    } catch {
      Alert.alert('Share', 'Unable to open the share sheet.');
    }
  };

  return (
    <ScrollScreen
      title="Skill passport"
      onBack={() => navigation.goBack()}
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightAction={
        skills.length > 0 ? (
          <HeaderIconButton onPress={handleShare} label="Share skill passport">
            <Share2 size={ICON.lg} color={COLORS.primary} />
          </HeaderIconButton>
        ) : undefined
      }
    >
      {passport === null ? <LoadingState /> : null}

      {passport !== null && skills.length === 0 ? (
        <EmptyState
          title="No skills recorded yet"
          message="Skills appear here after you complete courses and assessments."
        />
      ) : null}

      {passport !== null && skills.length > 0 ? (
        <>
          <View style={styles.summaryCard}>
            <ProgressRing value={summary.avg_confidence} size={112} strokeWidth={10} label="Strength" />
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{summary.total_skills}</Text>
                <Text style={styles.caption}>Skills</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{summary.verified_count}</Text>
                <Text style={styles.caption}>Verified</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{evidenceCount}</Text>
                <Text style={styles.caption}>Evidence</Text>
              </View>
            </View>
          </View>

          <View>
            <SectionHeader title="Skills" />
            <View style={styles.list}>
              {skills.map((skill: SkillPassportItem) => {
                const isOpen = expanded === skill.name;
                return (
                  <View key={skill.name} style={styles.skillCard}>
                    <TouchableOpacity
                      style={styles.skillHeader}
                      onPress={() => setExpanded(isOpen ? null : skill.name)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: isOpen }}
                      accessibilityLabel={`${skill.name}, ${skill.level}, ${Math.round(skill.confidence)}%, ${
                        skill.verified ? 'verified' : 'self assessed'
                      }`}
                    >
                      <View style={styles.flex}>
                        <Text style={styles.bodyStrong}>{skill.name}</Text>
                        <Text style={styles.caption}>
                          {skill.category} · {skill.level}
                        </Text>
                        <View style={styles.badgeRow}>
                          {skill.verified ? (
                            <Badge label="Verified" variant="success" verified />
                          ) : (
                            <Badge label="Self assessed" />
                          )}
                        </View>
                      </View>
                      <Text style={styles.confidence}>{Math.round(skill.confidence)}%</Text>
                      {isOpen ? (
                        <ChevronUp size={ICON.md} color={COLORS.textSecondary} />
                      ) : (
                        <ChevronDown size={ICON.md} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.barWrap}>
                      <ProgressBar value={skill.confidence} />
                    </View>

                    {isOpen ? (
                      <View style={styles.evidence}>
                        <Text style={styles.captionStrong}>Evidence</Text>
                        {skill.evidence && skill.evidence.length > 0 ? (
                          skill.evidence.map((ev, i) => (
                            <View key={`${ev.title}-${i}`} style={styles.evidenceRow}>
                              <FileCheck size={ICON.sm} color={COLORS.primary} />
                              <View style={styles.flex}>
                                <Text style={styles.body}>{ev.title}</Text>
                                <Text style={styles.caption}>
                                  {ev.type} · {formatDate(ev.date)}
                                </Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.caption}>No evidence linked yet.</Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={styles.linkCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Certificates')}
            accessibilityRole="button"
            accessibilityLabel="Open certificates"
          >
            <Award size={ICON.md} color={COLORS.primary} />
            <Text style={styles.linkTitle}>Certificates</Text>
            <ChevronRight size={ICON.md} color={COLORS.textMuted} />
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  caption: { ...TEXT.caption },
  captionStrong: { ...TEXT.captionStrong },
  body: { ...TEXT.body },
  bodyStrong: { ...TEXT.bodyStrong },
  summaryCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  metrics: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  metric: { alignItems: 'center', gap: 2 },
  metricVal: { ...TEXT.title },
  list: { gap: SPACE.sm },
  skillCard: { ...CARD, overflow: 'hidden' },
  skillHeader: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  badgeRow: { flexDirection: 'row', marginTop: SPACE.xs },
  confidence: { ...TEXT.bodyStrong, color: COLORS.primary },
  barWrap: { paddingHorizontal: SPACE.md, paddingBottom: SPACE.md },
  evidence: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  evidenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  linkCard: {
    ...CARD,
    minHeight: HIT + SPACE.md,
    paddingHorizontal: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md - SPACE.xs,
  },
  linkTitle: { flex: 1, ...TEXT.bodyStrong },
});
