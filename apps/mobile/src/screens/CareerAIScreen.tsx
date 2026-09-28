import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  Target,
  Award,
  BookOpen,
} from 'lucide-react-native';
import { CareerChatMessage, CareerPlanStep, CareerRecommendation } from '../types';
import { MOCK_CAREER_RECOMMENDATIONS, MOCK_CAREER_STEPS } from '../services/mockData';

export const CareerAIScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'plan'>('chat');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<CareerChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Namaste Ravindra! I am your AI Cooperative Career Mentor. Based on your 72% Skill Passport, you are close to qualifying for Cooperative Development Officer roles. How can I guide you today?',
      timestamp: '10:00 AM',
      suggested_actions: [
        { label: 'Which jobs match my skills?', actionKey: 'jobs' },
        { label: 'How to become a CDO?', actionKey: 'cdo' },
        { label: 'Recommend courses to bridge gaps', actionKey: 'learn' },
      ],
    },
  ]);

  const recommendations: CareerRecommendation[] = MOCK_CAREER_RECOMMENDATIONS;
  const careerSteps: CareerPlanStep[] = MOCK_CAREER_STEPS;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: CareerChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await apiService.sendCareerChat(text);
      const aiMsg: CareerChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.reply,
        timestamp: 'Now',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: CareerChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'I recommend taking "Data Analytics for Cooperatives" to increase your job match from 72% to 85%+. Check your "My Plan" tab for the complete roadmap.',
        timestamp: 'Now',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Career AI"
        subtitle="Cooperative Career Advisory"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Segmented Tab Controls */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chat' && styles.activeTabButton]}
          onPress={() => setActiveTab('chat')}
        >
          <Sparkles size={16} color={activeTab === 'chat' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            Advisor Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'plan' && styles.activeTabButton]}
          onPress={() => setActiveTab('plan')}
        >
          <Target size={16} color={activeTab === 'plan' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>
            My Career Plan
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <View
                  key={msg.id}
                  style={[styles.messageBubbleRow, isAi ? styles.aiRow : styles.userRow]}
                >
                  {isAi && (
                    <View style={styles.aiAvatar}>
                      <Bot size={18} color="#FFFFFF" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isAi ? styles.aiBubble : styles.userBubble,
                    ]}
                  >
                    <Text style={[styles.messageText, isAi ? styles.aiText : styles.userText]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.messageTime, isAi ? styles.aiTime : styles.userTime]}>
                      {msg.timestamp}
                    </Text>

                    {/* Quick suggested chips if AI message */}
                    {msg.suggested_actions && (
                      <View style={styles.chipRow}>
                        {msg.suggested_actions.map((chip, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.chip}
                            onPress={() => handleSendMessage(chip.label)}
                          >
                            <Text style={styles.chipText}>{chip.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isTyping && (
              <View style={[styles.messageBubbleRow, styles.aiRow]}>
                <View style={styles.aiAvatar}>
                  <Bot size={18} color="#FFFFFF" />
                </View>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <Text style={styles.aiText}>Advisor is analyzing skill data...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about careers, skill gaps, or jobs..."
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.disabledSend]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim()}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        /* My Career Plan Tab */
        <ScrollView style={styles.planContainer} contentContainerStyle={styles.planContent}>
          {/* Target Role Target Card */}
          <View style={styles.targetRoleCard}>
            <View style={{ flex: 1 }}>
              <Badge label="TARGET ROLE" variant="primary" />
              <Text style={styles.targetRoleTitle}>Cooperative Development Officer (CDO)</Text>
              <Text style={styles.targetRoleSub}>Cadre: NCDC / State Cooperative Federations</Text>
            </View>
            <View style={styles.roleMatchGauge}>
              <Text style={styles.gaugePercent}>72%</Text>
              <Text style={styles.gaugeLabel}>Readiness</Text>
            </View>
          </View>

          {/* Skill Gap Course Recommendations */}
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>Recommended Learning Actions</Text>
            {recommendations.map((rec) => (
              <View key={rec.priority} style={styles.recommendationCard}>
                <View style={styles.recHeader}>
                  <Badge label={`Priority #${rec.priority}`} variant={rec.priority === 1 ? 'danger' : 'warning'} />
                  <Badge label={rec.impact} variant="success" />
                </View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recReason}>{rec.reason}</Text>
                <View style={styles.recFooter}>
                  <Text style={styles.recDuration}>⏱ {rec.duration}</Text>
                  <TouchableOpacity
                    style={styles.recEnrollBtn}
                    onPress={() => navigation.navigate('CoursesTab')}
                  >
                    <Text style={styles.recEnrollText}>Start Course ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Career Path Milestones Timeline */}
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>Career Progression Milestones</Text>
            <View style={styles.timelineContainer}>
              {careerSteps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                return (
                  <View key={step.step} style={styles.timelineStep}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          isCurrent && styles.activeDot,
                          isCompleted && styles.completedDot,
                        ]}
                      >
                        <Text style={styles.dotNumber}>{step.step}</Text>
                      </View>
                      {idx < careerSteps.length - 1 && <View style={styles.timelineLine} />}
                    </View>

                    <View style={styles.timelineRight}>
                      <Text
                        style={[
                          styles.timelineStepTitle,
                          isCurrent && styles.activeStepTitle,
                        ]}
                      >
                        {step.title}
                      </Text>
                      {step.timeline && (
                        <Text style={styles.timelineSub}>{step.timeline}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  activeTabButton: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chatScroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  aiRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiText: {
    color: COLORS.textPrimary,
  },
  userText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  aiTime: {
    color: COLORS.textMuted,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSend: {
    backgroundColor: COLORS.border,
  },
  planContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  planContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  targetRoleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.sm,
  },
  targetRoleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  targetRoleSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roleMatchGauge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  gaugePercent: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  planSection: {
    gap: 10,
  },
  planSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  recommendationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.sm,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  recReason: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 2,
  },
  recDuration: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  recEnrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recEnrollText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timelineContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  timelineStep: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    backgroundColor: COLORS.primary,
  },
  completedDot: {
    backgroundColor: COLORS.success,
  },
  dotNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activeStepTitle: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  timelineSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
