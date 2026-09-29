import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  HardDrive,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  ChevronLeft,
} from 'lucide-react-native';
import * as Network from 'expo-network';
import { COLORS, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ProgressBar } from '../../components/ProgressBar';
import { Badge } from '../../components/Badge';
import {
  getPendingOutboxActions,
  getAllCachedCourses,
  clearAllCache,
  deleteCachedEntity,
  cacheEntity,
  syncPendingOutbox,
  getDbStats,
  deleteOutboxAction,
  OutboxItem,
} from '../../services/offlineDb';
import { apiService } from '../../services/api';
import { Course, OfflinePackage } from '../../types';

interface CachedCourseItem {
  id: string;
  data: Course;
  updated_at: number;
}

export const SyncStorageScreen: React.FC = () => {
  const { t } = useTranslation(['offline', 'common']);
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [dbStats, setDbStats] = useState({
    pendingOutbox: 0,
    totalOutbox: 0,
    cachedCoursesCount: 0,
    cachedCoursesSizeKb: 0,
  });

  const [pendingActions, setPendingActions] = useState<OutboxItem[]>([]);
  const [cachedCourses, setCachedCourses] = useState<CachedCourseItem[]>([]);
  const [packages, setPackages] = useState<OfflinePackage[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const reloadData = useCallback(async () => {
    try {
      const net = await Network.getNetworkStateAsync();
      const online = Boolean(net.isConnected && net.isInternetReachable !== false);
      setIsOnline(online);

      const stats = await getDbStats();
      setDbStats(stats);

      const pending = await getPendingOutboxActions();
      setPendingActions(pending);

      const cached = await getAllCachedCourses<Course>();
      setCachedCourses(cached);

      if (online) {
        try {
          const res = await apiService.getOfflinePackages();
          if (res.packages && res.packages.length > 0) {
            setPackages(res.packages);
          }
        } catch {
          // Keep existing local packages
        }
      }
    } catch (err) {
      console.warn('Failed to load offline storage data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      Network.getNetworkStateAsync(),
      getDbStats(),
      getPendingOutboxActions(),
      getAllCachedCourses<Course>(),
    ])
      .then(async ([net, stats, pending, cached]) => {
        if (!active) return;
        const online = Boolean(net.isConnected && net.isInternetReachable !== false);
        setIsOnline(online);
        setDbStats(stats);
        setPendingActions(pending);
        setCachedCourses(cached);

        if (online) {
          try {
            const res = await apiService.getOfflinePackages();
            if (active && res.packages && res.packages.length > 0) {
              setPackages(res.packages);
            }
          } catch {
            // Keep existing local packages
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load offline storage data:', err);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    void reloadData();
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert(
        t('offline:statusOffline', 'Offline Mode'),
        'Cannot sync while offline. Please connect to internet to sync your changes.'
      );
      return;
    }

    if (pendingActions.length === 0) {
      Alert.alert(t('common:appName', 'CoopSetu AI'), 'No pending actions in outbox.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingOutbox();
      await reloadData();
      Alert.alert(
        t('offline:syncNow', 'Sync Complete'),
        `Processed ${result.total} actions: ${result.succeeded} synced successfully, ${result.failed} failed.`
      );
    } catch {
      Alert.alert(t('common:error', 'Sync Failed'), 'An error occurred while syncing outbox items.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Local Cache',
      'This will remove all downloaded course materials from your device. Pending outbox records will remain safe.',
      [
        { text: t('common:cancel', 'Cancel'), style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllCache();
              await reloadData();
              Alert.alert('Cache Cleared', 'All locally cached course data has been deleted.');
            } catch {
              Alert.alert(t('common:error', 'Error'), 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadCourse = async (pkg: OfflinePackage) => {
    const courseId = pkg.course_id;
    setDownloadingId(courseId);
    setDownloadProgress((prev) => ({ ...prev, [courseId]: 15 }));

    try {
      // Simulate stepped progress for smooth UX while fetching
      const interval = setInterval(() => {
        setDownloadProgress((prev) => {
          const current = prev[courseId] ?? 15;
          if (current >= 85) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [courseId]: current + 20 };
        });
      }, 200);

      const downloaded = await apiService.downloadOfflinePackage(courseId);
      clearInterval(interval);

      setDownloadProgress((prev) => ({ ...prev, [courseId]: 100 }));

      // Store in SQLite database
      await cacheEntity('cached_courses', courseId, downloaded.course);

      setTimeout(async () => {
        setDownloadingId(null);
        setDownloadProgress((prev) => {
          const copy = { ...prev };
          delete copy[courseId];
          return copy;
        });
        await reloadData();
      }, 500);
    } catch {
      setDownloadingId(null);
      setDownloadProgress((prev) => {
        const copy = { ...prev };
        delete copy[courseId];
        return copy;
      });
      Alert.alert(t('common:error', 'Download Failed'), 'Could not download the package. Please try again.');
    }
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    Alert.alert(
      t('offline:deleteDownload', 'Remove Download'),
      `Remove "${title}" from offline storage?`,
      [
        { text: t('common:cancel', 'Cancel'), style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCachedEntity('cached_courses', courseId);
              try {
                if (isOnline) {
                  await apiService.removeOfflinePackage(courseId);
                }
              } catch {
                // Ignore server removal error
              }
              await reloadData();
            } catch {
              Alert.alert(t('common:error', 'Error'), 'Could not remove course from local storage.');
            }
          },
        },
      ]
    );
  };

  const handleDeletePendingItem = (id: string, actionName: string) => {
    Alert.alert(
      'Remove Outbox Action',
      `Discard pending action "${actionName}"? This cannot be undone.`,
      [
        { text: t('common:cancel', 'Cancel'), style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await deleteOutboxAction(id);
            await reloadData();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('common:loading', 'Loading...')}</Text>
      </SafeAreaView>
    );
  }

  const isCourseCached = (courseId: string) => cachedCourses.some((c) => c.id === courseId);
  const storageMegabytes = (dbStats.cachedCoursesSizeKb / 1024).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('common:back', 'Back')}
          >
            <ChevronLeft size={ICON.lg} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t('offline:offlineTitle', 'Offline Storage & Sync')}</Text>
          <View style={styles.networkStatusRow}>
            {isOnline ? (
              <Badge label={t('common:online', 'Online')} variant="success" verified />
            ) : (
              <Badge label={t('common:offline', 'Offline')} variant="neutral" />
            )}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Storage Usage Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <HardDrive size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardTitle}>Local SQLite Storage</Text>
              <Text style={styles.cardSubtitle}>Device storage used by CoopSetu offline packages</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{dbStats.cachedCoursesCount}</Text>
              <Text style={styles.statLabel}>Saved Courses</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{storageMegabytes} MB</Text>
              <Text style={styles.statLabel}>Database Usage</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{dbStats.pendingOutbox}</Text>
              <Text style={styles.statLabel}>Pending Sync</Text>
            </View>
          </View>

          <View style={styles.storageUsageBarContainer}>
            <View style={styles.storageUsageHeader}>
              <Text style={styles.storageUsageLabel}>Offline Cache Allocation</Text>
              <Text style={styles.storageUsagePercent}>
                {Math.min(100, Math.round((dbStats.cachedCoursesSizeKb / (50 * 1024)) * 100))}% of 50 MB
              </Text>
            </View>
            <ProgressBar
              value={Math.min(100, (dbStats.cachedCoursesSizeKb / (50 * 1024)) * 100)}
              height={8}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.clearButton, dbStats.cachedCoursesCount === 0 && styles.disabledButton]}
              onPress={handleClearCache}
              disabled={dbStats.cachedCoursesCount === 0}
            >
              <Trash2 size={ICON.sm} color={COLORS.danger} />
              <Text style={styles.clearButtonText}>Clear Local Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Outbox Queue Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <RefreshCw size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardTitle}>{t('offline:pendingActions', 'Pending Outbox Actions')}</Text>
              <Text style={styles.cardSubtitle}>
                {pendingActions.length === 0
                  ? 'All local actions are synced with the cloud.'
                  : `${pendingActions.length} item(s) waiting to sync.`}
              </Text>
            </View>
          </View>

          {pendingActions.length > 0 ? (
            <View style={styles.queueList}>
              {pendingActions.map((item) => {
                let summary = item.action;
                try {
                  const p = JSON.parse(item.payload);
                  if (p.qr_token) summary = `QR Token: ${String(p.qr_token).slice(0, 16)}...`;
                  else if (p.lesson_id) summary = `Lesson: ${String(p.lesson_id).slice(0, 8)}...`;
                  else if (p.module_id) summary = `Module: ${String(p.module_id).slice(0, 8)}...`;
                } catch {
                  // Fallback to action
                }

                return (
                  <View key={item.id} style={styles.queueItem}>
                    <View style={styles.queueItemContent}>
                      <View style={styles.queueItemHeader}>
                        <Badge label={item.action} variant="primary" />
                        <View style={styles.timeRow}>
                          <Clock size={12} color={COLORS.textMuted} />
                          <Text style={styles.timeText}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.queueItemPayload} numberOfLines={1}>
                        {summary}
                      </Text>
                      {item.attempts > 0 && (
                        <Text style={styles.attemptText}>
                          Retries: {item.attempts}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.discardButton}
                      onPress={() => handleDeletePendingItem(item.id, item.action)}
                      accessibilityLabel="Discard action"
                    >
                      <Trash2 size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyOutbox}>
              <CheckCircle2 size={36} color={COLORS.success} />
              <Text style={styles.emptyOutboxTitle}>Outbox Clean</Text>
              <Text style={styles.emptyOutboxSubtitle}>
                {t('offline:statusSynced', 'All offline changes synced successfully.')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.syncNowButton,
              (pendingActions.length === 0 || isSyncing || !isOnline) && styles.disabledButton,
            ]}
            onPress={handleSyncNow}
            disabled={pendingActions.length === 0 || isSyncing || !isOnline}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={COLORS.textInverse} />
            ) : (
              <RefreshCw size={ICON.sm} color={COLORS.textInverse} />
            )}
            <Text style={styles.syncNowButtonText}>
              {isSyncing ? 'Syncing...' : t('offline:syncNow', 'Sync Now')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Offline Packages Download Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Download size={22} color={COLORS.primary} />
            </View>
            <View style={styles.cardTitleBox}>
              <Text style={styles.cardTitle}>{t('offline:downloadedCourses', 'Downloaded Courses')}</Text>
              <Text style={styles.cardSubtitle}>Available lessons for learning without internet</Text>
            </View>
          </View>

          {/* List of cached courses */}
          {cachedCourses.length > 0 ? (
            <View style={styles.coursesList}>
              {cachedCourses.map((item) => {
                const title = item.data?.title ?? `Course ${item.id}`;
                const modulesCount = item.data?.modules?.length ?? 0;
                return (
                  <View key={item.id} style={styles.courseRow}>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={styles.courseMeta}>
                        {modulesCount} module(s) • Saved locally
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.courseDeleteButton}
                      onPress={() => handleDeleteCourse(item.id, title)}
                    >
                      <Trash2 size={ICON.sm} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCourses}>
              <Text style={styles.emptyCoursesText}>
                No courses downloaded yet. Download below to study offline.
              </Text>
            </View>
          )}

          {/* Server packages to download */}
          {packages.length > 0 && (
            <View style={styles.availablePackagesSection}>
              <Text style={styles.packagesSectionTitle}>Available Course Packages</Text>
              {packages.map((pkg) => {
                const cached = isCourseCached(pkg.course_id);
                const isDownloading = downloadingId === pkg.course_id;
                const progress = downloadProgress[pkg.course_id] ?? 0;

                return (
                  <View key={pkg.course_id} style={styles.packageCard}>
                    <View style={styles.packageCardHeader}>
                      <View style={styles.packageInfo}>
                        <Text style={styles.packageTitle}>{pkg.title}</Text>
                        <Text style={styles.packageMeta}>
                          {pkg.lesson_count ? `${pkg.lesson_count} lessons • ` : ''}
                          {pkg.size_kb ? `${Math.round(pkg.size_kb)} KB` : 'Offline Package'}
                        </Text>
                      </View>
                      {cached ? (
                        <Badge label="Saved" variant="success" verified />
                      ) : (
                        <TouchableOpacity
                          style={[styles.downloadButton, isDownloading && styles.disabledButton]}
                          onPress={() => handleDownloadCourse(pkg)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <>
                              <Download size={14} color={COLORS.primary} />
                              <Text style={styles.downloadButtonText}>Download</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    {isDownloading && (
                      <View style={styles.packageProgress}>
                        <ProgressBar value={progress} height={6} color={COLORS.primary} />
                        <Text style={styles.packageProgressText}>Downloading package... {progress}%</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    marginTop: SPACE.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: SPACE.sm,
    padding: SPACE.xs,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...TEXT.section,
    fontSize: 18,
  },
  networkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACE.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    ...TEXT.bodyStrong,
    fontSize: 16,
  },
  cardSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statValue: {
    ...TEXT.title,
    fontSize: 18,
    color: COLORS.primary,
  },
  statLabel: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  storageUsageBarContainer: {
    gap: SPACE.xs,
  },
  storageUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageUsageLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  storageUsagePercent: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADII.sm,
  },
  clearButtonText: {
    ...TEXT.captionStrong,
    color: COLORS.danger,
  },
  queueList: {
    gap: SPACE.xs,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  queueItemContent: {
    flex: 1,
    gap: 4,
  },
  queueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: SPACE.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  queueItemPayload: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  attemptText: {
    ...TEXT.caption,
    color: '#D97706',
    fontSize: 10,
  },
  discardButton: {
    padding: SPACE.xs,
  },
  emptyOutbox: {
    alignItems: 'center',
    paddingVertical: SPACE.md,
    gap: SPACE.xs,
  },
  emptyOutboxTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
    marginTop: SPACE.xs,
  },
  emptyOutboxSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  syncNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
    gap: SPACE.xs,
  },
  syncNowButtonText: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
  },
  disabledButton: {
    opacity: 0.5,
  },
  coursesList: {
    gap: SPACE.xs,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    ...TEXT.bodyStrong,
    fontSize: 14,
  },
  courseMeta: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  courseDeleteButton: {
    padding: SPACE.xs,
  },
  emptyCourses: {
    paddingVertical: SPACE.sm,
  },
  emptyCoursesText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  availablePackagesSection: {
    marginTop: SPACE.xs,
    gap: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACE.sm,
  },
  packagesSectionTitle: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    marginBottom: SPACE.xs,
  },
  packageCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACE.xs,
  },
  packageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageInfo: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  packageTitle: {
    ...TEXT.bodyStrong,
    fontSize: 14,
  },
  packageMeta: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  downloadButtonText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  packageProgress: {
    marginTop: SPACE.xs,
    gap: 4,
  },
  packageProgressText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});

export default SyncStorageScreen;
