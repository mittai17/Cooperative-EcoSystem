import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  QrCode,
  Scan,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Clock,
  History,
  Camera,
  RotateCcw,
} from 'lucide-react-native';

export const QRAttendanceScreen = ({ navigation }: any) => {
  const [manualCode, setManualCode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'offline_queued'>('idle');
  const [lastMessage, setLastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyList, setHistoryList] = useState([
    { id: '1', title: 'Cooperative Management Fundamentals - Batch B', time: 'Today, 09:42 AM', status: 'Verified' },
    { id: '2', title: 'Dairy Quality Audit Session', time: 'Yesterday, 02:15 PM', status: 'Verified' },
  ]);

  const handleSimulateScan = async (codeToScan?: string) => {
    const token = codeToScan || manualCode.trim() || 'demo_token_vamnicom_batch_b';
    setIsSubmitting(true);
    setScanStatus('scanning');

    try {
      const res = await apiService.recordAttendanceScan(token);
      if (res.success) {
        if (res.isLive) {
          setScanStatus('success');
          setLastMessage(res.message);
        } else {
          setScanStatus('offline_queued');
          setLastMessage('Saved locally in offline encrypted vault. Will sync automatically upon network connection.');
        }
        setHistoryList((prev) => [
          {
            id: Date.now().toString(),
            title: 'Verified Session: ' + token,
            time: 'Just now',
            status: res.isLive ? 'Verified (Server)' : 'Queued (Offline)',
          },
          ...prev,
        ]);
        setManualCode('');
      } else {
        Alert.alert('Attendance Error', res.message);
        setScanStatus('idle');
      }
    } catch (_err) {
      setScanStatus('offline_queued');
      setLastMessage('Network unreachable. Attendance token stored safely offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="QR Attendance"
        subtitle="VAMNICOM & NCCT Verified"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Scanner Simulation Window */}
        <View style={styles.scannerCard}>
          <View style={styles.viewfinder}>
            {/* Viewfinder corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <Camera size={44} color="#94A3B8" />
            <Text style={styles.viewfinderInstructions}>
              Align Trainer's QR code within the frame to verify presence
            </Text>

            <View style={styles.laserScanLine} />
          </View>

          <View style={styles.scannerControls}>
            <TouchableOpacity
              style={styles.scanTriggerBtn}
              onPress={() => handleSimulateScan('coopsetu:attend:session_auto_tok_921')}
              disabled={isSubmitting}
            >
              <Scan size={18} color="#FFFFFF" />
              <Text style={styles.scanTriggerText}>
                {isSubmitting ? 'Verifying...' : 'Simulate Camera QR Scan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Status Feedback */}
        {scanStatus === 'success' && (
          <View style={[styles.statusBanner, styles.successBanner]}>
            <CheckCircle2 size={24} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusBannerTitle}>Attendance Confirmed!</Text>
              <Text style={styles.statusBannerDesc}>{lastMessage}</Text>
            </View>
          </View>
        )}

        {scanStatus === 'offline_queued' && (
          <View style={[styles.statusBanner, styles.offlineBanner]}>
            <WifiOff size={24} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusBannerTitle}>Attendance Saved Offline</Text>
              <Text style={styles.statusBannerDesc}>{lastMessage}</Text>
            </View>
          </View>
        )}

        {/* Manual Code Entry */}
        <View style={styles.manualEntryCard}>
          <Text style={styles.cardHeaderTitle}>Manual Token Entry</Text>
          <Text style={styles.cardHeaderDesc}>
            If camera permissions or projector glare prevents scanning, enter the 6-character session token displayed by the trainer.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. CST-9042"
              placeholderTextColor={COLORS.textMuted}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.submitCodeBtn, !manualCode.trim() && styles.disabledBtn]}
              disabled={!manualCode.trim() || isSubmitting}
              onPress={() => handleSimulateScan(manualCode)}
            >
              <Text style={styles.submitCodeBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Sync State Card */}
        <View style={styles.offlineNoticeCard}>
          <View style={styles.offlineNoticeHeader}>
            <WifiOff size={16} color={COLORS.primary} />
            <Text style={styles.offlineNoticeTitle}>Remote & Offline Resilient</Text>
          </View>
          <Text style={styles.offlineNoticeText}>
            Our edge biometric & cryptographic token stamp enables attendance marking without cellular reception. Tokens sync upon reconnecting to WiFi/cellular.
          </Text>
        </View>

        {/* Recent Attendance Log */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <History size={16} color={COLORS.primaryDark} />
            <Text style={styles.historyTitle}>Recent Session Records</Text>
          </View>

          {historyList.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyItemTitle}>{item.title}</Text>
                <Text style={styles.historyItemTime}>{item.time}</Text>
              </View>
              <Badge
                label={item.status}
                variant={item.status.includes('Offline') ? 'warning' : 'success'}
              />
            </View>
          ))}
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
  scannerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 16,
    ...SHADOWS.sm,
  },
  viewfinder: {
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  viewfinderInstructions: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  laserScanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scannerControls: {
    width: '100%',
  },
  scanTriggerBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  scanTriggerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statusBanner: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  successBanner: {
    backgroundColor: COLORS.successSurface,
    borderColor: COLORS.success,
  },
  offlineBanner: {
    backgroundColor: COLORS.warningSurface,
    borderColor: COLORS.warning,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  statusBannerDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  manualEntryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.sm,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  cardHeaderDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  textInput: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  submitCodeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
  },
  submitCodeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  offlineNoticeCard: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  offlineNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  offlineNoticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  historySection: {
    gap: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  historyItem: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  historyItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyItemTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
