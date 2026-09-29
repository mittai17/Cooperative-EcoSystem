import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/ProgressBar';
import { Button } from '../../components/Button';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  CURRENT_TRAINEE_PASSPORT,
  SkillPassportCredential,
} from './careerData';
import {
  Award,
  CheckCircle2,
  Clock,
  QrCode,
  Share2,
  Download,
  ShieldCheck,
  Building,
  GraduationCap,
  Copy,
  ExternalLink,
  Lock,
} from 'lucide-react-native';

const LEVEL_TIERS = ['All', 'Advanced / Proficient', 'Intermediate', 'Foundation'] as const;

export const SkillPassportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const passport = CURRENT_TRAINEE_PASSPORT;

  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const filteredCredentials = passport.credentials.filter((cred) => {
    if (selectedTier === 'All') return true;
    if (selectedTier === 'Advanced / Proficient') return cred.level === 'Advanced' || cred.level === 'Proficient';
    if (selectedTier === 'Intermediate') return cred.level === 'Intermediate';
    if (selectedTier === 'Foundation') return cred.level === 'Foundation';
    return true;
  });

  const handleSharePassport = async () => {
    try {
      await Share.share({
        title: `NCCT Skill Passport - ${passport.fullName}`,
        message: `Verify NCCT Cooperative Skill Passport for ${passport.fullName} (ID: ${passport.traineeId}). Cryptographic proof: ${passport.tamperProofHash}\nVerification Portal: https://coopsetu.gov.in/verify/${passport.traineeId}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      setDownloadingPdf(false);
      Alert.alert(
        'Passport PDF Exported',
        'Official cryptographically sealed NCCT Skill Passport PDF has been saved to your downloads and is ready to share with employers.',
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  const qrPayload = `coopsetu:passport:${passport.traineeId}:${passport.tamperProofHash}`;

  return (
    <ScrollScreen
      title="Dynamic Skill Passport"
      subtitle={`ID: ${passport.traineeId}`}
      onBack={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity
          style={styles.qrHeaderBtn}
          onPress={() => setQrModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <QrCode size={ICON.sm} color={COLORS.textInverse} />
          <Text style={styles.qrHeaderBtnText}>QR</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        {/* Passport Identity Master Card */}
        <View style={styles.masterPassportCard}>
          {/* Header watermark band */}
          <View style={styles.passportBand}>
            <Text style={styles.passportBandText}>NATIONAL COUNCIL FOR COOPERATIVE TRAINING (NCCT)</Text>
            <ShieldCheck size={14} color="#FDECEC" />
          </View>

          <View style={styles.passportMainInfo}>
            <View style={styles.passportTopRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{passport.photoInitial}</Text>
              </View>
              <View style={styles.passportNameWrap}>
                <View style={styles.verifiedTraineeRow}>
                  <Text style={styles.traineeName}>{passport.fullName}</Text>
                  <CheckCircle2 size={16} color={COLORS.success} />
                </View>
                <Text style={styles.traineeSpecialization}>{passport.specialization}</Text>
                <Text style={styles.traineeInstitute}>Institute: {passport.homeInstitute}</Text>
              </View>
            </View>

            {/* Passport ID & Cryptographic Stamp */}
            <View style={styles.passportNumberRow}>
              <View style={styles.passportIdBox}>
                <Text style={styles.idLabel}>Passport Serial</Text>
                <Text style={styles.idValue}>{passport.traineeId}</Text>
              </View>
              <View style={styles.passportIdBox}>
                <Text style={styles.idLabel}>Digital Seal</Text>
                <Text style={styles.idValue}>HMAC-SHA256</Text>
              </View>
              <View style={styles.passportIdBox}>
                <Text style={styles.idLabel}>Issue Date</Text>
                <Text style={styles.idValue}>{passport.passportIssueDate}</Text>
              </View>
            </View>
          </View>

          {/* Quick Share / Export Actions inside card */}
          <View style={styles.passportCardActions}>
            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => setQrModalVisible(true)}
            >
              <QrCode size={14} color={COLORS.primary} />
              <Text style={styles.cardActionText}>View QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={handleSharePassport}
            >
              <Share2 size={14} color={COLORS.primary} />
              <Text style={styles.cardActionText}>Share Passport</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={handleDownloadPdf}
            >
              <Download size={14} color={COLORS.primary} />
              <Text style={styles.cardActionText}>PDF Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Passport Aggregate Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Award size={ICON.md} color={COLORS.primary} />
            <Text style={styles.metricVal}>{passport.credentials.length}</Text>
            <Text style={styles.metricLbl}>Verified Skills</Text>
          </View>
          <View style={styles.metricCard}>
            <Clock size={ICON.md} color="#D97706" />
            <Text style={styles.metricVal}>{passport.totalPracticalHours} hrs</Text>
            <Text style={styles.metricLbl}>Field Immersion</Text>
          </View>
          <View style={styles.metricCard}>
            <CheckCircle2 size={ICON.md} color={COLORS.success} />
            <Text style={[styles.metricVal, { color: COLORS.success }]}>
              {passport.overallAttendancePercentage}%
            </Text>
            <Text style={styles.metricLbl}>Attendance</Text>
          </View>
          <View style={styles.metricCard}>
            <GraduationCap size={ICON.md} color={COLORS.primaryDark} />
            <Text style={styles.metricVal}>{passport.certificates.length}</Text>
            <Text style={styles.metricLbl}>Accredited Diplomas</Text>
          </View>
        </View>

        {/* Skill Graph Competency Tiers Filter */}
        <SectionHeader title="Skill Competency Graph by Proficiency Tier" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierFilterRow}
        >
          {LEVEL_TIERS.map((tier) => {
            const active = selectedTier === tier;
            return (
              <TouchableOpacity
                key={tier}
                style={[styles.tierFilterChip, active && styles.tierFilterChipActive]}
                onPress={() => setSelectedTier(tier)}
              >
                <Text style={[styles.tierFilterChipText, active && styles.tierFilterChipTextActive]}>
                  {tier}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Skill Credentials List */}
        <View style={styles.credentialsList}>
          {filteredCredentials.map((cred) => {
            const isAdvanced = cred.level === 'Advanced' || cred.level === 'Proficient';
            const isIntermediate = cred.level === 'Intermediate';
            const badgeVariant = isAdvanced ? 'primary' : isIntermediate ? 'neutral' : 'neutral';

            return (
              <View key={cred.id} style={styles.credentialCard}>
                <View style={styles.credTopRow}>
                  <View style={styles.credTitleWrap}>
                    <Text style={styles.credName}>{cred.skillName}</Text>
                    <Text style={styles.credArea}>{cred.competencyArea} • Verified at {cred.issuingInstitute}</Text>
                  </View>
                  <Badge label={cred.level} variant={badgeVariant} />
                </View>

                {/* Confidence Bar */}
                <View style={styles.confidenceRow}>
                  <View style={styles.confidenceLabelRow}>
                    <Text style={styles.confidenceText}>Confidence Index</Text>
                    <Text style={styles.confidencePercent}>{cred.confidence}%</Text>
                  </View>
                  <ProgressBar
                    value={cred.confidence}
                    height={6}
                    color={isAdvanced ? COLORS.primary : '#D97706'}
                  />
                </View>

                {/* Evidence & Hours Meta */}
                <View style={styles.credMetaRow}>
                  <View style={styles.credMetaItem}>
                    <Clock size={12} color={COLORS.textMuted} />
                    <Text style={styles.credMetaText}>{cred.verifiedHours} Practical Hours</Text>
                  </View>
                  <View style={styles.credMetaItem}>
                    <Lock size={12} color={COLORS.success} />
                    <Text style={styles.credSigText}>Sig: {cred.cryptographicSignature}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Official Micro-credentials & Diplomas */}
        <SectionHeader title="Accredited Diplomas & Certificates" />
        <View style={styles.certsList}>
          {passport.certificates.map((cert) => (
            <View key={cert.id} style={styles.certCard}>
              <View style={styles.certIconWrap}>
                <Award size={ICON.md} color={COLORS.primary} />
              </View>
              <View style={styles.certDetails}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certIssuer}>{cert.issuer} • Issued {cert.issueDate}</Text>
                <View style={styles.certBottomRow}>
                  <Text style={styles.certTrackingCode}>Code: {cert.verificationCode}</Text>
                  <Badge label="Valid" variant="success" verified />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Cryptographic Proof Card */}
        <View style={styles.cryptoCard}>
          <View style={styles.cryptoHeader}>
            <ShieldCheck size={ICON.md} color={COLORS.primary} />
            <Text style={styles.cryptoTitle}>Cryptographic Seal & Verification</Text>
          </View>
          <Text style={styles.cryptoDesc}>
            This passport is cryptographically signed by the NCCT Apex Authority. Any modification to hours, attendance, or competency scores invalidates the digital signature.
          </Text>
          <View style={styles.hashBox}>
            <Text style={styles.hashLabel}>Digital Fingerprint (SHA-256):</Text>
            <Text style={styles.hashValue}>{passport.tamperProofHash}</Text>
          </View>
        </View>
      </View>

      {/* QR Code Presentation Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrModalTitle}>Skill Passport QR Code</Text>
            <Text style={styles.qrModalSubtitle}>
              Present this code for instant cryptographic verification by cooperative employers and NCCT inspectors.
            </Text>

            {/* QR Code Graphic Container */}
            <View style={styles.qrContainer}>
              <QRCode
                value={qrPayload}
                size={200}
                color={COLORS.primaryDark}
                backgroundColor={COLORS.card}
              />
            </View>

            <Text style={styles.qrTraineeId}>{passport.traineeId}</Text>
            <Text style={styles.qrTraineeName}>{passport.fullName}</Text>
            <Text style={styles.qrInstructions}>
              Compatible with CoopSetu Offline Kiosks, RICM Biometric Readers, and Public Certificate Authenticator.
            </Text>

            <View style={styles.qrModalActions}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setQrModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={handleSharePassport}
              >
                <Share2 size={ICON.sm} color={COLORS.textInverse} />
                <Text style={styles.modalShareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  qrHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.sm,
  },
  qrHeaderBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  masterPassportCard: {
    ...CARD,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  passportBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
  },
  passportBandText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  passportMainInfo: {
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  passportTopRow: {
    flexDirection: 'row',
    gap: SPACE.md,
    alignItems: 'center',
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TEXT.title,
    color: COLORS.primary,
  },
  passportNameWrap: {
    flex: 1,
    gap: 2,
  },
  verifiedTraineeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  traineeName: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  traineeSpecialization: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 12,
  },
  traineeInstitute: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  passportNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  passportIdBox: {
    gap: 2,
  },
  idLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  idValue: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
    fontSize: 11,
  },
  passportCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACE.sm + 2,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  cardActionText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  metricCard: {
    ...CARD,
    flex: 1,
    minWidth: '45%',
    padding: SPACE.md,
    gap: 2,
  },
  metricVal: {
    ...TEXT.title,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  metricLbl: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  tierFilterRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
  },
  tierFilterChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tierFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tierFilterChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  tierFilterChipTextActive: {
    color: COLORS.textInverse,
  },
  credentialsList: {
    gap: SPACE.sm,
  },
  credentialCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  credTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  credTitleWrap: {
    flex: 1,
    marginRight: SPACE.sm,
  },
  credName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  credArea: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  confidenceRow: {
    marginTop: SPACE.xs,
    gap: 4,
  },
  confidenceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidenceText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  confidencePercent: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 11,
  },
  credMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 4,
  },
  credMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  credMetaText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  credSigText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  certsList: {
    gap: SPACE.sm,
  },
  certCard: {
    ...CARD,
    padding: SPACE.md,
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  certIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certDetails: {
    flex: 1,
    gap: 2,
  },
  certTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  certIssuer: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  certBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  certTrackingCode: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cryptoCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
    backgroundColor: COLORS.surface,
  },
  cryptoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  cryptoTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  cryptoDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  hashBox: {
    backgroundColor: COLORS.card,
    padding: SPACE.sm,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  hashLabel: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  hashValue: {
    ...TEXT.captionStrong,
    fontSize: 10,
    color: COLORS.primaryDark,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACE.md,
  },
  qrModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACE.lg,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  qrModalTitle: {
    ...TEXT.section,
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  qrModalSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  qrContainer: {
    padding: SPACE.md,
    backgroundColor: '#FFFFFF',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: SPACE.xs,
  },
  qrTraineeId: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 13,
  },
  qrTraineeName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  qrInstructions: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  qrModalActions: {
    flexDirection: 'row',
    gap: SPACE.sm,
    width: '100%',
    marginTop: SPACE.xs,
  },
  modalCloseBtn: {
    flex: 1,
    height: HIT - 4,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  modalShareBtn: {
    flex: 1,
    height: HIT - 4,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modalShareBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
});
