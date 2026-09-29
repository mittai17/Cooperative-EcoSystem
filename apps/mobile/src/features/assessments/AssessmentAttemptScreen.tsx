import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { assessmentApi, AssessmentApiError } from './assessmentApi';
import { AssessmentAttemptData, AssessmentQuestion } from './assessmentTypes';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  ListFilter,
  CheckCircle2,
  Circle,
  HelpCircle,
  Save,
} from 'lucide-react-native';

export const AssessmentAttemptScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'AssessmentAttempt'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const attemptId = route.params?.attemptId || 'att-demo-1';

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<AssessmentAttemptData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [autoSaved, setAutoSaved] = useState(true);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);

  const [initialSeconds, setInitialSeconds] = useState(30 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);

  // Load attempt questions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await assessmentApi.startAttempt('asmt-coop-001');
        if (mounted) {
          setAttempt({
            ...data,
            attempt_id: attemptId,
          });

          // Compute remaining seconds from expires_at if provided
          if (data.expires_at) {
            const exp = new Date(data.expires_at).getTime();
            const now = new Date().getTime();
            const diff = Math.max(10, Math.floor((exp - now) / 1000));
            setRemainingSeconds(diff);
            setInitialSeconds(diff);
          }
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [attemptId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setReviewOpen(false);

    try {
      const result = await assessmentApi.submitAttempt(attemptId);
      // Pass the real, server-graded result forward — the submit endpoint is
      // one-shot, so AssessmentResultScreen must not call it again.
      navigation.replace('AssessmentResult', { attemptId, result });
    } catch (e) {
      // A real failure must stay visible and must NOT navigate to a result
      // screen — there is no result to show, and re-submitting is safe to
      // retry since the attempt is still in_progress on the backend.
      Alert.alert(
        'Submission Failed',
        e instanceof AssessmentApiError
          ? e.message
          : 'Could not submit your assessment. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, navigation, submitting]);

  // Countdown timer with auto-submit
  useEffect(() => {
    if (loading) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            Alert.alert('Time Expired', 'Your assessment time has ended. Submitting your answers now...', [
              {
                text: 'OK',
                onPress: () => {
                  handleSubmit();
                },
              },
            ]);
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, handleSubmit]);

  const questions = attempt?.questions || [];
  const currentQuestion: AssessmentQuestion | undefined = questions[currentIndex];

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = remainingSeconds < 120; // < 2 mins warning
  const isWarning = remainingSeconds < 300; // < 5 mins warning

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    const newAnswers = {
      ...answers,
      [qId]: [option],
    };
    setAnswers(newAnswers);
    setAutoSaved(false);
    setAutoSaveFailed(false);

    // Debounced autosave — a real failure must be visible, not silently
    // treated as saved.
    assessmentApi
      .saveAnswer(attemptId, qId, [option])
      .then(() => {
        setAutoSaved(true);
      })
      .catch(() => {
        setAutoSaved(false);
        setAutoSaveFailed(true);
      });
  };

  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter((k) => answers[k] && answers[k].length > 0).length;
  }, [answers]);

  const totalQuestions = questions.length;
  const progressRatio = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const timerRatio = initialSeconds > 0 ? (remainingSeconds / initialSeconds) * 100 : 0;

  if (loading) {
    return (
      <ScrollScreen title="Exam in Progress">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing secure evaluation session...</Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      title="Examination in Progress"
      subtitle={`Question ${currentIndex + 1} of ${totalQuestions}`}
      onBack={() => {
        Alert.alert(
          'Leave Assessment?',
          'The examination timer will continue to count down if you leave. Are you sure?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave Exam', style: 'destructive', onPress: () => navigation.goBack() },
          ]
        );
      }}
      rightAction={
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => setReviewOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Review questions"
        >
          <ListFilter size={ICON.md} color={COLORS.primary} />
          <Text style={styles.reviewBtnText}>{answeredCount}/{totalQuestions}</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Timer Bar */}
        <View style={[styles.timerCard, isUrgent && styles.timerCardUrgent, isWarning && !isUrgent && styles.timerCardWarning]}>
          <View style={styles.timerHeader}>
            <View style={styles.timerTitleRow}>
              {isUrgent ? (
                <AlertTriangle size={ICON.md} color={COLORS.danger} />
              ) : (
                <Clock size={ICON.md} color={isWarning ? COLORS.primary : COLORS.textPrimary} />
              )}
              <Text
                style={[
                  styles.timerText,
                  isUrgent && styles.timerTextUrgent,
                  isWarning && !isUrgent && styles.timerTextWarning,
                ]}
              >
                {formatTimer(remainingSeconds)} Remaining
              </Text>
            </View>

            <View style={styles.autoSaveRow}>
              <Save size={ICON.sm} color={autoSaveFailed ? COLORS.danger : autoSaved ? COLORS.success : COLORS.textMuted} />
              <Text style={[styles.autoSaveText, autoSaveFailed && { color: COLORS.danger }]}>
                {autoSaveFailed ? 'Save failed — check connection' : autoSaved ? 'Saved' : 'Saving...'}
              </Text>
            </View>
          </View>

          {/* Timer progress line */}
          <View style={styles.timerTrack}>
            <View
              style={[
                styles.timerFill,
                { width: `${Math.max(0, Math.min(100, timerRatio))}%` },
                isUrgent && styles.timerFillUrgent,
                isWarning && !isUrgent && styles.timerFillWarning,
              ]}
            />
          </View>

          {isUrgent ? (
            <View style={styles.urgentAlert}>
              <Text style={styles.urgentAlertText}>
                Less than 2 minutes remaining! Answers will auto-submit when the timer expires.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Question Pagination Jump Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jumpRow}>
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] && answers[q.id].length > 0;
            const isCurrent = idx === currentIndex;
            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => setCurrentIndex(idx)}
                style={[
                  styles.jumpChip,
                  isCurrent && styles.jumpChipCurrent,
                  isAnswered && !isCurrent && styles.jumpChipAnswered,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Go to question ${idx + 1}`}
              >
                <Text
                  style={[
                    styles.jumpChipText,
                    isCurrent && styles.jumpChipTextCurrent,
                    isAnswered && !isCurrent && styles.jumpChipTextAnswered,
                  ]}
                >
                  {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Current Question Card */}
        {currentQuestion ? (
          <View style={styles.questionCard}>
            <View style={styles.questionMetaRow}>
              <Badge label={`Question ${currentIndex + 1} of ${totalQuestions}`} variant="neutral" />
              <Badge label={currentQuestion.topic} variant="primary" />
              <Text style={styles.marksText}>{currentQuestion.marks} Marks</Text>
            </View>

            <Text style={styles.questionPrompt}>{currentQuestion.prompt}</Text>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQuestion.options.map((option, optIdx) => {
                const selected = (answers[currentQuestion.id] || []).includes(option);
                return (
                  <TouchableOpacity
                    key={optIdx}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => handleSelectOption(option)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Bottom Nav Controls */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
            disabled={currentIndex === 0}
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            accessibilityRole="button"
            accessibilityLabel="Previous question"
          >
            <ChevronLeft size={ICON.md} color={currentIndex === 0 ? COLORS.textMuted : COLORS.textPrimary} />
            <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          {currentIndex < totalQuestions - 1 ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              accessibilityRole="button"
              accessibilityLabel="Next question"
            >
              <Text style={styles.navBtnTextPrimary}>Next</Text>
              <ChevronRight size={ICON.md} color={COLORS.textInverse} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnSubmit]}
              onPress={() => setReviewOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Review and submit"
            >
              <Text style={styles.navBtnTextPrimary}>Review & Submit</Text>
              <Send size={ICON.sm} color={COLORS.textInverse} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Review Modal */}
        <Modal
          visible={reviewOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setReviewOpen(false)}
        >
          <View style={styles.modalScrim}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Review Before Submit</Text>
                  <Text style={styles.modalSubtitle}>
                    {answeredCount} of {totalQuestions} Questions Answered
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReviewOpen(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>

              <ProgressBar value={progressRatio} />

              <ScrollView style={styles.modalList}>
                {questions.map((q, idx) => {
                  const hasAns = answers[q.id] && answers[q.id].length > 0;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={styles.reviewItem}
                      onPress={() => {
                        setCurrentIndex(idx);
                        setReviewOpen(false);
                      }}
                    >
                      <View style={styles.reviewItemNumber}>
                        {hasAns ? (
                          <CheckCircle2 size={ICON.md} color={COLORS.success} />
                        ) : (
                          <Circle size={ICON.md} color={COLORS.danger} />
                        )}
                        <Text style={styles.reviewItemNumberText}>Q{idx + 1}</Text>
                      </View>
                      <View style={styles.reviewItemBody}>
                        <Text style={styles.reviewItemPrompt} numberOfLines={1}>
                          {q.prompt}
                        </Text>
                        <Text style={[styles.reviewItemStatus, { color: hasAns ? COLORS.success : COLORS.danger }]}>
                          {hasAns ? `Answered: ${answers[q.id][0]}` : 'Not yet answered'}
                        </Text>
                      </View>
                      <ChevronRight size={ICON.sm} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {totalQuestions - answeredCount > 0 ? (
                <View style={styles.unansweredWarning}>
                  <AlertTriangle size={ICON.sm} color={COLORS.danger} />
                  <Text style={styles.unansweredWarningText}>
                    You have {totalQuestions - answeredCount} unanswered questions!
                  </Text>
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <Button
                  label="Return to Questions"
                  variant="secondary"
                  onPress={() => setReviewOpen(false)}
                />
                <Button
                  label={submitting ? 'Submitting...' : 'Confirm & Finalize Submit'}
                  onPress={handleSubmit}
                  loading={submitting}
                />
              </View>
            </View>
          </View>
        </Modal>
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
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  reviewBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  timerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    backgroundColor: COLORS.card,
  },
  timerCardWarning: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primarySurface,
  },
  timerCardUrgent: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerSurface,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  timerText: {
    ...TEXT.section,
    fontSize: 15,
  },
  timerTextWarning: {
    color: COLORS.primary,
  },
  timerTextUrgent: {
    color: COLORS.danger,
    fontWeight: '800',
  },
  autoSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autoSaveText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  timerTrack: {
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  timerFillWarning: {
    backgroundColor: COLORS.primary,
  },
  timerFillUrgent: {
    backgroundColor: COLORS.danger,
  },
  urgentAlert: {
    marginTop: SPACE.xs,
  },
  urgentAlertText: {
    ...TEXT.captionStrong,
    color: COLORS.danger,
  },
  jumpRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingVertical: 2,
  },
  jumpChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpChipCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
  },
  jumpChipAnswered: {
    backgroundColor: COLORS.successSurface,
    borderColor: COLORS.success,
  },
  jumpChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  jumpChipTextCurrent: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  jumpChipTextAnswered: {
    color: COLORS.success,
  },
  questionCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marksText: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
  questionPrompt: {
    ...TEXT.bodyStrong,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.primaryDark,
  },
  optionsList: {
    gap: SPACE.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACE.md,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionLabel: {
    ...TEXT.body,
    flex: 1,
    color: COLORS.textPrimary,
  },
  optionLabelSelected: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACE.md,
    marginTop: SPACE.xs,
  },
  navBtn: {
    flex: 1,
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
  },
  navBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navBtnSubmit: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  navBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  navBtnTextPrimary: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    maxHeight: '85%',
    padding: SPACE.md,
    gap: SPACE.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    ...TEXT.section,
  },
  modalSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  modalCloseBtn: {
    padding: SPACE.xs,
  },
  modalCloseText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  modalList: {
    maxHeight: 280,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACE.sm,
  },
  reviewItemNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 52,
  },
  reviewItemNumberText: {
    ...TEXT.captionStrong,
  },
  reviewItemBody: {
    flex: 1,
    gap: 2,
  },
  reviewItemPrompt: {
    ...TEXT.body,
    fontSize: 13,
  },
  reviewItemStatus: {
    ...TEXT.caption,
    fontSize: 11,
  },
  unansweredWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: SPACE.sm,
    backgroundColor: COLORS.dangerSurface,
    borderRadius: RADII.sm,
  },
  unansweredWarningText: {
    ...TEXT.captionStrong,
    color: COLORS.danger,
  },
  modalActions: {
    gap: SPACE.sm,
    paddingBottom: SPACE.sm,
  },
});
