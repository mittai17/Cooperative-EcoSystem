import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SPACE, TEXT, RADII, CARD, ICON } from '../../constants/theme';
import { MOCK_PROGRAMMES, ProgrammeDetailData } from './mockData';
import { apiClient } from '../../api/client';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  AlertCircle,
  Share2,
} from 'lucide-react-native';

export const ProgrammeDetailScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ProgrammeDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const programmeId = route.params?.programmeId || 'p-cmf-01';

  const [programme, setProgramme] = useState<ProgrammeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProgramme() {
      setLoading(true);
      try {
        const data = await apiClient<any>(`/programmes/${programmeId}`);
        if (isMounted && data && data.title) {
          // Merge with detailed mock template to ensure all rich cooperative fields are present
          const fallback = MOCK_PROGRAMMES[programmeId] || MOCK_PROGRAMMES['p-cmf-01'];
          setProgramme({
            ...fallback,
            id: data.id || programmeId,
            title: data.title || fallback.title,
            sector: data.sector || fallback.sector,
            level: data.level || fallback.level,
            mode: data.mode || fallback.mode,
            duration_weeks: data.duration_weeks || fallback.duration_weeks,
            seats_total: data.seats_total || fallback.seats_total,
            seats_filled: data.seats_filled || fallback.seats_filled,
          });
        }
      } catch {
        if (isMounted) {
          setProgramme(MOCK_PROGRAMMES[programmeId] || MOCK_PROGRAMMES['p-cmf-01']);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProgramme();
    return () => {
      isMounted = false;
    };
  }, [programmeId]);

  if (loading || !programme) {
    return (
      <ScrollScreen title="Programme Overview" onBack={() => navigation.goBack()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading programme curriculum...</Text>
        </View>
      </ScrollScreen>
    );
  }

  const seatsAvailable = Math.max(0, programme.seats_total - programme.seats_filled);
  const fillPercentage = Math.min(100, Math.round((programme.seats_filled / programme.seats_total) * 100));

  const toggleModule = (id: string) => {
    setExpandedModule((prev) => (prev === id ? null : id));
  };

  return (
    <ScrollScreen
      title="Programme Overview"
      onBack={() => navigation.goBack()}
      rightAction={
        <TouchableOpacity style={styles.iconButton} accessibilityLabel="Share Programme">
          <Share2 size={ICON.md} color={COLORS.primaryDark} />
        </TouchableOpacity>
      }
    >
      {/* Sector & Category Badges */}
      <View style={styles.badgeRow}>
        <Badge label={programme.sector} variant="primary" />
        <Badge label={programme.level} variant="neutral" />
        <Badge label={programme.mode} variant="neutral" />
      </View>

      {/* Title & Host Institution */}
      <View style={styles.headerBlock}>
        <Text style={styles.titleText}>{programme.title}</Text>
        <View style={styles.institutionRow}>
          <Building2 size={ICON.sm} color={COLORS.primary} />
          <Text style={styles.institutionText}>{programme.institution_name}</Text>
        </View>
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Clock size={ICON.md} color={COLORS.primary} />
          <Text style={styles.metricValue}>{programme.duration_weeks} Weeks</Text>
          <Text style={styles.metricLabel}>{programme.duration_hours} Training Hrs</Text>
        </View>
        <View style={styles.metricCard}>
          <Users size={ICON.md} color={COLORS.primary} />
          <Text style={styles.metricValue}>{seatsAvailable} Seats Left</Text>
          <Text style={styles.metricLabel}>{fillPercentage}% Filled</Text>
        </View>
        <View style={styles.metricCard}>
          <Award size={ICON.md} color={COLORS.primary} />
          <Text style={styles.metricValue}>Govt Sponsored</Text>
          <Text style={styles.metricLabel}>NCCT Certified</Text>
        </View>
      </View>

      {/* Dates & Venue Card */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionHeading}>Important Dates & Campus Venue</Text>
        <View style={styles.infoRow}>
          <Calendar size={ICON.md} color={COLORS.textSecondary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Programme Schedule</Text>
            <Text style={styles.infoValue}>
              {programme.start_date} to {programme.end_date}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <AlertCircle size={ICON.md} color={COLORS.primary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Nomination Application Deadline</Text>
            <Text style={[styles.infoValue, { color: COLORS.danger }]}>{programme.application_deadline}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={ICON.md} color={COLORS.textSecondary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Residential Training Campus</Text>
            <Text style={styles.infoValue}>{programme.venue}</Text>
          </View>
        </View>
      </View>

      {/* Programme Summary & Objectives */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionHeading}>Programme Overview</Text>
        <Text style={styles.descriptionText}>{programme.description}</Text>

        <Text style={[styles.subHeading, { marginTop: SPACE.md }]}>Key Learning Outcomes</Text>
        {programme.objectives.map((obj, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <CheckCircle2 size={ICON.sm} color={COLORS.success} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>{obj}</Text>
          </View>
        ))}
      </View>

      {/* Eligibility Criteria */}
      <View style={[styles.card, styles.sectionCard]}>
        <Text style={styles.sectionHeading}>Eligibility & Deputation Criteria</Text>
        {programme.eligibility.map((item, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <CheckCircle2 size={ICON.sm} color={COLORS.primary} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        <Text style={[styles.subHeading, { marginTop: SPACE.md }]}>Target Participants</Text>
        {programme.target_audience.map((item, idx) => (
          <View key={idx} style={styles.targetAudiencePill}>
            <Text style={styles.targetAudienceText}>• {item}</Text>
          </View>
        ))}
      </View>

      {/* Curriculum & Modules */}
      <View style={[styles.card, styles.sectionCard]}>
        <View style={styles.moduleHeaderRow}>
          <Text style={styles.sectionHeading}>Curriculum Modules ({programme.modules.length})</Text>
          <BookOpen size={ICON.md} color={COLORS.primary} />
        </View>

        {programme.modules.map((mod) => {
          const isExpanded = expandedModule === mod.id;
          return (
            <TouchableOpacity
              key={mod.id}
              style={[styles.moduleCard, isExpanded && styles.moduleCardExpanded]}
              onPress={() => toggleModule(mod.id)}
              activeOpacity={0.8}
            >
              <View style={styles.moduleTop}>
                <View style={styles.moduleIndexBadge}>
                  <Text style={styles.moduleIndexText}>0{mod.sequence_order}</Text>
                </View>
                <View style={styles.moduleTitleWrap}>
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  <Text style={styles.moduleSubtitle}>
                    {mod.hours} Hours · {mod.category}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={ICON.md} color={COLORS.primary} />
                ) : (
                  <ChevronDown size={ICON.md} color={COLORS.textMuted} />
                )}
              </View>

              {isExpanded && (
                <View style={styles.moduleBody}>
                  <Text style={styles.moduleDescription}>{mod.description}</Text>
                  <Text style={styles.instructorName}>Faculty: {mod.instructor}</Text>
                  <View style={styles.skillsWrap}>
                    {mod.skills.map((skill, sIdx) => (
                      <View key={sIdx} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Footer */}
      <View style={styles.actionFooter}>
        <Button
          label="Nominate / Apply Now"
          onPress={() => navigation.navigate('NominationForm', { programmeId: programme.id })}
          variant="primary"
        />
        <Button
          label="Track My Nominations"
          onPress={() => navigation.navigate('MyNominations')}
          variant="secondary"
        />
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: SPACE.xl * 2,
    alignItems: 'center',
    gap: SPACE.md,
  },
  loadingText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  iconButton: {
    padding: SPACE.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  headerBlock: {
    gap: SPACE.xs,
  },
  titleText: {
    ...TEXT.title,
    fontSize: 22,
    lineHeight: 28,
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  institutionText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  metricCard: {
    flex: 1,
    ...CARD,
    padding: SPACE.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: COLORS.surface,
  },
  metricValue: {
    ...TEXT.bodyStrong,
    fontSize: 13,
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  metricLabel: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
  },
  sectionHeading: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  subHeading: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    paddingVertical: SPACE.xs,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  infoValue: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  descriptionText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
    paddingVertical: 2,
  },
  bulletIcon: {
    marginTop: 3,
  },
  bulletText: {
    ...TEXT.body,
    flex: 1,
    color: COLORS.textPrimary,
  },
  targetAudiencePill: {
    paddingVertical: 2,
  },
  targetAudienceText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.sm,
    padding: SPACE.sm,
    backgroundColor: COLORS.surface,
    gap: SPACE.xs,
  },
  moduleCardExpanded: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.card,
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  moduleIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIndexText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  moduleTitleWrap: {
    flex: 1,
  },
  moduleTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  moduleSubtitle: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  moduleBody: {
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACE.xs,
  },
  moduleDescription: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  instructorName: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
    marginTop: 2,
  },
  skillChip: {
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.badgeBg,
    borderWidth: 1,
    borderColor: COLORS.badgeBorder,
  },
  skillText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  actionFooter: {
    gap: SPACE.sm,
    paddingTop: SPACE.sm,
  },
});
