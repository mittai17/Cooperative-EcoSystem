import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_LOGISTICS_CHECKLIST, LogisticsChecklistItem } from './mockData';
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  MapPin,
  Clock,
  User,
  Phone,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

export const LogisticsChecklistScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<LogisticsChecklistItem[]>(MOCK_LOGISTICS_CHECKLIST);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.completed).length;
  const progressRatio = items.length > 0 ? completedCount / items.length : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleHelpDeskCall = () => {
    Alert.alert(
      'Trainee Logistics Helpdesk',
      'Helpline: +91 20 2570 1200\nCounter 1, Main Administrative Building\nOperating Hours: 08:30 AM - 06:00 PM',
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  return (
    <ScrollScreen
      title="Onboarding Logistics"
      onBack={() => navigation.goBack()}
    >
      {/* Summary Card with Progress */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View>
            <Text style={styles.summaryTitle}>Induction & Campus Clearance</Text>
            <Text style={styles.summarySub}>Complete checklist before attending first lecture.</Text>
          </View>
          <Badge
            label={`${completedCount}/${items.length} Done`}
            variant={completedCount === items.length ? 'success' : 'primary'}
            verified={completedCount === items.length}
          />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.percentText}>{progressPercent}% Completed</Text>
        </View>
      </View>

      {/* Checklist items */}
      <View style={styles.checklistWrap}>
        {items.map((item) => {
          const isDone = item.completed;
          const isExpanded = expandedId === item.id;

          return (
            <View
              key={item.id}
              style={[styles.itemCard, isDone && styles.itemCardDone]}
            >
              <View style={styles.itemHeader}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.8}
                >
                  {isDone ? (
                    <CheckCircle2 size={22} color={COLORS.success} />
                  ) : (
                    <Circle size={22} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.itemContent}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemDesc} numberOfLines={isExpanded ? undefined : 2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.expandTouch}
                  onPress={() => toggleExpand(item.id)}
                >
                  {isExpanded ? (
                    <ChevronUp size={ICON.sm} color={COLORS.primary} />
                  ) : (
                    <ChevronDown size={ICON.sm} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Expanded Helpdesk Details */}
              {isExpanded && (
                <View style={styles.itemExpanded}>
                  <View style={styles.deskRow}>
                    <MapPin size={ICON.sm} color={COLORS.primary} />
                    <Text style={styles.deskText}>{item.desk_location}</Text>
                  </View>
                  <View style={styles.deskRow}>
                    <Clock size={ICON.sm} color={COLORS.textMuted} />
                    <Text style={styles.deskSub}>Hours: {item.counter_hours}</Text>
                  </View>
                  <View style={styles.deskRow}>
                    <User size={ICON.sm} color={COLORS.textMuted} />
                    <Text style={styles.deskSub}>In-charge: {item.officer_in_charge}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Helpline Contact Footer */}
      <View style={styles.footerCard}>
        <View style={styles.footerInfo}>
          <HelpCircle size={ICON.md} color={COLORS.primary} />
          <View>
            <Text style={styles.footerHeading}>Need Help Desk Assistance?</Text>
            <Text style={styles.footerText}>Contact the student facilitation center for lost items.</Text>
          </View>
        </View>
        <Button
          label="Contact Logistics Helpline"
          onPress={handleHelpDeskCall}
          variant="secondary"
          icon={<Phone size={ICON.sm} color={COLORS.primary} />}
        />
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.sm,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    ...TEXT.bodyStrong,
    fontSize: 15,
    color: COLORS.primaryDark,
  },
  summarySub: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  progressContainer: {
    gap: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADII.pill,
  },
  percentText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  checklistWrap: {
    gap: SPACE.sm,
  },
  itemCard: {
    ...CARD,
    padding: SPACE.sm,
    backgroundColor: COLORS.card,
    gap: SPACE.xs,
  },
  itemCardDone: {
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouch: {
    padding: 4,
    marginRight: SPACE.xs,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  itemTitleDone: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  itemDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
    fontSize: 11,
  },
  expandTouch: {
    padding: 6,
  },
  itemExpanded: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.xs + 2,
    marginTop: 4,
    gap: 4,
    paddingLeft: 30,
  },
  deskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deskText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  deskSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  footerCard: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  footerHeading: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  footerText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
