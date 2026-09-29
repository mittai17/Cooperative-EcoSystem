import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Share, Alert } from 'react-native';
import { COLORS, CARD, ICON, SPACE, TEXT } from '../constants/theme';
import { ScrollScreen } from '../components/ScrollScreen';
import { EmptyState, LoadingState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { IconChip } from '../components/IconChip';
import { apiService } from '../services/api';
import { useOnMount } from '../hooks/useOnMount';
import { formatDate } from '../services/utils';
import { Award, Share2, Calendar, Building, Hash } from 'lucide-react-native';
import { CertificateItem } from '../types';

export const CertificatesScreen = ({ navigation }: any) => {
  const [certs, setCerts] = useState<CertificateItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiService.getCertificates();
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
    try {
      await Share.share({
        title: 'Cooperative certificate',
        message: `${cert.programme_title}, issued to ${cert.holder_name} by ${cert.issuer}. Certificate ID: ${cert.id}`,
      });
    } catch {
      Alert.alert('Share', 'Unable to open the share sheet.');
    }
  };

  return (
    <ScrollScreen
      title="Certificates"
      onBack={() => navigation.goBack()}
      isLive={isLive}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {certs === null ? <LoadingState /> : null}

      {certs !== null && certs.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          message="Certificates appear here after you complete a programme."
        />
      ) : null}

      {(certs ?? []).map((cert) => {
        const valid = cert.status.toLowerCase() === 'valid';
        return (
          <View key={cert.id} style={styles.card}>
            <View style={styles.header}>
              <IconChip size={40}>
                <Award size={ICON.md} color={COLORS.primary} />
              </IconChip>
              <View style={styles.flex}>
                <Text style={styles.title}>{cert.programme_title}</Text>
                <Text style={styles.caption}>{cert.holder_name}</Text>
              </View>
              <Badge label={cert.status} variant={valid ? 'success' : 'neutral'} verified={valid} />
            </View>

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
                  {cert.grade ? ` · Grade ${cert.grade}` : ''}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Hash size={ICON.sm} color={COLORS.textMuted} />
                <Text style={[styles.caption, styles.flex]} selectable>
                  {cert.id}
                </Text>
              </View>
            </View>

            {cert.skills_certified.length > 0 ? (
              <View style={styles.skills}>
                {cert.skills_certified.map((s) => (
                  <Badge key={s} label={s} />
                ))}
              </View>
            ) : null}

            <Button
              label="Share"
              variant="secondary"
              icon={<Share2 size={ICON.md} color={COLORS.primary} />}
              onPress={() => handleShare(cert)}
              accessibilityLabel={`Share certificate ${cert.programme_title}`}
            />
          </View>
        );
      })}
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { ...CARD, padding: SPACE.md, gap: SPACE.md - SPACE.xs },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md - SPACE.xs },
  title: { ...TEXT.bodyStrong },
  caption: { ...TEXT.caption },
  details: { gap: SPACE.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
});
