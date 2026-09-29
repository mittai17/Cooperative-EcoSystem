import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { IconChip } from '../../components/IconChip';
import { assessmentApi } from './assessmentApi';
import { AssessmentInfo } from './assessmentTypes';
import {
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Play,
  History,
} from 'lucide-react-native';

export const AssessmentIntroScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AssessmentIntro'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const assessmentId = route.params?.assessmentId || 'asmt-coop-001';

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await assessmentApi.getAssessment(assessmentId);
        if (mounted) {
          setAssessment(info);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [assessmentId]);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const attempt = await assessmentApi.startAttempt(assessmentId);
      setStarting(false);
      navigation.navigate('AssessmentAttempt', { attemptId: attempt.attempt_id });
    } catch {
      setStarting(false);
      Alert.alert(
        'Unable to Start',
        'Could not begin the assessment. Please ensure you have a stable network connection and try again.'
      );
    }
  };

  return (
    <ScrollScreen
      title="Knowledge Assessment"
      subtitle="Evaluation & Skill Verification"
      onBack={() => navigation.goBack()}
    >
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading assessment details...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.badgeRow}>
              <Badge label="NCCT Certified" variant="primary" />
              <Badge label="Mandatory Exam" variant="neutral" />
            </View>
            <Text style={styles.title}>{assessment?.title || 'Cooperative Governance & Auditing'}</Text>
            {assessment?.skill_name ? (
              <View style={styles.skillTag}>
                <Award size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.skillText}>Grants Skill: {assessment.skill_name}</Text>
              </View>
            ) : null}
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <IconChip size={36} tint={COLORS.primarySurface}>
                <Clock size={ICON.md} color={COLORS.primary} />
              </IconChip>
              <Text style={styles.metricValue}>{assessment?.duration_minutes || 30}m</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>

            <View style={styles.metricCard}>
              <IconChip size={36} tint={COLORS.surface}>
                <HelpCircle size={ICON.md} color={COLORS.textSecondary} />
              </IconChip>
              <Text style={styles.metricValue}>{assessment?.questions || 10}</Text>
              <Text style={styles.metricLabel}>Questions</Text>
            </View>

            <View style={styles.metricCard}>
              <IconChip size={36} tint={COLORS.successSurface}>
                <Award size={ICON.md} color={COLORS.success} />
              </IconChip>
              <Text style={styles.metricValue}>{assessment?.passing_score || 60}%</Text>
              <Text style={styles.metricLabel}>Pass Mark</Text>
            </View>

            <View style={styles.metricCard}>
              <IconChip size={36} tint={COLORS.badgeBg}>
                <History size={ICON.md} color={COLORS.textPrimary} />
              </IconChip>
              <Text style={styles.metricValue}>{assessment?.max_attempts || 3}</Text>
              <Text style={styles.metricLabel}>Attempts</Text>
            </View>
          </View>

          {/* Instructions and Rules */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <FileText size={ICON.md} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Examination Guidelines</Text>
            </View>
            {(assessment?.instructions || []).map((instruction, idx) => (
              <View key={idx} style={styles.ruleRow}>
                <CheckCircle2 size={ICON.sm} color={COLORS.primary} style={styles.ruleBullet} />
                <Text style={styles.ruleText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Anti-Cheating & Proctored Notice */}
          <View style={styles.noticeCard}>
            <ShieldCheck size={ICON.lg} color={COLORS.primary} />
            <View style={styles.noticeTextWrapper}>
              <Text style={styles.noticeTitle}>Server-Timed Assessment</Text>
              <Text style={styles.noticeBody}>
                Questions are uniquely randomized and server-evaluated. Answers are auto-saved in real time.
                Timer runs continuously once started.
              </Text>
            </View>
          </View>

          {/* Start CTA */}
          <View style={styles.actionBox}>
            <Button
              label={starting ? 'Initializing Attempt...' : 'Start Assessment Now'}
              icon={<Play size={ICON.md} color={COLORS.textInverse} />}
              onPress={handleStart}
              loading={starting}
              accessibilityLabel="Start Assessment"
            />
            <Text style={styles.termsNote}>
              By clicking Start, you confirm that you are ready and agree to the NCCT examination code of conduct.
            </Text>
          </View>
        </View>
      )}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.lg,
  },
  loadingBox: {
    padding: SPACE.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  loadingText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  headerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  title: {
    ...TEXT.title,
    fontSize: 18,
    lineHeight: 24,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    marginTop: SPACE.xs,
  },
  skillText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  metricCard: {
    ...CARD,
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACE.md,
    gap: SPACE.xs,
  },
  metricValue: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  metricLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  sectionCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  sectionTitle: {
    ...TEXT.bodyStrong,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  ruleBullet: {
    marginTop: 2,
  },
  ruleText: {
    ...TEXT.body,
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
    padding: SPACE.md,
    backgroundColor: COLORS.primarySurface,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  noticeTextWrapper: {
    flex: 1,
    gap: SPACE.xs,
  },
  noticeTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  noticeBody: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  actionBox: {
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
  termsNote: {
    ...TEXT.caption,
    textAlign: 'center',
    color: COLORS.textMuted,
    paddingHorizontal: SPACE.md,
  },
});
