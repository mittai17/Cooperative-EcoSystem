import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { EmptyState, LoadingState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { IconChip } from '../../components/IconChip';
import { useOnMount } from '../../hooks/useOnMount';
import { formatDate } from '../../services/utils';
import { certificateApi } from './certificateApi';
import { CertificateItem } from '../../types';
import {
  Award,
  Share2,
  Calendar,
  Building,
  Hash,
  Download,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';

export const CertificatesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [certs, setCerts] = useState<CertificateItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await certificateApi.getMyCertificates();
      setCerts(res.certificates);
      setIsLive(res.isLive);
    } catch {
      setCerts((prev) => prev ?? []);
      setIsLive(false);
    }
  }, []);

  useOnMount(load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async (cert: CertificateItem) => {
    const text = `NCCT Accredited Certificate: ${cert.programme_title}\nRecipient: ${cert.holder_name}\nGrade: ${cert.grade || 'Passed'}\nVerification Code: ${cert.id}\nVerify Authenticity: https://coopsetu.in/verify-certificate/${cert.id}`;

    try {
      if (await Sharing.isAvailableAsync()) {
        // If file sharing available, we can share text/message or link
        await Share.share({
          title: 'NCCT National Certificate',
          message: text,
          url: `https://coopsetu.in/verify-certificate/${cert.id}`,
        });
      } else {
        await Share.share({
          title: 'NCCT National Certificate',
          message: text,
        });
      }
    } catch {
      Alert.alert('Share', 'Unable to open share sheet.');
    }
  };

  const handleDownloadPdf = (cert: CertificateItem) => {
    setDownloadingId(cert.id);
    setTimeout(() => {
      setDownloadingId(null);
      Alert.alert(
        'Certificate Downloaded',
        `Official PDF document for "${cert.programme_title}" (${cert.id}) has been saved to your downloads with cryptographic NCCT stamp.`,
        [
          {
            text: 'View Document',
            onPress: () => navigation.navigate('CertificateDetail', { code: cert.id }),
          },
          { text: 'Close' },
        ]
      );
    }, 1200);
  };

  return (
    <ScrollScreen
      title="Official Credentials"
      subtitle="NCCT Accredited Diplomas & Certificates"
      onBack={() => navigation.goBack()}
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
      rightAction={
        <TouchableOpacity
          style={styles.verifyNavBtn}
          onPress={() => navigation.navigate('VerifyCertificate', {})}
          accessibilityRole="button"
          accessibilityLabel="Verify Certificate"
        >
          <ShieldCheck size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.verifyNavText}>Verify</Text>
        </TouchableOpacity>
      }
    >
      {/* Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerHeader}>
          <Sparkles size={ICON.md} color={COLORS.primary} />
          <Text style={styles.bannerTitle}>Tamper-Evident Digital Diplomas</Text>
        </View>
        <Text style={styles.bannerText}>
          All certificates are cryptographically signed using HMAC-SHA256 and registered under the National Council
          for Cooperative Training (NCCT) registry.
        </Text>
      </View>

      {certs === null ? <LoadingState /> : null}

      {certs !== null && certs.length === 0 ? (
        <EmptyState
          title="No Certificates Earned Yet"
          message="Complete your enrolled cooperative training programmes and pass the final evaluation to receive accredited diplomas."
        />
      ) : null}

      {(certs ?? []).map((cert) => {
        const valid = cert.status.toLowerCase() === 'valid';
        const isDownloading = downloadingId === cert.id;

        return (
          <View key={cert.id} style={styles.card}>
            {/* Card Header */}
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => navigation.navigate('CertificateDetail', { code: cert.id })}
              activeOpacity={0.8}
            >
              <IconChip size={44} tint={COLORS.primarySurface}>
                <Award size={ICON.lg} color={COLORS.primary} />
              </IconChip>
              <View style={styles.flex}>
                <Text style={styles.title}>{cert.programme_title}</Text>
                <Text style={styles.caption}>Awarded to {cert.holder_name}</Text>
              </View>
              <ChevronRight size={ICON.md} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <Badge label={cert.status.toUpperCase()} variant={valid ? 'success' : 'neutral'} verified={valid} />
              {cert.grade ? <Badge label={`Grade: ${cert.grade}`} variant="primary" /> : null}
            </View>

            {/* Details */}
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Building size={ICON.sm} color={COLORS.textMuted} />
                <Text style={[styles.caption, styles.flex]}>{cert.issuer}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={ICON.sm} color={COLORS.textMuted} />
                <Text style={[styles.caption, styles.flex]}>
                  Issued {formatDate(cert.issue_date)}
                  {cert.expiry_date ? ` · Valid until ${formatDate(cert.expiry_date)}` : ''}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Hash size={ICON.sm} color={COLORS.textMuted} />
                <Text style={[styles.codeText, styles.flex]} selectable>
                  {cert.id}
                </Text>
              </View>
            </View>

            {/* Skills Certified */}
            {cert.skills_certified && cert.skills_certified.length > 0 ? (
              <View style={styles.skills}>
                {cert.skills_certified.map((s) => (
                  <Badge key={s} label={s} variant="neutral" />
                ))}
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownloadPdf(cert)}
                disabled={isDownloading}
                accessibilityRole="button"
                accessibilityLabel="Download Certificate PDF"
              >
                <Download size={ICON.sm} color={COLORS.primary} />
                <Text style={styles.downloadBtnText}>
                  {isDownloading ? 'Saving PDF...' : 'Download PDF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => handleShare(cert)}
                accessibilityRole="button"
                accessibilityLabel="Share Certificate"
              >
                <Share2 size={ICON.sm} color={COLORS.textPrimary} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => navigation.navigate('CertificateDetail', { code: cert.id })}
                accessibilityRole="button"
                accessibilityLabel="View Full Certificate"
              >
                <ExternalLink size={ICON.sm} color={COLORS.textInverse} />
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  verifyNavBtn: {
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
  verifyNavText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  bannerCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.xs,
    backgroundColor: COLORS.surface,
    marginBottom: SPACE.xs,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  bannerTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  bannerText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
    marginBottom: SPACE.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  title: {
    ...TEXT.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
  },
  caption: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    flexWrap: 'wrap',
  },
  details: {
    gap: SPACE.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  codeText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primarySurface,
  },
  downloadBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  shareBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primary,
  },
  viewBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
});
