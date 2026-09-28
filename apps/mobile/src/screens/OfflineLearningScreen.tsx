import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  Download,
  RefreshCw,
  HardDrive,
  CheckCircle,
  Clock,
  Trash2,
  Play,
  WifiOff,
} from 'lucide-react-native';
import { OfflineCourseItem } from '../types';

export const OfflineLearningScreen = ({ navigation }: any) => {
  const [courses, setCourses] = useState<OfflineCourseItem[]>(apiService.getOfflineCourses());
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActionsCount, setPendingActionsCount] = useState(2);

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setPendingActionsCount(0);
      Alert.alert(
        'Offline Synchronization Complete',
        'All pending attendance check-ins and module progress have been uploaded to CoopSetu Cloud.'
      );
    }, 1500);
  };

  const totalStorageMb = courses.reduce((acc, c) => acc + c.size_mb, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Offline Learning"
        subtitle="Bandwidth-Optimized Edge Cache"
        showBack
        onBack={() => navigation.goBack()}
        isLive={false}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Sync Status Banner */}
        <View style={styles.syncBanner}>
          <View style={styles.syncLeft}>
            <View style={styles.syncIconWrap}>
              <RefreshCw size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>
                {pendingActionsCount > 0
                  ? `${pendingActionsCount} Pending Offline Actions`
                  : 'All Data Synchronized'}
              </Text>
              <Text style={styles.syncSub}>
                {pendingActionsCount > 0
                  ? 'Attendance timestamps & quiz logs waiting for internet'
                  : 'Up to date with cooperative servers'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncingButton]}
            onPress={handleSyncNow}
            disabled={isSyncing}
          >
            <RefreshCw size={14} color="#FFFFFF" style={isSyncing ? styles.rotating : undefined} />
            <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>
        </View>

        {/* Local Storage Metrics Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive size={18} color={COLORS.primary} />
            <Text style={styles.storageTitle}>On-Device Course Cache</Text>
          </View>

          <View style={styles.storageBarTrack}>
            <View style={[styles.storageBarFill, { width: '38%' }]} />
          </View>

          <View style={styles.storageDetailsRow}>
            <Text style={styles.storageText}>{totalStorageMb} MB used</Text>
            <Text style={styles.storageText}>8.4 GB available on device</Text>
          </View>
        </View>

        {/* Downloaded Courses List */}
        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>Downloaded Courses ({courses.length})</Text>

          {courses.map((item) => (
            <View key={item.id} style={styles.courseItemCard}>
              <View style={styles.courseHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseTitle}>{item.title}</Text>
                  <Text style={styles.courseSub}>
                    {item.modules_count} lessons • {item.size_mb} MB • Last synced: {item.last_synced}
                  </Text>
                </View>
                <Badge
                  label={item.download_status === 'downloaded' ? 'Ready Offline' : 'Pending'}
                  variant={item.download_status === 'downloaded' ? 'success' : 'warning'}
                />
              </View>

              <View style={styles.courseActionsRow}>
                <TouchableOpacity
                  style={styles.playOfflineBtn}
                  onPress={() => navigation.navigate('CoursePlayer')}
                >
                  <Play size={14} color="#FFFFFF" />
                  <Text style={styles.playOfflineText}>Open Offline Lesson</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => Alert.alert('Remove Download', 'Course files deleted to free storage.')}
                >
                  <Trash2 size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Remote PACS / Village Notice */}
        <View style={styles.villageNoticeCard}>
          <View style={styles.noticeHeader}>
            <WifiOff size={16} color={COLORS.primary} />
            <Text style={styles.noticeTitle}>Built for Rural PACS & Tribal Clusters</Text>
          </View>
          <Text style={styles.noticeDesc}>
            CoopSetu AI allows training in no-connectivity panchayats. Video lessons, transcripts, attendance tokens, and assessments operate 100% offline and auto-reconcile on network restoration.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  syncBanner: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  syncSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  syncButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  syncingButton: {
    backgroundColor: COLORS.primaryLight,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
  },
  storageCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.sm,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  storageBarTrack: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  storageDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  coursesSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  courseItemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.sm,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  courseSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  courseActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    alignItems: 'center',
  },
  playOfflineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: 8,
  },
  playOfflineText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.dangerSurface,
  },
  villageNoticeCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  noticeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
