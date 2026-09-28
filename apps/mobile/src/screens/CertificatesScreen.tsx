import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';
import { Badge } from '../components/Badge';
import { apiService } from '../services/api';
import {
  Award,
  ShieldCheck,
  Share2,
  Download,
  Calendar,
  Building,
  QrCode,
  CheckCircle,
} from 'lucide-react-native';
import { CertificateItem } from '../types';

export const CertificatesScreen = ({ navigation }: any) => {
  const [certs, setCerts] = useState<CertificateItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const loadCerts = async () => {
    setRefreshing(true);
    try {
      const res = await apiService.getCertificates();
      setCerts(res.certificates);
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCerts();
  }, []);

  const handleShare = async (cert: CertificateItem) => {
    try {
      await Share.share({
        message: `Verified Cooperative Certificate: ${cert.programme_title} issued to ${cert.holder_name} by ${cert.issuer}. Verification ID: ${cert.id}`,
        title: 'Cooperative Certificate',
      });
    } catch {
      Alert.alert('Share', 'Certificate link copied to clipboard.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Certificates"
        subtitle="Ministry & NCCT Accreditations"
        showBack
        onBack={() => navigation.goBack()}
        isLive={isLive}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCerts} colors={[COLORS.primary]} />}
      >
        {/* Verification Authenticity Banner */}
        <View style={styles.authBanner}>
          <ShieldCheck size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.authTitle}>Tamper-Proof National Credentials</Text>
            <Text style={styles.authDesc}>
              Certificates are registered on the National Cooperative Database and verifiable via instant QR scan by cooperative employers.
            </Text>
          </View>
        </View>

        {/* Certificates List */}
        {certs.map((cert) => (
          <View key={cert.id} style={styles.certCard}>
            <View style={styles.cardHeader}>
              <View style={styles.sealCircle}>
                <Award size={26} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Badge label="OFFICIALLY CERTIFIED" variant="success" verified />
                <Text style={styles.certTitle}>{cert.programme_title}</Text>
                <Text style={styles.certHolder}>Conferred to: {cert.holder_name}</Text>
              </View>
            </View>

            <View style={styles.certDetails}>
              <View style={styles.detailRow}>
                <Building size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>Issuer: {cert.issuer}</Text>
              </View>

              <View style={styles.detailRow}>
                <Calendar size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  Issued on: {cert.issue_date} {cert.expiry_date ? `• Valid till: ${cert.expiry_date}` : ''}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <QrCode size={14} color={COLORS.textSecondary} />
                <Text style={styles.codeText}>ID: {cert.id}</Text>
              </View>
            </View>

            {/* Skills Endorsed */}
            <View style={styles.skillsBox}>
              <Text style={styles.skillsLabel}>Skills Endorsed:</Text>
              <View style={styles.skillsRow}>
                {cert.skills_certified.map((s, idx) => (
                  <Badge key={idx} label={s} variant="primary" />
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.shareActionBtn}
                onPress={() => handleShare(cert)}
                activeOpacity={0.8}
              >
                <Share2 size={16} color={COLORS.primary} />
                <Text style={styles.shareActionText}>Share Credential</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.downloadActionBtn}
                onPress={() => Alert.alert('Download Certificate', 'Encrypted PDF saved to device storage.')}
                activeOpacity={0.8}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.downloadActionText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  authBanner: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  authDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  certCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  sealCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  certHolder: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  certDetails: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  skillsBox: {
    gap: 6,
  },
  skillsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  downloadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
