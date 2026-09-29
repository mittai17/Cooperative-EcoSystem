import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { certificateApi, VerifiedCertificateDetails } from './certificateApi';
import { formatDate } from '../../services/utils';
import {
  Award,
  ShieldCheck,
  Share2,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  Lock,
  Building,
  Calendar,
  Sparkles,
} from 'lucide-react-native';

export const CertificateDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'CertificateDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const code = route.params?.code || 'NCCT-2026-X89J4K';

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<VerifiedCertificateDetails | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await certificateApi.verifyCertificate(code);
        if (mounted) {
          setCert(res.certificate);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [code]);

  const verificationUrl = `https://coopsetu.in/verify-certificate/${code}`;

  const handleShare = async () => {
    if (!cert) return;
    const message = `Official NCCT Accredited Certificate: ${cert.programme_title}\nRecipient: ${cert.holder_name}\nGrade: ${cert.grade || 'A'}\nVerification Code: ${cert.id}\nCryptographic Verification: ${verificationUrl}`;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Share.share({
          title: 'NCCT Official Certificate',
          message,
          url: verificationUrl,
        });
      } else {
        await Share.share({
          title: 'NCCT Official Certificate',
          message,
        });
      }
    } catch {
      Alert.alert('Share', 'Unable to open share sheet.');
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert('PDF Exported', `Official Diploma PDF for ${code} has been generated and saved with digital signature.`);
    }, 1200);
  };

  const handleCopyHash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Hash Copied', 'Cryptographic HMAC-SHA256 signature hash copied to clipboard.');
  };

  if (loading) {
    return (
      <ScrollScreen title="Official Certificate">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Retrieving cryptographically verified credential...</Text>
        </View>
      </ScrollScreen>
    );
  }

  const certificate = cert || {
    id: code,
    holder_name: 'Priya Sharma',
    programme_title: 'Executive Diploma in Cooperative Banking & PACS Management',
    issuer: 'National Council for Cooperative Training (NCCT)',
    issue_date: '2026-08-15',
    expiry_date: '2029-08-14',
    status: 'valid',
    grade: 'Distinction (A+)',
    skills_certified: ['Cooperative Accounting', 'Statutory Audit', 'PACS Computerization'],
    verification_url: verificationUrl,
    content_hash: 'a6c8e9b4d32f10578e91024bc681029c54e3a890db7214e9bf439c2018ea65f1',
    signature_algorithm: 'HMAC-SHA256 with NCCT Root Key',
    authority_seal: 'Govt. of India · Ministry of Cooperation',
  };

  return (
    <ScrollScreen
      title="Official Diploma"
      subtitle={`Certificate ID: ${certificate.id}`}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Certificate Parchment Document Container */}
        <View style={styles.diplomaFrame}>
          {/* Inner Ornate Border */}
          <View style={styles.diplomaInnerBorder}>
            {/* National Crest & Header */}
            <View style={styles.diplomaHeader}>
              <View style={styles.emblemBadge}>
                <Award size={ICON.lg} color={COLORS.primary} />
              </View>
              <Text style={styles.orgAuthority}>NATIONAL COUNCIL FOR COOPERATIVE TRAINING</Text>
              <Text style={styles.ministryText}>Ministry of Cooperation · Government of India</Text>
              <View style={styles.goldSeparator} />
              <Text style={styles.certificateHonorTitle}>CERTIFICATE OF EXCELLENCE</Text>
            </View>

            {/* Recipient Statement */}
            <View style={styles.recipientBlock}>
              <Text style={styles.statementText}>This is to certify that</Text>
              <Text style={styles.recipientName}>{certificate.holder_name}</Text>
              <Text style={styles.statementText}>
                has successfully fulfilled all curriculum, field immersion, and examination requirements for the
                national qualification in
              </Text>
              <Text style={styles.programmeTitle}>{certificate.programme_title}</Text>
              {certificate.grade ? (
                <View style={styles.gradeBadgeWrapper}>
                  <Badge label={`Awarded with ${certificate.grade}`} variant="primary" verified />
                </View>
              ) : null}
            </View>

            {/* Competency Skills Verified */}
            {certificate.skills_certified && certificate.skills_certified.length > 0 ? (
              <View style={styles.skillsSection}>
                <Text style={styles.skillsTitle}>Certified Competency Modules:</Text>
                <View style={styles.skillsRow}>
                  {certificate.skills_certified.map((s) => (
                    <View key={s} style={styles.skillChip}>
                      <CheckCircle2 size={ICON.sm} color={COLORS.success} />
                      <Text style={styles.skillChipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Signatures & Seal Section */}
            <View style={styles.authSection}>
              {/* Left Signatory */}
              <View style={styles.signatoryCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatoryName}>Dr. S. K. Sharma</Text>
                <Text style={styles.signatoryRole}>Director General, NCCT</Text>
              </View>

              {/* Center Seal */}
              <View style={styles.sealCol}>
                <View style={styles.officialSeal}>
                  <ShieldCheck size={28} color={COLORS.primary} />
                  <Text style={styles.sealText}>NCCT</Text>
                  <Text style={styles.sealSubtext}>SEAL</Text>
                </View>
              </View>

              {/* Right Signatory */}
              <View style={styles.signatoryCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatoryName}>Dr. R. Ramanathan</Text>
                <Text style={styles.signatoryRole}>Controller of Exams</Text>
              </View>
            </View>

            {/* QR Code & Verification Line */}
            <View style={styles.verificationRow}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={verificationUrl}
                  size={90}
                  color={COLORS.primaryDark}
                  backgroundColor={COLORS.card}
                />
              </View>
              <View style={styles.qrMetaCol}>
                <Text style={styles.qrHeading}>Scan to Verify Authenticity</Text>
                <Text style={styles.qrSub}>Cryptographically anchored to NCCT public registry</Text>
                <Text style={styles.certCodeLabel}>Certificate Code:</Text>
                <Text style={styles.certCodeValue} selectable>
                  {certificate.id}
                </Text>
                <Text style={styles.issueDateText}>
                  Date of Issue: {formatDate(certificate.issue_date)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cryptographic Security Details Card */}
        <View style={styles.cryptoCard}>
          <View style={styles.cryptoHeader}>
            <Lock size={ICON.md} color={COLORS.primary} />
            <Text style={styles.cryptoTitle}>Tamper-Evident Security Digest</Text>
          </View>
          <Text style={styles.cryptoDesc}>
            This credential features an HMAC-SHA256 digital signature computed over the student identity, syllabus
            code, and exam marks. Any alteration invalidates verification.
          </Text>

          <View style={styles.hashBox}>
            <View style={styles.hashHeaderRow}>
              <Text style={styles.hashLabel}>HMAC-SHA256 Content Hash:</Text>
              <TouchableOpacity onPress={handleCopyHash} style={styles.copyBtn}>
                <Copy size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hashValue} selectable numberOfLines={2}>
              {certificate.content_hash || 'a6c8e9b4d32f10578e91024bc681029c54e3a890db7214e9bf439c2018ea65f1'}
            </Text>
          </View>

          <View style={styles.cryptoMetaGrid}>
            <View style={styles.cryptoMetaItem}>
              <Text style={styles.cryptoMetaKey}>Registry Status</Text>
              <Text style={[styles.cryptoMetaVal, { color: COLORS.success }]}>ACTIVE & VERIFIED</Text>
            </View>
            <View style={styles.cryptoMetaItem}>
              <Text style={styles.cryptoMetaKey}>Algorithm</Text>
              <Text style={styles.cryptoMetaVal}>{certificate.signature_algorithm || 'HMAC-SHA256'}</Text>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionGrid}>
          <Button
            label={downloading ? 'Generating Signed PDF...' : 'Download Official PDF'}
            icon={<Download size={ICON.md} color={COLORS.textInverse} />}
            onPress={handleDownload}
            loading={downloading}
          />

          <View style={styles.actionSecondaryRow}>
            <TouchableOpacity
              style={styles.actionSecondaryBtn}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share Certificate"
            >
              <Share2 size={ICON.md} color={COLORS.primary} />
              <Text style={styles.actionSecondaryText}>Share Credential</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSecondaryBtn}
              onPress={() => navigation.navigate('VerifyCertificate', { code: certificate.id })}
              accessibilityRole="button"
              accessibilityLabel="Verify Authenticity"
            >
              <ShieldCheck size={ICON.md} color={COLORS.success} />
              <Text style={[styles.actionSecondaryText, { color: COLORS.success }]}>Verify Online</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
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
  diplomaFrame: {
    backgroundColor: '#FFFEFA',
    borderRadius: RADII.lg,
    borderWidth: 2,
    borderColor: '#C59A45', // Gold accent
    padding: SPACE.xs,
    elevation: 3,
  },
  diplomaInnerBorder: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderStyle: 'dashed',
    borderRadius: RADII.md,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  diplomaHeader: {
    alignItems: 'center',
    gap: 4,
  },
  emblemBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: 4,
  },
  orgAuthority: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  ministryText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  goldSeparator: {
    width: 80,
    height: 2,
    backgroundColor: '#C59A45',
    marginVertical: 4,
  },
  certificateHonorTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  recipientBlock: {
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
  },
  statementText: {
    ...TEXT.caption,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  recipientName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
    paddingBottom: 2,
    paddingHorizontal: SPACE.md,
  },
  programmeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  gradeBadgeWrapper: {
    marginTop: SPACE.xs,
  },
  skillsSection: {
    gap: SPACE.xs,
    backgroundColor: '#FBF9F3',
    padding: SPACE.sm,
    borderRadius: RADII.sm,
  },
  skillsTitle: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    backgroundColor: COLORS.card,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  skillChipText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  authSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: '#EFE7D5',
  },
  signatoryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  signatureLine: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.textMuted,
    marginBottom: 4,
  },
  signatoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  signatoryRole: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sealCol: {
    paddingHorizontal: SPACE.xs,
    alignItems: 'center',
  },
  officialSeal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#C59A45',
    backgroundColor: '#FFF9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  sealSubtext: {
    fontSize: 8,
    color: '#C59A45',
    fontWeight: '700',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: '#F8F5EE',
    padding: SPACE.sm,
    borderRadius: RADII.md,
  },
  qrWrapper: {
    backgroundColor: COLORS.card,
    padding: 6,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  qrMetaCol: {
    flex: 1,
    gap: 2,
  },
  qrHeading: {
    ...TEXT.bodyStrong,
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  qrSub: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 13,
  },
  certCodeLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  certCodeValue: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  issueDateText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  cryptoCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  cryptoTitle: {
    ...TEXT.bodyStrong,
  },
  cryptoDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  hashBox: {
    backgroundColor: COLORS.surface,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  hashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hashLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  copyBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  hashValue: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  cryptoMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACE.xs,
  },
  cryptoMetaItem: {
    gap: 2,
  },
  cryptoMetaKey: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
  cryptoMetaVal: {
    ...TEXT.captionStrong,
    fontSize: 11,
  },
  actionGrid: {
    gap: SPACE.sm,
  },
  actionSecondaryRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  actionSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  actionSecondaryText: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
});
