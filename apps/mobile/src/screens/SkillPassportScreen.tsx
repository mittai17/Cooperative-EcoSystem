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
  CheckCircle,
  Share2,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCheck,
} from 'lucide-react-native';
import { SkillPassportData, SkillPassportItem } from '../types';
import { MOCK_SKILL_PASSPORT } from '../services/mockData';

export const SkillPassportScreen = ({ navigation }: any) => {
  const [passportData, setPassportData] = useState<SkillPassportData>(MOCK_SKILL_PASSPORT);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const res = await apiService.getSkillPassport();
      setPassportData(res.passport);
      setIsLive(res.isLive);
    } catch {
      setIsLive(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSharePassport = async () => {
    try {
      await Share.share({
        message: 'View Ravindra Patil\'s Cooperative Skill Passport verified by NCCT / VAMNICOM: https://coopsetu.gov.in/passport/RP-9921',
        title: 'Cooperative Skill Passport',
      });
    } catch {
      Alert.alert('Share', 'Share link copied to clipboard.');
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedSkill((prev) => (prev === name ? null : name));
  };

  const summary = passportData.summary || {
    total_skills: passportData.skills.length,
    verified_count: passportData.skills.filter((s) => s.verified).length,
    avg_confidence: 72,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title="Skill Passport"
        subtitle="Cryptographically Verified Competencies"
        isLive={isLive}
        rightAction={
          <TouchableOpacity onPress={handleSharePassport} style={styles.shareBtn}>
            <Share2 size={18} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[COLORS.primary]} />}
      >
        {/* Overall Skill Strength Gauge Banner */}
        <View style={styles.gaugeCard}>
          <View style={styles.gaugeCircle}>
            <Text style={styles.gaugeNumber}>{summary.avg_confidence}%</Text>
            <Text style={styles.gaugeLabel}>Overall Strength</Text>
          </View>

          <View style={styles.gaugeInfo}>
            <View style={styles.verifiedHeader}>
              <ShieldCheck size={18} color={COLORS.success} />
              <Text style={styles.verifiedTag}>NCCT / VAMNICOM Endorsed</Text>
            </View>
            <Text style={styles.gaugeTitle}>Cooperative Readiness Index</Text>
            <Text style={styles.gaugeSub}>
              {summary.verified_count} of {summary.total_skills} skills verified via proctored institutional assessments.
            </Text>
          </View>
        </View>

        {/* Skill Passport Summary Bar */}
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{summary.total_skills}</Text>
            <Text style={styles.metricLabel}>Total Skills</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: COLORS.success }]}>{summary.verified_count}</Text>
            <Text style={styles.metricLabel}>Verified (CST)</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: COLORS.primary }]}>Tier 1</Text>
            <Text style={styles.metricLabel}>Eligibility</Text>
          </View>
        </View>

        {/* Skills List with Confidence and Evidence */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionTitle}>Top Skills & Evidence Ledger</Text>

          {passportData.skills.map((skill: SkillPassportItem) => {
            const isExpanded = expandedSkill === skill.name;

            return (
              <View key={skill.name} style={styles.skillCard}>
                <TouchableOpacity
                  style={styles.skillCardHeader}
                  onPress={() => toggleExpand(skill.name)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.skillNameRow}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      {skill.verified ? (
                        <Badge label="Verified" variant="success" verified />
                      ) : (
                        <Badge label="Self Assessed" variant="warning" />
                      )}
                    </View>
                    <Text style={styles.skillCategory}>{skill.category} • {skill.level}</Text>
                  </View>

                  <View style={styles.headerRightArea}>
                    <View style={styles.confidenceScoreWrap}>
                      <Text style={styles.confidenceScoreVal}>{skill.confidence}%</Text>
                      <Text style={styles.confidenceScoreLabel}>Proficiency</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={COLORS.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={COLORS.textSecondary} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Progress bar */}
                <View style={styles.confidenceTrack}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${skill.confidence}%`,
                        backgroundColor: skill.confidence >= 80 ? COLORS.success : COLORS.primaryLight,
                      },
                    ]}
                  />
                </View>

                {/* Expanded Evidence List */}
                {isExpanded && (
                  <View style={styles.evidenceContainer}>
                    <Text style={styles.evidenceTitle}>Verification Evidence:</Text>

                    {skill.evidence && skill.evidence.length > 0 ? (
                      skill.evidence.map((ev, i) => (
                        <View key={i} style={styles.evidenceRow}>
                          <FileCheck size={16} color={COLORS.primary} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.evidenceText}>{ev.title}</Text>
                            <Text style={styles.evidenceSub}>
                              {ev.type} • Verified on {ev.date}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noEvidenceText}>
                        No formal assessment linked yet. Complete an assessment to certify.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Certificate shortcut */}
        <TouchableOpacity
          style={styles.certBanner}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Certificates')}
        >
          <Award size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.certBannerTitle}>View Issued Certificates</Text>
            <Text style={styles.certBannerSub}>2 certificates issued with verification QR codes</Text>
          </View>
          <ExternalLink size={16} color={COLORS.primary} />
        </TouchableOpacity>
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
  shareBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  gaugeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...SHADOWS.sm,
  },
  gaugeCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface,
  },
  gaugeNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gaugeLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  gaugeInfo: {
    flex: 1,
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  gaugeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  gaugeSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  metricsBar: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  skillsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  skillCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.sm,
  },
  skillCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  skillNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  skillCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceScoreWrap: {
    alignItems: 'flex-end',
  },
  confidenceScoreVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  confidenceScoreLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  confidenceTrack: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  evidenceContainer: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  evidenceTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  evidenceSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  noEvidenceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  certBanner: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  certBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
