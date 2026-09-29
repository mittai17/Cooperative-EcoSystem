import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { ProgressRing } from '../../components/ProgressRing';
import { AssessmentResultData } from './assessmentTypes';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';

export const AssessmentResultScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AssessmentResult'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // The real submit endpoint (POST /assessments/attempts/{id}/submit) is
  // one-shot — the backend rejects a second call once the attempt is closed.
  // AssessmentAttemptScreen already called it and passes the server-graded
  // result here; this screen must render that, never re-submit.
  const result: AssessmentResultData | null = route.params?.result ?? null;
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  if (!result) {
    // No fabricated 0%/failed scorecard here — this screen only renders a
    // real, server-graded result handed to it by AssessmentAttemptScreen.
    return (
      <ScrollScreen
        title="Assessment Results"
        onBack={() => navigation.navigate('TraineeTabs', { screen: 'LearnTab' })}
      >
        <View style={styles.loadingBox}>
          <AlertTriangle size={ICON.lg} color={COLORS.danger} />
          <Text style={styles.loadingText}>
            No result available for this attempt. This can happen if the assessment was not submitted
            successfully — return to the exam and try submitting again.
          </Text>
          <Button
            label="Return to Learning Dashboard"
            variant="secondary"
            onPress={() => navigation.navigate('TraineeTabs', { screen: 'LearnTab' })}
          />
        </View>
      </ScrollScreen>
    );
  }

  const passed = result.passed;
  const score = result.score;
  const topicBreakdown = result.topic_breakdown ?? {};
  const reviewQuestions = result.review ?? [];

  return (
    <ScrollScreen
      title="Examination Scorecard"
      subtitle={passed ? 'Evaluation Completed · Passed' : 'Evaluation Completed · Needs Improvement'}
      onBack={() => navigation.navigate('TraineeTabs', { screen: 'LearnTab' })}
    >
      <View style={styles.container}>
        {/* Score Summary Card */}
        <View style={[styles.scoreCard, passed ? styles.scoreCardPass : styles.scoreCardFail]}>
          <View style={styles.ringWrapper}>
            <ProgressRing value={score} size={110} strokeWidth={10} label={passed ? 'PASSED' : 'FAILED'} />
          </View>

          <View style={styles.scoreDetails}>
            <View style={styles.badgeRow}>
              {passed ? (
                <Badge label="PASSED" variant="success" verified />
              ) : (
                <Badge label="NOT QUALIFIED" variant="primary" />
              )}
              <Badge label="Passing Mark: 60%" variant="neutral" />
            </View>

            <Text style={styles.scoreHeadline}>
              {passed ? 'Congratulations!' : 'Keep Practicing'}
            </Text>
            <Text style={styles.scoreSubtext}>
              {passed
                ? 'You have successfully passed the national evaluation for Cooperative Governance.'
                : 'You did not reach the minimum 60% passing mark. Review the explanations below and attempt again.'}
            </Text>
          </View>
        </View>

        {/* Skill Verification Callout (if passed) */}
        {passed ? (
          <View style={styles.skillEarnedCard}>
            <View style={styles.skillEarnedHeader}>
              <Sparkles size={ICON.md} color={COLORS.primary} />
              <Text style={styles.skillEarnedTitle}>Competency Credential Verified</Text>
            </View>
            <Text style={styles.skillEarnedBody}>
              Your Skill Passport has been credited with verified credential in{' '}
              <Text style={styles.boldText}>{result?.skill_updated || 'Cooperative Governance & Auditing'}</Text>.
            </Text>

            <View style={styles.skillActions}>
              <TouchableOpacity
                style={styles.certButton}
                onPress={() => navigation.navigate('Certificates')}
                accessibilityRole="button"
                accessibilityLabel="View official certificate"
              >
                <Award size={ICON.md} color={COLORS.textInverse} />
                <Text style={styles.certButtonText}>View Official Certificate</Text>
                <ArrowRight size={ICON.sm} color={COLORS.textInverse} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Competency Breakdown Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck size={ICON.md} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Competency Breakdown</Text>
          </View>

          <View style={styles.competencyList}>
            {Object.keys(topicBreakdown).map((topic) => {
              const item = topicBreakdown[topic];
              const pct = item.possible > 0 ? Math.round((item.earned / item.possible) * 100) : 0;
              return (
                <View key={topic} style={styles.competencyItem}>
                  <View style={styles.competencyHeader}>
                    <Text style={styles.competencyName}>{topic}</Text>
                    <Text style={styles.competencyMarks}>
                      {item.earned}/{item.possible} ({pct}%)
                    </Text>
                  </View>
                  <ProgressBar value={pct} />
                </View>
              );
            })}
          </View>
        </View>

        {/* Review Question Explanations */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <HelpCircle size={ICON.md} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Question Review & Explanations</Text>
          </View>

          <View style={styles.reviewList}>
            {reviewQuestions.map((q, index) => {
              const isExpanded = !!expandedQuestions[q.question_id];
              const isCorrect = q.correctly_answered;
              return (
                <View key={q.question_id} style={styles.reviewCard}>
                  <TouchableOpacity
                    style={styles.reviewCardHeader}
                    onPress={() => toggleExpand(q.question_id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Question ${index + 1} details`}
                  >
                    <View style={styles.reviewStatusIcon}>
                      {isCorrect ? (
                        <CheckCircle2 size={ICON.md} color={COLORS.success} />
                      ) : (
                        <XCircle size={ICON.md} color={COLORS.danger} />
                      )}
                    </View>
                    <View style={styles.reviewHeaderContent}>
                      <Text style={styles.reviewQuestionNumber}>
                        Question {index + 1} · {isCorrect ? 'Correct' : 'Incorrect'}
                      </Text>
                      <Text style={styles.reviewQuestionPrompt} numberOfLines={isExpanded ? undefined : 2}>
                        {q.prompt || `Assessment Item #${index + 1}`}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={ICON.sm} color={COLORS.textMuted} />
                    ) : (
                      <ChevronDown size={ICON.sm} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={styles.reviewDetails}>
                      <View style={styles.answerBlock}>
                        <Text style={styles.answerLabel}>Your Selected Answer:</Text>
                        <Text style={[styles.answerText, isCorrect ? styles.correctAnswerText : styles.incorrectAnswerText]}>
                          {q.answer?.length > 0 ? q.answer.join(', ') : '(No answer given)'}
                        </Text>
                      </View>

                      {!isCorrect && q.correct ? (
                        <View style={styles.answerBlock}>
                          <Text style={styles.answerLabel}>Correct Answer:</Text>
                          <Text style={[styles.answerText, styles.correctAnswerText]}>
                            {q.correct.join(', ')}
                          </Text>
                        </View>
                      ) : null}

                      {q.explanation ? (
                        <View style={styles.explanationBox}>
                          <Text style={styles.explanationTitle}>Explanation:</Text>
                          <Text style={styles.explanationText}>{q.explanation}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Retake / Return Actions */}
        <View style={styles.bottomActions}>
          {!passed ? (
            <Button
              label="Retake Assessment"
              icon={<RotateCcw size={ICON.md} color={COLORS.textInverse} />}
              onPress={() => navigation.replace('AssessmentIntro', { assessmentId: 'asmt-coop-001' })}
            />
          ) : null}

          <Button
            label="Return to Learning Dashboard"
            variant="secondary"
            icon={<BookOpen size={ICON.md} color={COLORS.primary} />}
            onPress={() => navigation.navigate('TraineeTabs', { screen: 'LearnTab' })}
          />
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  loadingBox: {
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  loadingText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  scoreCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  scoreCardPass: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successSurface,
  },
  scoreCardFail: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  ringWrapper: {
    padding: SPACE.xs,
  },
  scoreDetails: {
    flex: 1,
    gap: SPACE.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    flexWrap: 'wrap',
  },
  scoreHeadline: {
    ...TEXT.section,
    fontSize: 18,
  },
  scoreSubtext: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  skillEarnedCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primaryBorder,
  },
  skillEarnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  skillEarnedTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  skillEarnedBody: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  skillActions: {
    marginTop: SPACE.xs,
  },
  certButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.md,
  },
  certButtonText: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
  },
  sectionCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  sectionTitle: {
    ...TEXT.bodyStrong,
  },
  competencyList: {
    gap: SPACE.md,
  },
  competencyItem: {
    gap: SPACE.xs,
  },
  competencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competencyName: {
    ...TEXT.body,
    color: COLORS.textPrimary,
  },
  competencyMarks: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  reviewList: {
    gap: SPACE.sm,
  },
  reviewCard: {
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  reviewStatusIcon: {
    marginTop: 2,
  },
  reviewHeaderContent: {
    flex: 1,
    gap: 2,
  },
  reviewQuestionNumber: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
  reviewQuestionPrompt: {
    ...TEXT.bodyStrong,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  reviewDetails: {
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.md,
    gap: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.sm,
  },
  answerBlock: {
    gap: 2,
  },
  answerLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  answerText: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  correctAnswerText: {
    color: COLORS.success,
  },
  incorrectAnswerText: {
    color: COLORS.danger,
  },
  explanationBox: {
    backgroundColor: COLORS.card,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    gap: 2,
  },
  explanationTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  explanationText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  bottomActions: {
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
});
