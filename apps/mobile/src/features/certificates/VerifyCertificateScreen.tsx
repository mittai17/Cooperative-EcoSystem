import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
import { certificateApi, VerificationResult } from './certificateApi';
import { formatDate } from '../../services/utils';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Award,
  Calendar,
  Building,
  Hash,
  X,
  Lock,
} from 'lucide-react-native';

export const VerifyCertificateScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'VerifyCertificate'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initialCode = route.params?.code || '';

  const [inputCode, setInputCode] = useState(initialCode);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleVerify = async (codeToVerify?: string) => {
    const target = (codeToVerify || inputCode).trim();
    if (!target) {
      Alert.alert('Enter Certificate Code', 'Please enter a certificate tracking code (e.g. NCCT-2026-X89J4K) or scan a QR code.');
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      const res = await certificateApi.verifyCertificate(target);
      setResult(res);
    } catch {
      Alert.alert('Verification Failed', 'Unable to reach the National Certificate Registry. Check connection.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      const timer = setTimeout(() => {
        handleVerify(initialCode);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialCode]);

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Access Required',
          'Camera permission is required to scan certificate verification QR codes. You can also type or paste the code directly.'
        );
        return;
      }
    }
    setCameraOpen(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setCameraOpen(false);
    // Parse code from URL or raw text
    let parsed = data.trim();
    if (parsed.includes('/verify-certificate/')) {
      parsed = parsed.split('/verify-certificate/')[1]?.split('?')[0] || parsed;
    } else if (parsed.includes('code=')) {
      parsed = parsed.split('code=')[1]?.split('&')[0] || parsed;
    }
    setInputCode(parsed);
    handleVerify(parsed);
  };

  const handleSimulateScan = () => {
    const demoCode = 'NCCT-2026-X89J4K';
    setCameraOpen(false);
    setInputCode(demoCode);
    handleVerify(demoCode);
  };

  return (
    <ScrollScreen
      title="Public Verifier"
      subtitle="NCCT Cryptographic Credential Authenticator"
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Input Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Verify Certificate Authenticity</Text>
          <Text style={styles.inputDesc}>
            Enter the 16-character alphanumeric certificate code or scan the QR code printed on the physical or
            digital diploma.
          </Text>

          <View style={styles.inputWrapper}>
            <Search size={ICON.md} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. NCCT-2026-X89J4K"
              placeholderTextColor={COLORS.textMuted}
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => handleVerify()}
            />
            {inputCode ? (
              <TouchableOpacity onPress={() => setInputCode('')} style={styles.clearBtn}>
                <X size={ICON.sm} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.qrScanBtn}
              onPress={handleOpenScanner}
              accessibilityRole="button"
              accessibilityLabel="Scan QR code"
            >
              <QrCode size={ICON.md} color={COLORS.primary} />
              <Text style={styles.qrScanBtnText}>Scan QR</Text>
            </TouchableOpacity>

            <View style={styles.verifyBtnWrapper}>
              <Button
                label={verifying ? 'Checking...' : 'Verify Authenticity'}
                icon={<ShieldCheck size={ICON.md} color={COLORS.textInverse} />}
                onPress={() => handleVerify()}
                loading={verifying}
              />
            </View>
          </View>
        </View>

        {/* Verification Result Section */}
        {verifying ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Validating HMAC-SHA256 hash against NCCT registry...</Text>
          </View>
        ) : null}

        {result ? (
          <View style={styles.resultContainer}>
            {result.valid && result.certificate ? (
              /* Verified Card */
              <View style={[styles.resultCard, styles.verifiedCard]}>
                {/* Status Banner */}
                <View style={styles.verifiedBanner}>
                  <ShieldCheck size={28} color={COLORS.success} />
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.verifiedBannerTitle}>OFFICIALLY VERIFIED & AUTHENTIC</Text>
                    <Text style={styles.verifiedBannerSub}>Tamper-Evident NCCT Digital Credential</Text>
                  </View>
                </View>

                {/* 4 Security Proof Checks */}
                <View style={styles.checksList}>
                  <View style={styles.checkItem}>
                    <CheckCircle2 size={ICON.md} color={COLORS.success} />
                    <View style={styles.checkItemTextCol}>
                      <Text style={styles.checkItemTitle}>HMAC-SHA256 Digital Signature</Text>
                      <Text style={styles.checkItemSub}>Matches original cryptographic registry digest</Text>
                    </View>
                  </View>

                  <View style={styles.checkItem}>
                    <CheckCircle2 size={ICON.md} color={COLORS.success} />
                    <View style={styles.checkItemTextCol}>
                      <Text style={styles.checkItemTitle}>National Accreditation Authority</Text>
                      <Text style={styles.checkItemSub}>National Council for Cooperative Training (NCCT)</Text>
                    </View>
                  </View>

                  <View style={styles.checkItem}>
                    <CheckCircle2 size={ICON.md} color={COLORS.success} />
                    <View style={styles.checkItemTextCol}>
                      <Text style={styles.checkItemTitle}>Revocation & Expiry Audit</Text>
                      <Text style={styles.checkItemSub}>Active standing · Not revoked · Valid credential</Text>
                    </View>
                  </View>

                  <View style={styles.checkItem}>
                    <CheckCircle2 size={ICON.md} color={COLORS.success} />
                    <View style={styles.checkItemTextCol}>
                      <Text style={styles.checkItemTitle}>Identity & Evaluation Record</Text>
                      <Text style={styles.checkItemSub}>Matched with national trainee candidate database</Text>
                    </View>
                  </View>
                </View>

                {/* Certificate Meta Details */}
                <View style={styles.certMetaCard}>
                  <View style={styles.metaRow}>
                    <Award size={ICON.md} color={COLORS.primary} />
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Programme Title</Text>
                      <Text style={styles.metaValue}>{result.certificate.programme_title}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Building size={ICON.md} color={COLORS.textSecondary} />
                    <View style={styles.metaCol}>
                      <Text style={styles.metaLabel}>Recipient Name</Text>
                      <Text style={styles.metaValue}>{result.certificate.holder_name}</Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaGridItem}>
                      <Text style={styles.metaLabel}>Grade Awarded</Text>
                      <Text style={[styles.metaValue, { color: COLORS.primary }]}>
                        {result.certificate.grade || 'Passed'}
                      </Text>
                    </View>

                    <View style={styles.metaGridItem}>
                      <Text style={styles.metaLabel}>Issue Date</Text>
                      <Text style={styles.metaValue}>{formatDate(result.certificate.issue_date)}</Text>
                    </View>

                    <View style={styles.metaGridItem}>
                      <Text style={styles.metaLabel}>Certificate ID</Text>
                      <Text style={[styles.metaValue, styles.monospace]}>{result.certificate.id}</Text>
                    </View>
                  </View>

                  {result.certificate.skills_certified && result.certificate.skills_certified.length > 0 ? (
                    <View style={styles.skillsWrapper}>
                      <Text style={styles.metaLabel}>Certified Competency Tags:</Text>
                      <View style={styles.skillsRow}>
                        {result.certificate.skills_certified.map((s) => (
                          <Badge key={s} label={s} variant="neutral" />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {result.certificate.content_hash ? (
                    <View style={styles.hashRow}>
                      <Lock size={ICON.sm} color={COLORS.textMuted} />
                      <Text style={styles.hashSnippet} numberOfLines={1}>
                        SHA256: {result.certificate.content_hash}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* View Full Certificate Button */}
                <TouchableOpacity
                  style={styles.viewFullBtn}
                  onPress={() => navigation.navigate('CertificateDetail', { code: result.certificate!.id })}
                  accessibilityRole="button"
                  accessibilityLabel="View Full Official Certificate Document"
                >
                  <ExternalLink size={ICON.sm} color={COLORS.textInverse} />
                  <Text style={styles.viewFullBtnText}>View Full Official Diploma</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Invalid / Not Found Card */
              <View style={[styles.resultCard, styles.invalidCard]}>
                <View style={styles.invalidBanner}>
                  <ShieldAlert size={28} color={COLORS.danger} />
                  <View style={styles.bannerTextCol}>
                    <Text style={styles.invalidBannerTitle}>INVALID OR UNVERIFIED CREDENTIAL</Text>
                    <Text style={styles.invalidBannerSub}>Digital Signature Not Verified</Text>
                  </View>
                </View>

                <View style={styles.invalidDetails}>
                  <View style={styles.invalidCheckItem}>
                    <XCircle size={ICON.md} color={COLORS.danger} />
                    <Text style={styles.invalidCheckText}>
                      No certificate found matching the code &ldquo;{inputCode}&rdquo; in the NCCT National Cooperative
                      Registry.
                    </Text>
                  </View>
                  <View style={styles.invalidCheckItem}>
                    <XCircle size={ICON.md} color={COLORS.danger} />
                    <Text style={styles.invalidCheckText}>
                      The document may have expired, been revoked, or contains an altered signature hash.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* Camera QR Scanner Modal */}
      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* Scanner Overlay */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Scan Certificate QR Code</Text>
              <TouchableOpacity onPress={() => setCameraOpen(false)} style={styles.scannerCloseBtn}>
                <X size={ICON.lg} color={COLORS.textInverse} />
              </TouchableOpacity>
            </View>

            <View style={styles.scannerReticleWrapper}>
              <View style={styles.scannerReticle} />
              <Text style={styles.scannerHint}>Align the certificate QR code within frame</Text>
            </View>

            <View style={styles.scannerFooter}>
              <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateScan}>
                <Text style={styles.simulateBtnText}>Simulate Scan (Demo Code)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  inputCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  inputTitle: {
    ...TEXT.bodyStrong,
    fontSize: 16,
  },
  inputDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.sm,
    height: HIT + 4,
    gap: SPACE.xs,
  },
  searchIcon: {
    marginLeft: 2,
  },
  textInput: {
    ...TEXT.body,
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.primaryDark,
  },
  clearBtn: {
    padding: SPACE.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
  qrScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    height: HIT + 4,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  qrScanBtnText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  verifyBtnWrapper: {
    flex: 1,
  },
  loadingBox: {
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  loadingText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  resultContainer: {
    marginTop: SPACE.xs,
  },
  resultCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  verifiedCard: {
    borderColor: COLORS.success,
    backgroundColor: '#FAFDFB',
  },
  invalidCard: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerSurface,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.sm,
    backgroundColor: COLORS.successSurface,
    borderRadius: RADII.md,
  },
  invalidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.sm,
    backgroundColor: '#FDECEC',
    borderRadius: RADII.md,
  },
  bannerTextCol: {
    flex: 1,
  },
  verifiedBannerTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.success,
    fontSize: 13,
  },
  invalidBannerTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.danger,
    fontSize: 13,
  },
  verifiedBannerSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  invalidBannerSub: {
    ...TEXT.caption,
    color: COLORS.danger,
  },
  checksList: {
    gap: SPACE.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  checkItemTextCol: {
    flex: 1,
  },
  checkItemTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  checkItemSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  certMetaCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  metaValue: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACE.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metaGridItem: {
    flex: 1,
  },
  monospace: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  skillsWrapper: {
    gap: 4,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hashSnippet: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.md,
    paddingVertical: SPACE.md,
  },
  viewFullBtnText: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
  },
  invalidDetails: {
    gap: SPACE.sm,
  },
  invalidCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  invalidCheckText: {
    ...TEXT.body,
    color: COLORS.textPrimary,
    flex: 1,
    fontSize: 13,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACE.lg,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xl,
  },
  scannerTitle: {
    ...TEXT.section,
    color: COLORS.textInverse,
  },
  scannerCloseBtn: {
    padding: SPACE.sm,
  },
  scannerReticleWrapper: {
    alignItems: 'center',
    gap: SPACE.md,
  },
  scannerReticle: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADII.md,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    ...TEXT.caption,
    color: COLORS.textInverse,
    textAlign: 'center',
  },
  scannerFooter: {
    paddingBottom: SPACE.xl,
    alignItems: 'center',
  },
  simulateBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.pill,
  },
  simulateBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
});
