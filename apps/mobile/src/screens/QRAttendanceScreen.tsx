import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Linking, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { localStore, useLocalStore } from '../services/localStore';
import { formatClock, formatDate } from '../services/utils';
import { CheckCircle2, WifiOff, AlertCircle, Camera, Keyboard, X } from 'lucide-react-native';
import { AttendanceRecordItem } from '../types';

type ScanOutcome =
  | { kind: 'none' }
  | { kind: 'success'; message: string }
  | { kind: 'queued' }
  | { kind: 'error'; title: string; message: string };

const STATUS_LABEL: Record<AttendanceRecordItem['status'], string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
};

export const QRAttendanceScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { pendingScans } = useLocalStore();
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome>({ kind: 'none' });
  const [submitting, setSubmitting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [records, setRecords] = useState<AttendanceRecordItem[] | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const res = await apiService.getAttendanceRecords();
      setRecords(res.records);
      setIsLive(res.isLive);
    } catch {
      setRecords((prev) => prev ?? []);
      setIsLive(false);
    }
  }, []);

  useOnMount(loadRecords);

  // Hardware back closes the camera overlay first instead of leaving the screen.
  useEffect(() => {
    if (!cameraOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setCameraOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [cameraOpen]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const submitToken = async (token: string) => {
    if (submitting) return;
    setSubmitting(true);
    setOutcome({ kind: 'none' });
    const res = await apiService.recordAttendanceScan(token);
    if (!res.isLive) {
      // Server unreachable: keep the token and sync it from Offline learning.
      localStore.enqueueScan(token);
      setOutcome({ kind: 'queued' });
      setManualCode('');
    } else if (res.success) {
      setOutcome({ kind: 'success', message: res.message });
      setManualCode('');
      loadRecords();
    } else {
      setOutcome({ kind: 'error', title: 'Could not record attendance', message: res.message });
    }
    setSubmitting(false);
  };

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setCameraOpen(false);
    submitToken(data);
  };

  const openCamera = async () => {
    let granted = permission?.granted ?? false;
    if (!granted) {
      granted = (await requestPermission()).granted;
    }
    if (!granted) {
      setOutcome({
        kind: 'error',
        title: 'Camera unavailable',
        message: 'Camera access is off. Allow it in system settings, or enter the code manually.',
      });
      return;
    }
    setScanned(false);
    setOutcome({ kind: 'none' });
    setCameraOpen(true);
  };

  if (cameraOpen) {
    return (
      <View style={styles.camera}>
        <StatusBar style="light" />
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcode}
        />
        <View style={[styles.cameraTop, { paddingTop: insets.top + SPACE.sm }]}>
          <TouchableOpacity
            onPress={() => setCameraOpen(false)}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
          >
            <X size={ICON.md} color={COLORS.textInverse} />
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.frameArea, { paddingBottom: insets.bottom + SPACE.xl }]} pointerEvents="none">
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.frameLabel}>Point the camera at the session QR code</Text>
        </View>
      </View>
    );
  }

  const recent = (records ?? []).slice(0, 10);

  return (
    <ScrollScreen
      title="QR attendance"
      onBack={() => navigation.goBack()}
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
      avoidKeyboard
    >
      <View style={styles.actions}>
        <Button
          label="Scan QR code"
          icon={<Camera size={ICON.md} color={COLORS.textInverse} />}
          onPress={openCamera}
          loading={submitting}
        />
        <Button
          label={showManual ? 'Hide manual entry' : 'Enter code manually'}
          variant="secondary"
          icon={<Keyboard size={ICON.md} color={COLORS.primary} />}
          onPress={() => setShowManual((v) => !v)}
        />
      </View>

      {showManual ? (
        <View style={styles.manualCard}>
          <Text style={styles.bodyStrong}>Session code</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Paste or type the code"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => manualCode.trim() && submitToken(manualCode)}
              accessibilityLabel="Session code"
            />
            <TouchableOpacity
              style={[styles.verifyBtn, (!manualCode.trim() || submitting) && styles.verifyBtnDisabled]}
              disabled={!manualCode.trim() || submitting}
              onPress={() => submitToken(manualCode)}
              accessibilityRole="button"
              accessibilityLabel="Submit session code"
            >
              <Text style={styles.verifyText}>{submitting ? 'Sending' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {outcome.kind === 'success' ? (
        <View style={[styles.banner, styles.bannerSuccess]} accessibilityRole="alert">
          <CheckCircle2 size={ICON.lg} color={COLORS.success} />
          <View style={styles.flex}>
            <Text style={styles.bodyStrong}>Attendance recorded</Text>
            <Text style={styles.caption}>{outcome.message}</Text>
          </View>
        </View>
      ) : null}

      {outcome.kind === 'queued' ? (
        <View style={[styles.banner, styles.bannerNeutral]} accessibilityRole="alert">
          <WifiOff size={ICON.lg} color={COLORS.textSecondary} />
          <View style={styles.flex}>
            <Text style={styles.bodyStrong}>Saved on this device</Text>
            <Text style={styles.caption}>
              No connection. Sync it from Offline learning once you are back online.
            </Text>
          </View>
        </View>
      ) : null}

      {outcome.kind === 'error' ? (
        <View style={[styles.banner, styles.bannerError]} accessibilityRole="alert">
          <AlertCircle size={ICON.lg} color={COLORS.danger} />
          <View style={styles.flex}>
            <Text style={styles.bodyStrong}>{outcome.title}</Text>
            <Text style={styles.caption}>{outcome.message}</Text>
          </View>
          {!permission?.granted && permission?.canAskAgain === false ? (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => Linking.openSettings()}
              accessibilityRole="button"
              accessibilityLabel="Open system settings"
            >
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View>
        <SectionHeader title="Recent attendance" />
        <View style={styles.list}>
          {pendingScans.map((scan) => (
            <View key={scan.id} style={styles.item}>
              <View style={styles.flex}>
                <Text style={styles.bodyStrong}>Check-in waiting to sync</Text>
                <Text style={styles.caption}>Today, {formatClock(new Date(scan.queuedAt))}</Text>
              </View>
              <Badge label="Queued" />
            </View>
          ))}
          {records !== null && recent.length === 0 && pendingScans.length === 0 ? (
            <EmptyState title="No attendance yet" message="Scan a session QR code to record your first check-in." />
          ) : null}
          {recent.map((item, i) => (
            <View key={`${item.date}-${item.session}-${i}`} style={styles.item}>
              <View style={styles.flex}>
                <Text style={styles.bodyStrong}>{item.session}</Text>
                <Text style={styles.caption}>{formatDate(item.date)}</Text>
              </View>
              <Badge label={STATUS_LABEL[item.status] ?? item.status} variant={item.status === 'present' ? 'success' : 'neutral'} />
            </View>
          ))}
        </View>
      </View>
    </ScrollScreen>
  );
};

const CORNER = 28;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  caption: { ...TEXT.caption },
  bodyStrong: { ...TEXT.bodyStrong },
  actions: { gap: SPACE.sm },

  // Manual entry
  manualCard: { ...CARD, padding: SPACE.md, gap: SPACE.sm },
  inputRow: { flexDirection: 'row', gap: SPACE.sm },
  input: {
    flex: 1,
    height: HIT + 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.md - SPACE.xs,
    ...TEXT.body,
  },
  verifyBtn: {
    minWidth: 88,
    height: HIT + 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACE.md,
  },
  verifyBtnDisabled: { backgroundColor: COLORS.primaryBorder },
  verifyText: { ...TEXT.bodyStrong, color: COLORS.textInverse },

  // Status banners
  banner: {
    borderRadius: RADII.md,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md - SPACE.xs,
    borderWidth: 1,
  },
  bannerSuccess: { backgroundColor: COLORS.successSurface, borderColor: COLORS.success },
  bannerNeutral: { backgroundColor: COLORS.card, borderColor: COLORS.border },
  bannerError: { backgroundColor: COLORS.dangerSurface, borderColor: COLORS.danger },
  settingsBtn: { minHeight: HIT, justifyContent: 'center', paddingHorizontal: SPACE.sm },
  settingsText: { ...TEXT.bodyStrong, color: COLORS.primary },

  // History
  list: { gap: SPACE.sm },
  item: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },

  // Camera overlay
  camera: { flex: 1, backgroundColor: COLORS.media },
  cameraTop: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: SPACE.md },
  closeBtn: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.scrim,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.pill,
    alignSelf: 'flex-start',
  },
  closeText: { ...TEXT.bodyStrong, color: COLORS.textInverse },
  frameArea: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { width: 240, height: 240 },
  frameLabel: {
    ...TEXT.body,
    color: COLORS.textInverse,
    textAlign: 'center',
    marginTop: SPACE.md,
    paddingHorizontal: SPACE.lg,
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: COLORS.textInverse },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
});
