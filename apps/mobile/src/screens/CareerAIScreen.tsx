import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { PillTabs } from '../components/PillTabs';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { formatClock } from '../services/utils';
import { Send, Bot, Clock, ChevronRight } from 'lucide-react-native';
import { CareerChatMessage, CareerPlanStep, CareerRecommendation } from '../types';

const TABS = [
  { key: 'chat', label: 'Chat' },
  { key: 'plan', label: 'My plan' },
] as const;

const SUGGESTIONS = [
  'Which jobs match my skills?',
  'How do I become a Cooperative Development Officer?',
  'Which courses close my skill gaps?',
];

const WELCOME: CareerChatMessage = {
  id: 'welcome',
  sender: 'ai',
  text: 'Ask about jobs that match your skills, courses that close skill gaps, or your next career step.',
  timestamp: formatClock(),
};

/** Advisor replies use light markdown: render **bold** spans, turn '* ' bullets into '- '. */
const renderReply = (text: string) =>
  text
    .replace(/^\s*\*\s+/gm, '- ')
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      ) : (
        part
      )
    );

interface Plan {
  recommendations: CareerRecommendation[];
  steps: CareerPlanStep[];
  targetRole: string | null;
  readiness: number | null;
  isLive: boolean;
}

export const CareerAIScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'plan'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<CareerChatMessage[]>([WELCOME]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const chatRef = useRef<ScrollView>(null);
  const nextId = useRef(0);

  const loadPlan = useCallback(async () => {
    try {
      const g = await apiService.getCareerGuidance();
      setPlan({
        recommendations: g.recommendations,
        steps: g.career_path,
        targetRole: g.target_role,
        readiness: g.current_match,
        isLive: g.isLive,
      });
    } catch {
      setPlan((prev) => prev ?? { recommendations: [], steps: [], targetRole: null, readiness: null, isLive: false });
    }
  }, []);

  useOnMount(loadPlan);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isTyping) return;

    const stamp = nextId.current++;
    setMessages((prev) => [
      ...prev,
      { id: `u${stamp}`, sender: 'user', text, timestamp: formatClock() },
    ]);
    setInputText('');
    setIsTyping(true);

    const res = await apiService.sendCareerChat(text);
    setMessages((prev) => [
      ...prev,
      { id: `a${stamp}`, sender: 'ai', text: res.reply, timestamp: formatClock(), error: !res.ok },
    ]);
    setIsTyping(false);
  };

  const showSuggestions = messages.length === 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title="Career" isLive={plan ? plan.isLive : true} />

      <View style={styles.tabsWrap}>
        <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} fill />
      </View>

      {activeTab === 'chat' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          <ScrollView
            ref={chatRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <View key={msg.id} style={[styles.row, isAi ? styles.aiRow : styles.userRow]}>
                  {isAi ? (
                    <View style={styles.avatar}>
                      <Bot size={ICON.md} color={COLORS.textInverse} />
                    </View>
                  ) : null}
                  <View style={[styles.bubble, isAi ? styles.aiBubble : styles.userBubble]}>
                    <Text style={[styles.messageText, msg.error && styles.errorText]}>
                      {isAi ? renderReply(msg.text) : msg.text}
                    </Text>
                    <Text style={styles.time}>{msg.timestamp}</Text>
                  </View>
                </View>
              );
            })}

            {isTyping ? (
              <View style={[styles.row, styles.aiRow]}>
                <View style={styles.avatar}>
                  <Bot size={ICON.md} color={COLORS.textInverse} />
                </View>
                <View style={[styles.bubble, styles.aiBubble]} accessibilityLiveRegion="polite">
                  <Text style={styles.messageText}>Thinking...</Text>
                </View>
              </View>
            ) : null}

            {showSuggestions ? (
              <View style={styles.chips}>
                {SUGGESTIONS.map((label) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.chip}
                    onPress={() => handleSendMessage(label)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask: ${label}`}
                  >
                    <Text style={styles.chipText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about your career"
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
              blurOnSubmit={false}
              accessibilityLabel="Message"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Send size={ICON.md} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          style={styles.planScroll}
          contentContainerStyle={styles.planContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {plan === null ? <LoadingState /> : null}

          {plan && plan.targetRole ? (
            <View style={styles.targetCard}>
              <View style={styles.flex}>
                <Text style={styles.caption}>Target role</Text>
                <Text style={styles.section}>{plan.targetRole}</Text>
              </View>
              {plan.readiness !== null ? (
                <View style={styles.readiness} accessible accessibilityLabel={`Readiness ${plan.readiness}%`}>
                  <Text style={styles.readinessValue}>{plan.readiness}%</Text>
                  <Text style={styles.caption}>Readiness</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {plan && plan.recommendations.length === 0 && plan.steps.length === 0 ? (
            <EmptyState title="No plan available" message="Pull down to refresh." />
          ) : null}

          {plan && plan.recommendations.length > 0 ? (
            <View>
              <SectionHeader title="Recommended next steps" />
              <View style={styles.list}>
                {plan.recommendations.map((rec) => (
                  <View key={rec.priority} style={styles.recCard}>
                    <View style={styles.recHeader}>
                      <Badge label={`Priority ${rec.priority}`} variant={rec.priority === 1 ? 'primary' : 'neutral'} />
                      <Badge label={rec.impact} />
                    </View>
                    <Text style={styles.bodyStrong}>{rec.title}</Text>
                    <Text style={styles.caption}>{rec.reason}</Text>
                    <View style={styles.recFooter}>
                      <View style={styles.durationRow}>
                        <Clock size={ICON.sm} color={COLORS.textMuted} />
                        <Text style={styles.caption}>{rec.duration}</Text>
                      </View>
                      {rec.type === 'course' ? (
                        <TouchableOpacity
                          style={styles.linkBtn}
                          onPress={() => navigation.navigate('CoursesTab', { query: rec.title })}
                          accessibilityRole="button"
                          accessibilityLabel={`Find course ${rec.title}`}
                        >
                          <Text style={styles.linkText}>Find course</Text>
                          <ChevronRight size={ICON.sm} color={COLORS.primary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {plan && plan.steps.length > 0 ? (
            <View>
              <SectionHeader title="Career path" />
              <View style={styles.timeline}>
                {plan.steps.map((step, idx) => {
                  const isCurrent = step.status === 'current';
                  const isDone = step.status === 'completed';
                  const isLast = idx === plan.steps.length - 1;
                  return (
                    <View key={step.step} style={styles.timelineStep}>
                      <View style={styles.timelineLeft}>
                        <View style={[styles.dot, isCurrent && styles.dotActive, isDone && styles.dotDone]}>
                          <Text style={[styles.dotNumber, (isCurrent || isDone) && styles.dotNumberOn]}>
                            {step.step}
                          </Text>
                        </View>
                        {!isLast ? <View style={styles.line} /> : null}
                      </View>
                      <View style={[styles.timelineRight, isLast && styles.timelineRightLast]}>
                        <Text style={[styles.bodyStrong, isCurrent && styles.activeTitle]}>{step.title}</Text>
                        {step.timeline ? <Text style={styles.caption}>{step.timeline}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  tabsWrap: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  caption: { ...TEXT.caption },
  section: { ...TEXT.section },
  bodyStrong: { ...TEXT.bodyStrong },

  // Chat
  chatScroll: { flex: 1, backgroundColor: COLORS.surface },
  chatContent: { padding: SPACE.md, gap: SPACE.md },
  row: { flexDirection: 'row', gap: SPACE.sm },
  aiRow: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { maxWidth: '82%', padding: SPACE.md - SPACE.xs, borderRadius: RADII.md, gap: SPACE.xs },
  aiBubble: { ...CARD },
  userBubble: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  messageText: { ...TEXT.body },
  errorText: { color: COLORS.danger },
  bold: { fontWeight: '700' },
  time: { ...TEXT.caption, color: COLORS.textMuted, alignSelf: 'flex-end' },
  chips: { gap: SPACE.sm, alignItems: 'flex-start', paddingLeft: 32 + SPACE.sm },
  chip: {
    minHeight: HIT,
    justifyContent: 'center',
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.card,
  },
  chipText: { ...TEXT.bodyStrong, color: COLORS.primary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.sm,
    paddingHorizontal: SPACE.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACE.sm,
  },
  chatInput: {
    flex: 1,
    height: HIT,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.md,
    ...TEXT.body,
  },
  sendBtn: {
    width: HIT,
    height: HIT,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.primaryBorder },

  // Plan
  planScroll: { flex: 1, backgroundColor: COLORS.surface },
  planContent: { padding: SPACE.md, gap: SPACE.md },
  list: { gap: SPACE.sm },
  targetCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  readiness: { alignItems: 'center' },
  readinessValue: { ...TEXT.title, color: COLORS.primary },
  recCard: { ...CARD, padding: SPACE.md, gap: SPACE.sm },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACE.xs,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  linkBtn: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  linkText: { ...TEXT.bodyStrong, color: COLORS.primary },
  timeline: { ...CARD, padding: SPACE.md },
  timelineStep: { flexDirection: 'row', gap: SPACE.md - SPACE.xs },
  timelineLeft: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  dotNumber: { ...TEXT.captionStrong },
  dotNumberOn: { color: COLORS.textInverse },
  line: { flex: 1, width: 1, backgroundColor: COLORS.border, marginVertical: SPACE.xs },
  timelineRight: { flex: 1, paddingBottom: SPACE.md, gap: 2 },
  timelineRightLast: { paddingBottom: 0 },
  activeTitle: { color: COLORS.primary },
});
