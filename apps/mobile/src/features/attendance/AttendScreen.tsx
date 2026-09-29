import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { IconChip } from '../../components/IconChip';
import { apiService, normalizeAttendanceToken } from '../../services/api';
import { localStore } from '../../services/localStore';
import { useNfcScan } from '../../hooks/useNfcScan';
import { attendanceApi, AttendanceSessionInfo } from './attendanceApi';
import {
  QrCode,
  Radio,
  ScanFace,
  Keyboard,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flashlight,
  WifiOff,
  History,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

export const AttendScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Attend'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const initialMethod = route.params?.method || 'qr';
  const targetSessionId = route.params?.sessionId;

  const [activeTab, setActiveTab] = useState<'qr' | 'nfc' | 'face' | 'manual'>(
    initialMethod === 'face' ? 'face' : initialMethod === 'nfc' ? 'nfc' : 'qr'
  );

  const [sessions, setSessions] = useState<AttendanceSessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [manualPin, setManualPin] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    isLive: boolean;
    timestamp?: string;
  } | null>(null);

  // NFC Scan Hook
  const nfc = useNfcScan();

  // Load active sessions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await attendanceApi.getActiveSessions();
        if (mounted) {
          setSessions(list);
          if (targetSessionId) {
            const found = list.find((s) => s.session_id === targetSessionId);
            setSelectedSession(found || list[0] || null);
          } else {
            setSelectedSession(list[0] || null);
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
  }, [targetSessionId]);

  const submitAttendanceToken = async (rawToken: string, methodLabel: string) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await apiService.recordAttendanceScan(rawToken);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!res.isLive) {
        localStore.enqueueScan(rawToken);
        setScanResult({
          success: true,
          message: 'Saved in offline queue. Will sync automatically when reconnected.',
          isLive: false,
          timestamp: nowStr,
        });
      } else {
        setScanResult({
          success: res.success,
          message: res.success ? `Attendance recorded via ${methodLabel}` : res.message,
          isLive: true,
          timestamp: nowStr,
        });
      }
    } catch {
      localStore.enqueueScan(rawToken);
      setScanResult({
        success: true,
        message: 'Saved to local device cache. Will sync once connected.',
        isLive: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (submitting || scanResult) return;
    submitAttendanceToken(data, 'Dynamic QR Code');
  };

  const handleSimulateScan = () => {
    const demoToken = `coopsetu:attend:${selectedSession?.session_id || 'sess-1'}.992.834fc019`;
    submitAttendanceToken(demoToken, 'QR Scanner');
  };

  // Dev-only fallback: fabricates a tag string instead of a real NFC read.
  // Only ever shown/used when real NFC hardware is unsupported/unavailable
  // on this device (Expo Go, or an emulator/device with no NFC radio) — see
  // the 'nfc' tab render below, which picks this vs. the real scan based on
  // `nfc.status`.
  const handleNfcTapSimulate = () => {
    const demoNfcTag = `coopsetu:attend:${selectedSession?.session_id || 'sess-1'}.nfc.019a7`;
    submitAttendanceToken(demoNfcTag, 'NFC Contactless (Simulated)');
  };

  // Real NFC path: waits for an actual tag read via useNfcScan and submits
  // its literal contents. Only reachable when nfc.status === 'ready'.
  const handleRealNfcTap = () => {
    nfc.start((token) => submitAttendanceToken(token, 'NFC Contactless'));
  };

  const handleManualPinSubmit = () => {
    if (manualPin.trim().length < 4) {
      Alert.alert('Invalid PIN', 'Please enter a valid attendance session PIN (at least 4 digits).');
      return;
    }
    const token = `coopsetu:attend:${selectedSession?.session_id || 'sess-1'}.${manualPin.trim()}`;
    submitAttendanceToken(token, 'Manual PIN');
  };

  return (
    <ScrollScreen
      title="Check In Attendance"
      subtitle="Multi-Modal Digital Attendance"
      onBack={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('AttendanceHistory')}
          accessibilityRole="button"
          accessibilityLabel="Attendance History"
        >
          <History size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Active Session Info Card */}
        {selectedSession ? (
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeaderRow}>
              <Badge label="ACTIVE SESSION" variant="success" verified />
              <View style={styles.timeTag}>
                <Clock size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.timeTagText}>Window Open</Text>
              </View>
            </View>

            <Text style={styles.sessionTitle}>{selectedSession.session_name}</Text>

            <View style={styles.sessionDetails}>
              {selectedSession.room ? (
                <View style={styles.sessionDetailRow}>
                  <Building size={ICON.sm} color={COLORS.textMuted} />
                  <Text style={styles.sessionDetailText}>{selectedSession.room}</Text>
                </View>
              ) : null}
              <View style={styles.sessionDetailRow}>
                <ShieldCheck size={ICON.sm} color={COLORS.textMuted} />
                <Text style={styles.sessionDetailText}>
                  Rotating Anti-Proxy TOTP · Methods: {selectedSession.allowed_methods.join(', ').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noSessionCard}>
            <Clock size={ICON.md} color={COLORS.textMuted} />
            <Text style={styles.noSessionText}>No active attendance session currently open for your batch.</Text>
          </View>
        )}

        {/* Method Selector Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'qr' && styles.tabBtnActive]}
            onPress={() => setActiveTab('qr')}
          >
            <QrCode size={ICON.sm} color={activeTab === 'qr' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === 'qr' && styles.tabBtnTextActive]}>QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'nfc' && styles.tabBtnActive]}
            onPress={() => setActiveTab('nfc')}
          >
            <Radio size={ICON.sm} color={activeTab === 'nfc' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === 'nfc' && styles.tabBtnTextActive]}>NFC Tap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'face' && styles.tabBtnActive]}
            onPress={() => setActiveTab('face')}
          >
            <ScanFace size={ICON.sm} color={activeTab === 'face' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === 'face' && styles.tabBtnTextActive]}>Face</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'manual' && styles.tabBtnActive]}
            onPress={() => setActiveTab('manual')}
          >
            <Keyboard size={ICON.sm} color={activeTab === 'manual' ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === 'manual' && styles.tabBtnTextActive]}>PIN</Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: QR Scanner */}
        {activeTab === 'qr' ? (
          <View style={styles.scannerWrapper}>
            <View style={styles.cameraBox}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torchOn}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />

              {/* Viewfinder Cutout */}
              <View style={styles.viewfinderScrim}>
                <View style={styles.viewfinderReticle}>
                  <View style={[styles.reticleCorner, styles.cornerTL]} />
                  <View style={[styles.reticleCorner, styles.cornerTR]} />
                  <View style={[styles.reticleCorner, styles.cornerBL]} />
                  <View style={[styles.reticleCorner, styles.cornerBR]} />
                </View>
                <Text style={styles.reticleHint}>Align classroom dynamic QR code inside box</Text>
              </View>

              {/* Torch Toggle */}
              <TouchableOpacity
                style={[styles.torchBtn, torchOn && styles.torchBtnActive]}
                onPress={() => setTorchOn((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Toggle Flashlight"
              >
                <Flashlight size={ICON.md} color={torchOn ? COLORS.primaryDark : COLORS.textInverse} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.mockScanBtn} onPress={handleSimulateScan}>
              <Text style={styles.mockScanText}>Simulate QR Scan (Test / Emulator)</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Tab 2: NFC Tap */}
        {activeTab === 'nfc' ? (
          <View style={styles.nfcCard}>
            <View style={styles.nfcRadarCircle}>
              <Radio size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.nfcTitle}>
              {nfc.status === 'ready' ? 'Ready to Tap Contactless NFC' : 'NFC Contactless Check-In'}
            </Text>
            <Text style={styles.nfcDesc}>
              Hold your smartphone close to the trainer&apos;s NFC terminal or attendance reader at the entrance.
            </Text>
            <Badge label={`NFC Hardware: ${nfc.status.toUpperCase()}`} variant="neutral" />

            {nfc.error ? <Text style={styles.nfcErrorText}>{nfc.error.message}</Text> : null}

            {nfc.status === 'ready' ? (
              // Real hardware is available on this device — use the actual
              // NFC read from useNfcScan. Never substitute a fake tap here.
              <Button
                label={nfc.scanning ? 'Hold near tag…' : 'Tap to Scan (Real NFC)'}
                icon={<Radio size={ICON.md} color={COLORS.textInverse} />}
                onPress={handleRealNfcTap}
                loading={nfc.scanning}
                disabled={submitting}
              />
            ) : nfc.status === 'disabled' ? (
              <Button
                label="Turn On NFC in Settings"
                variant="secondary"
                onPress={() => nfc.openSettings()}
              />
            ) : (
              // status is 'unsupported' or 'unavailable': no real NFC radio,
              // or running in Expo Go without the native module. This is the
              // ONLY case where the dev-only simulate path is shown, and it
              // is labeled as such rather than passed off as a real tap.
              <TouchableOpacity style={styles.mockNfcBtn} onPress={handleNfcTapSimulate}>
                <Text style={styles.mockNfcText}>Simulate (Dev Only) — No NFC Hardware Detected</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Tab 3: Face Verify */}
        {activeTab === 'face' ? (
          <View style={styles.faceCard}>
            <View style={styles.faceIconCircle}>
              <ScanFace size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.faceTitle}>Biometric Face Verification</Text>
            <Text style={styles.faceDesc}>
              Verify your attendance using encrypted facial biometrics conforming to Digital Personal Data Protection
              (DPDP) regulations.
            </Text>

            <Button
              label="Open Face Biometric Verification"
              icon={<ScanFace size={ICON.md} color={COLORS.textInverse} />}
              onPress={() => navigation.navigate('FaceEnrol', { mode: 'self' })}
            />
          </View>
        ) : null}

        {/* Tab 4: Manual PIN Fallback */}
        {activeTab === 'manual' ? (
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>Manual Session PIN</Text>
            <Text style={styles.manualDesc}>
              If your camera or NFC is unavailable, enter the 4 to 6-digit session security PIN announced by your
              trainer.
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder="e.g. 8492"
              placeholderTextColor={COLORS.textMuted}
              value={manualPin}
              onChangeText={setManualPin}
              keyboardType="number-pad"
              maxLength={8}
            />

            <Button
              label={submitting ? 'Submitting...' : 'Submit Session PIN'}
              onPress={handleManualPinSubmit}
              loading={submitting}
            />
          </View>
        ) : null}

        {/* Offline notice */}
        <View style={styles.offlineNotice}>
          <WifiOff size={ICON.sm} color={COLORS.textSecondary} />
          <Text style={styles.offlineNoticeText}>
            Attendance is offline-resilient. Scans captured offline are queued securely and sync when network resumes.
          </Text>
        </View>

        {/* Scan Confirmation Modal */}
        <Modal visible={!!scanResult} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.resultModalCard}>
              <View style={styles.resultIconWrapper}>
                {scanResult?.success ? (
                  <CheckCircle2 size={54} color={COLORS.success} />
                ) : (
                  <XCircle size={54} color={COLORS.danger} />
                )}
              </View>

              <Text style={styles.resultModalTitle}>
                {scanResult?.success ? 'Attendance Recorded!' : 'Check-In Failed'}
              </Text>

              <Text style={styles.resultModalMessage}>{scanResult?.message}</Text>

              {scanResult?.timestamp ? (
                <View style={styles.resultTimeBadge}>
                  <Clock size={ICON.sm} color={COLORS.textSecondary} />
                  <Text style={styles.resultTimeText}>Recorded at {scanResult.timestamp}</Text>
                </View>
              ) : null}

              <Button
                label="Done"
                onPress={() => {
                  setScanResult(null);
                  if (scanResult?.success) {
                    navigation.navigate('AttendanceHistory');
                  }
                }}
              />
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
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  historyBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  sessionCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    backgroundColor: COLORS.card,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  sessionTitle: {
    ...TEXT.section,
    fontSize: 16,
    color: COLORS.primaryDark,
  },
  sessionDetails: {
    gap: 4,
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  sessionDetailText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  noSessionCard: {
    ...CARD,
    padding: SPACE.lg,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  noSessionText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.sm,
  },
  tabBtnActive: {
    backgroundColor: COLORS.card,
    elevation: 1,
  },
  tabBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
  },
  scannerWrapper: {
    gap: SPACE.sm,
  },
  cameraBox: {
    height: 300,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  viewfinderScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: SPACE.md,
  },
  viewfinderReticle: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  reticleCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  reticleHint: {
    ...TEXT.caption,
    color: COLORS.textInverse,
    textAlign: 'center',
    paddingHorizontal: SPACE.md,
  },
  torchBtn: {
    position: 'absolute',
    top: SPACE.md,
    right: SPACE.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: '#FFF',
  },
  mockScanBtn: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mockScanText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  nfcCard: {
    ...CARD,
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.md,
  },
  nfcRadarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  nfcTitle: {
    ...TEXT.section,
    textAlign: 'center',
  },
  nfcDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  mockNfcBtn: {
    marginTop: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  mockNfcText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  nfcErrorText: {
    ...TEXT.caption,
    color: COLORS.danger,
    textAlign: 'center',
  },
  faceCard: {
    ...CARD,
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.md,
  },
  faceIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  faceTitle: {
    ...TEXT.section,
    textAlign: 'center',
  },
  faceDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  manualCard: {
    ...CARD,
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  manualTitle: {
    ...TEXT.section,
  },
  manualDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.md,
    height: HIT + 6,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    color: COLORS.primaryDark,
    backgroundColor: COLORS.surface,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    padding: SPACE.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
  },
  offlineNoticeText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
  resultModalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    alignItems: 'center',
    gap: SPACE.md,
  },
  resultIconWrapper: {
    marginVertical: SPACE.xs,
  },
  resultModalTitle: {
    ...TEXT.section,
    fontSize: 18,
  },
  resultModalMessage: {
    ...TEXT.body,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  resultTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultTimeText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
});
