import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { PillTabs } from '../components/PillTabs';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { localStore, useLocalStore } from '../services/localStore';
import { formatDate, plural } from '../services/utils';
import { Download, RefreshCw, Trash2, Play } from 'lucide-react-native';
import { Course, OfflinePackage } from '../types';

type OfflineTab = 'downloaded' | 'available';

export const OfflineLearningScreen = ({ navigation }: any) => {
  const { downloads, pendingScans } = useLocalStore();
  const [catalog, setCatalog] = useState<OfflinePackage[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [tab, setTab] = useState<OfflineTab>('downloaded');
  const [isLive, setIsLive] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiService.getOfflinePackages();
      setCatalog(res.packages);
      setIsLive(res.isLive);
      // The server knows what this account downloaded; mirror it (with lesson content) locally.
      if (res.isLive) {
        localStore.setDownloads(
          res.packages
            .filter((p) => p.downloaded)
            .map((p) => ({ course: p.course, savedAt: p.downloaded_at ?? new Date().toISOString() }))
        );
      }
    } catch {
      setCatalog((prev) => prev ?? []);
      setIsLive(false);
    }
  }, []);

  useOnMount(load);

  const downloaded = Object.values(downloads);
  const available = (catalog ?? []).filter((p) => !downloads[p.course_id]);

  const tabs = [
    { key: 'downloaded' as const, label: `Downloaded (${downloaded.length})` },
    { key: 'available' as const, label: `Available (${available.length})` },
  ];

  const confirmRemove = (course: Course) =>
    Alert.alert('Remove download', `Remove "${course.title}" from this device?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void removeDownload(course) },
    ]);

  const downloadPackage = async (pkg: OfflinePackage) => {
    setBusyId(pkg.course_id);
    setActionError('');
    try {
      const saved = await apiService.downloadOfflinePackage(pkg.course_id);
      localStore.saveDownload(saved.course ?? pkg.course);
    } catch {
      setActionError(`Could not download "${pkg.title}". Check your connection and try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const removeDownload = async (course: Course) => {
    setBusyId(course.id);
    setActionError('');
    try {
      await apiService.removeOfflinePackage(course.id);
      localStore.removeDownload(course.id);
    } catch {
      setActionError(`Could not remove "${course.title}". Check your connection and try again.`);
    } finally {
      setBusyId(null);
    }
  };

  // Re-submit every queued attendance scan. A scan leaves the queue once the
  // server has answered (recorded, or rejected e.g. as a duplicate); scans that
  // still cannot reach the server stay queued.
  const syncNow = async () => {
    setSyncing(true);
    setSyncResult('');
    const queue = localStore.getState().pendingScans;
    const answered: string[] = [];
    let recorded = 0;
    for (const scan of queue) {
      const res = await apiService.recordAttendanceScan(scan.token);
      if (res.isLive) {
        answered.push(scan.id);
        if (res.success) recorded += 1;
      }
    }
    localStore.dropScans(answered);
    const remaining = queue.length - answered.length;
    setSyncResult(
      remaining === 0
        ? `${plural(recorded, 'check-in')} synced.`
        : `${plural(recorded, 'check-in')} synced. ${remaining} could not reach the server.`
    );
    setSyncing(false);
  };

  return (
    <ScrollScreen
      title="Offline learning"
      onBack={() => navigation.goBack()}
      isLive={isLive}
      sticky={<PillTabs tabs={tabs} active={tab} onChange={setTab} fill />}
    >
      {actionError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {actionError}
        </Text>
      ) : null}

      {tab === 'downloaded' ? (
        downloaded.length === 0 ? (
          <EmptyState
            title="Nothing downloaded"
            message="Download a course from the Available tab to open it without a connection."
            actionLabel="Browse available"
            onAction={() => setTab('available')}
          />
        ) : (
          <View style={styles.list}>
            {downloaded.map(({ course, savedAt }) => (
              <View key={course.id} style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.title} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={styles.caption}>
                    {course.modules ? `${plural(course.modules.length, 'lesson')} · ` : ''}
                    Saved {formatDate(savedAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.roundBtn, styles.openBtn]}
                  onPress={() => navigation.navigate('CoursePlayer', { course })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${course.title}`}
                >
                  <Play size={ICON.md} color={COLORS.textInverse} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roundBtn, styles.removeBtn]}
                  onPress={() => confirmRemove(course)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove download ${course.title}`}
                >
                  <Trash2 size={ICON.md} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )
      ) : catalog === null ? (
        <LoadingState />
      ) : available.length === 0 ? (
        <EmptyState title="All courses downloaded" />
      ) : (
        <View style={styles.list}>
          {available.map((pkg) => (
            <View key={pkg.course_id} style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.title} numberOfLines={2}>
                  {pkg.title}
                </Text>
                <Text style={styles.caption}>
                  {[
                    typeof pkg.lesson_count === 'number' ? plural(pkg.lesson_count, 'lesson') : '',
                    typeof pkg.size_kb === 'number' ? `${Math.max(1, Math.round(pkg.size_kb))} KB` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.downloadBtn, busyId === pkg.course_id && styles.downloadBusy]}
                onPress={() => downloadPackage(pkg)}
                disabled={busyId !== null}
                accessibilityRole="button"
                accessibilityLabel={`Download ${pkg.title}`}
                accessibilityState={{ disabled: busyId !== null, busy: busyId === pkg.course_id }}
              >
                <Download size={ICON.md} color={COLORS.primary} />
                <Text style={styles.downloadText}>{busyId === pkg.course_id ? 'Saving' : 'Download'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View>
        <SectionHeader title="Attendance sync" />
        <View style={styles.syncCard}>
          <Text style={styles.body}>
            {pendingScans.length > 0
              ? `${plural(pendingScans.length, 'check-in')} waiting to sync`
              : 'No check-ins waiting to sync'}
          </Text>
          {syncResult ? <Text style={styles.caption}>{syncResult}</Text> : null}
          <Button
            label="Sync now"
            icon={<RefreshCw size={ICON.md} color={COLORS.textInverse} />}
            onPress={syncNow}
            loading={syncing}
            disabled={pendingScans.length === 0}
          />
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: SPACE.sm },
  row: {
    ...CARD,
    padding: SPACE.md - SPACE.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  title: { ...TEXT.bodyStrong },
  caption: { ...TEXT.caption },
  body: { ...TEXT.body },
  roundBtn: {
    width: HIT,
    height: HIT,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: { backgroundColor: COLORS.primary },
  removeBtn: { backgroundColor: COLORS.dangerSurface },
  downloadBtn: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md - SPACE.xs,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  downloadBusy: { opacity: 0.5 },
  error: { ...TEXT.caption, color: COLORS.danger },
  downloadText: { ...TEXT.bodyStrong, color: COLORS.primary },
  syncCard: { ...CARD, padding: SPACE.md, gap: SPACE.sm },
});
