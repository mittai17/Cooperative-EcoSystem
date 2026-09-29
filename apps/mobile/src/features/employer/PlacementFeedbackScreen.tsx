import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  INITIAL_APPLICANTS,
  INITIAL_JOBS,
  COMPETENCY_TAXONOMY,
} from './employerData';
import {
  Star,
  Award,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Users,
  Building,
  Briefcase,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';

const RECOMMENDATION_OPTIONS = [
  'Strongly Recommend',
  'Recommend',
  'Neutral',
  'Needs Retraining',
] as const;

const RELEVANCE_OPTIONS = ['Exceptional', 'High', 'Moderate', 'Low'] as const;

export const PlacementFeedbackScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'PlacementFeedback'>>();
  const { applicationId } = route.params;

  const applicant = useMemo(() => {
    return (
      INITIAL_APPLICANTS.find((a) => a.id === applicationId) ||
      INITIAL_APPLICANTS[0]
    );
  }, [applicationId]);

  const job = useMemo(() => {
    return (
      INITIAL_JOBS.find((j) => j.id === applicant.job_id) ||
      INITIAL_JOBS[0]
    );
  }, [applicant]);

  // Form ratings (1-5 stars)
  const [technicalRating, setTechnicalRating] = useState(5);
  const [teamworkRating, setTeamworkRating] = useState(4);
  const [ethicsRating, setEthicsRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);

  const [recommendation, setRecommendation] = useState<string>(RECOMMENDATION_OPTIONS[0]);
  const [trainingRelevance, setTrainingRelevance] = useState<string>(RELEVANCE_OPTIONS[0]);

  // Tag selections
  const [usefulSkills, setUsefulSkills] = useState<string[]>([
    'Dairy Operations',
    'Quality Control & Milk Testing',
    'Cold Chain Management',
  ]);
  const [missingSkills, setMissingSkills] = useState<string[]>(['PACS ERP & Accounting']);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleUsefulSkill = (skill: string) => {
    if (usefulSkills.includes(skill)) {
      setUsefulSkills(usefulSkills.filter((s) => s !== skill));
    } else {
      setUsefulSkills([...usefulSkills, skill]);
      setMissingSkills(missingSkills.filter((s) => s !== skill));
    }
  };

  const toggleMissingSkill = (skill: string) => {
    if (missingSkills.includes(skill)) {
      setMissingSkills(missingSkills.filter((s) => s !== skill));
    } else {
      setMissingSkills([...missingSkills, skill]);
      setUsefulSkills(usefulSkills.filter((s) => s !== skill));
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      Alert.alert(
        'Feedback Recorded',
        'Thank you! Your feedback has been logged into the NCCT National Skill Intelligence Network, directly updating curriculum requirements and demand gap analytics.',
        [{ text: 'Return', onPress: () => navigation.goBack() }]
      );
    }, 700);
  };

  const renderStars = (
    rating: number,
    onRate: (val: number) => void,
    label: string
  ) => (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.starsGroup}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Star
              size={ICON.md + 2}
              color={star <= rating ? '#EAB308' : COLORS.border}
              fill={star <= rating ? '#EAB308' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
        <Text style={styles.ratingScore}>{rating}/5</Text>
      </View>
    </View>
  );

  return (
    <ScrollScreen
      title="Placement Feedback"
      subtitle="Feed verified performance data into NCCT national analytics"
      onBack={() => navigation.goBack()}
      avoidKeyboard
    >
      <View style={styles.container}>
        {/* Placement Context Card */}
        <View style={styles.contextCard}>
          <View style={styles.contextTop}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>{applicant.avatar_initials}</Text>
            </View>
            <View style={styles.contextInfo}>
              <Text style={styles.candidateName}>{applicant.name}</Text>
              <Text style={styles.jobTitleText}>{job.title}</Text>
              <Text style={styles.employerNameText}>{job.employer}</Text>
            </View>
          </View>
          <View style={styles.contextFooter}>
            <Badge label={`Alum of ${applicant.institute}`} variant="primary" />
            <Text style={styles.dateLabel}>Placed on {applicant.applied_at}</Text>
          </View>
        </View>

        {/* Explainable Impact Banner */}
        <View style={styles.impactBanner}>
          <TrendingUp size={ICON.md} color={COLORS.primary} />
          <View style={styles.impactTextWrap}>
            <Text style={styles.impactTitle}>Closing the Cooperative Feedback Loop</Text>
            <Text style={styles.impactDesc}>
              Ratings recalibrate NCCT training modules and update the national skill demand index in real-time.
            </Text>
          </View>
        </View>

        {/* Section 1: Core Performance Ratings */}
        <SectionHeader title="Core Competencies Evaluation" />
        <View style={styles.card}>
          {renderStars(technicalRating, setTechnicalRating, 'Technical Competency')}
          <View style={styles.divider} />
          {renderStars(teamworkRating, setTeamworkRating, 'Teamwork & Society Relations')}
          <View style={styles.divider} />
          {renderStars(ethicsRating, setEthicsRating, 'Cooperative Ethics & Values')}
          <View style={styles.divider} />
          {renderStars(overallRating, setOverallRating, 'Overall Job Performance')}
        </View>

        {/* Section 2: Training Relevance & Recommendation */}
        <SectionHeader title="Institutional Alignment" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Training Relevance to Cooperative Needs</Text>
          <View style={styles.pillsWrap}>
            {RELEVANCE_OPTIONS.map((opt) => {
              const active = trainingRelevance === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillOption, active && styles.pillOptionActive]}
                  onPress={() => setTrainingRelevance(opt)}
                >
                  <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: SPACE.md }]}>
            Cooperative Retention & Hire Recommendation
          </Text>
          <View style={styles.pillsWrap}>
            {RECOMMENDATION_OPTIONS.map((opt) => {
              const active = recommendation === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pillOption, active && styles.pillOptionActive]}
                  onPress={() => setRecommendation(opt)}
                >
                  <Text style={[styles.pillOptionText, active && styles.pillOptionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: Observed Skill Strengths & Gaps */}
        <SectionHeader title="Observed Skills vs Missing Gaps" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Useful Skills Observed (Tap to select)
          </Text>
          <Text style={styles.subHint}>
            Skills the candidate applied effectively on the job:
          </Text>
          <View style={styles.tagsContainer}>
            {COMPETENCY_TAXONOMY.slice(0, 8).map((skill) => {
              const isSelected = usefulSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.tagPill, isSelected && styles.tagPillUseful]}
                  onPress={() => toggleUsefulSkill(skill)}
                >
                  {isSelected ? <CheckCircle2 size={12} color={COLORS.success} /> : null}
                  <Text style={[styles.tagPillText, isSelected && styles.tagPillTextUseful]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: SPACE.md }]}>
            Skill Gaps Identified (Missing Competencies)
          </Text>
          <Text style={styles.subHint}>
            Competencies where future NCCT batches need deeper instruction:
          </Text>
          <View style={styles.tagsContainer}>
            {COMPETENCY_TAXONOMY.slice(8, 16).map((skill) => {
              const isSelected = missingSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.tagPill, isSelected && styles.tagPillMissing]}
                  onPress={() => toggleMissingSkill(skill)}
                >
                  {isSelected ? <AlertCircle size={12} color={COLORS.danger} /> : null}
                  <Text style={[styles.tagPillText, isSelected && styles.tagPillTextMissing]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 4: Detailed Qualitative Feedback */}
        <SectionHeader title="Supervisor Comments & Recommendations" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Qualitative Review</Text>
          <TextInput
            style={styles.textArea}
            value={comments}
            onChangeText={setComments}
            placeholder="Share specific observations on the trainee's performance, member management, and areas of growth..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <View style={styles.actionWrap}>
          <Button
            label="Submit Official Placement Feedback"
            variant="primary"
            onPress={handleSubmit}
            loading={submitting}
            icon={<CheckCircle2 size={ICON.sm} color={COLORS.textInverse} />}
          />
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  contextCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  contextTop: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  contextInfo: {
    flex: 1,
  },
  candidateName: {
    ...TEXT.section,
    color: COLORS.primaryDark,
  },
  jobTitleText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  employerNameText: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  contextFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACE.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  dateLabel: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  impactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  impactTextWrap: {
    flex: 1,
  },
  impactTitle: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  impactDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACE.xs,
  },
  ratingLabel: {
    ...TEXT.body,
    flex: 1,
    color: COLORS.textPrimary,
  },
  starsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
    marginLeft: 6,
    width: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACE.xs,
  },
  fieldLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    marginBottom: SPACE.xs,
  },
  subHint: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: SPACE.xs,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  pillOption: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillOptionText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  pillOptionTextActive: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
    marginTop: 4,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagPillUseful: {
    backgroundColor: COLORS.successSurface,
    borderColor: '#C6F6D5',
  },
  tagPillMissing: {
    backgroundColor: COLORS.dangerSurface,
    borderColor: '#FED7D7',
  },
  tagPillText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  tagPillTextUseful: {
    color: '#22543D',
    fontWeight: '600',
  },
  tagPillTextMissing: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    minHeight: 90,
    ...TEXT.body,
  },
  actionWrap: {
    marginTop: SPACE.xs,
    marginBottom: SPACE.xl,
  },
});
