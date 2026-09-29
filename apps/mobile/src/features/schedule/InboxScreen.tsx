import React, { useState, useEffect, useCallback } from 'react';
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
import { PillTabs } from '../../components/PillTabs';
import { Badge } from '../../components/Badge';
import { EmptyState, LoadingState } from '../../components/EmptyState';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_NOTIFICATIONS, NotificationInboxItem } from './mockData';
import { apiClient } from '../../api/client';
import {
  Bell,
  AlertTriangle,
  GraduationCap,
  Building,
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  Check,
} from 'lucide-react-native';

const NOTIF_TABS = [
  { key: 'all', label: 'All Alerts' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'academic', label: 'Academic' },
  { key: 'campus', label: 'Campus & Stay' },
  { key: 'logistics', label: 'Logistics' },
] as const;

type NotifTab = (typeof NOTIF_TABS)[number]['key'];

export const InboxScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<NotifTab>('all');
  const [notifications, setNotifications] = useState<NotificationInboxItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiClient<{ items: any[]; unread_count: number }>('/notifications');
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        const mapped: NotificationInboxItem[] = res.items.map((item, idx) => {
          const fallback = MOCK_NOTIFICATIONS[idx % MOCK_NOTIFICATIONS.length];
          return {
            id: String(item.id || fallback.id),
            category: (item.kind as any) || fallback.category,
            title: item.title || fallback.title,
            body: item.body || fallback.body,
            created_at: item.created_at || fallback.created_at,
            read: !!item.read_at,
            priority: fallback.priority,
            action_label: fallback.action_label,
            action_screen: fallback.action_screen,
            action_params: fallback.action_params,
          };
        });
        setNotifications(mapped);
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      (prev ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // safe fallback
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => (prev ?? []).map((n) => ({ ...n, read: true })));
    Alert.alert('All Caught Up', 'All notifications have been marked as read.');
  };

  const handleAction = (item: NotificationInboxItem) => {
    markAsRead(item.id);
    if (!item.action_screen) return;

    if (item.action_screen === 'ScheduleChange') {
      navigation.navigate('ScheduleChange', {
        slotId: item.action_params?.slotId || 'slot-103',
        date: item.action_params?.date || '2026-10-19',
      });
    } else if (item.action_screen === 'HostelWaitlist') {
      navigation.navigate('HostelWaitlist');
    } else if (item.action_screen === 'NominationDetail') {
      navigation.navigate('NominationDetail', {
        nominationId: item.action_params?.nominationId || 'nom-9821',
      });
    } else if (item.action_screen === 'LogisticsChecklist') {
      navigation.navigate('LogisticsChecklist');
    }
  };

  const getCategoryIcon = (category: NotificationInboxItem['category']) => {
    switch (category) {
      case 'urgent':
        return <AlertTriangle size={ICON.md} color={COLORS.danger} />;
      case 'academic':
        return <GraduationCap size={ICON.md} color={COLORS.primary} />;
      case 'campus':
        return <Building size={ICON.md} color={COLORS.primary} />;
      case 'logistics':
        return <ClipboardList size={ICON.md} color={COLORS.primary} />;
      default:
        return <Bell size={ICON.md} color={COLORS.textSecondary} />;
    }
  };

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  const filteredList = (notifications ?? []).filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <ScrollScreen
      title="Notifications & Alerts"
      onBack={() => navigation.goBack()}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightAction={
        unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllRead}
            accessibilityLabel="Mark all as read"
          >
            <Check size={ICON.sm} color={COLORS.primary} />
            <Text style={styles.markAllText}>Mark read</Text>
          </TouchableOpacity>
        ) : undefined
      }
      sticky={
        <PillTabs tabs={NOTIF_TABS} active={activeTab} onChange={setActiveTab} />
      }
    >
      {notifications === null ? (
        <LoadingState />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No alerts in this category"
          message="You are fully up to date with batch schedules, campus housing, and nomination announcements."
        />
      ) : (
        <View style={styles.list}>
          {filteredList.map((item) => {
            const isUnread = !item.read;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isUnread && styles.cardUnread]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.topRow}>
                  <View style={styles.iconWrap}>
                    {getCategoryIcon(item.category)}
                  </View>
                  <View style={styles.titleWrap}>
                    <Text style={[styles.title, isUnread && styles.titleUnread]}>
                      {item.title}
                    </Text>
                    <Text style={styles.timestamp}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.bodyText}>{item.body}</Text>

                {item.action_label && item.action_screen && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleAction(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnText}>{item.action_label}</Text>
                      <ChevronRight size={ICON.sm} color={COLORS.textInverse} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.xs,
  },
  markAllText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  list: {
    gap: SPACE.sm,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.card,
    gap: SPACE.xs,
  },
  cardUnread: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.surface,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  titleUnread: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  timestamp: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  bodyText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontSize: 12,
    paddingLeft: 40,
  },
  actionRow: {
    paddingLeft: 40,
    paddingTop: SPACE.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  actionBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
    fontSize: 11,
  },
});
