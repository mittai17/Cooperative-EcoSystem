import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SectionHeader } from '../../components/SectionHeader';
import { Button } from '../../components/Button';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  COOP_SECTORS,
  COMPETENCY_TAXONOMY,
  INITIAL_JOBS,
  CooperativeJob,
} from './employerData';
import {
  Briefcase,
  MapPin,
  Tag,
  Users,
  FileText,
  DollarSign,
  Plus,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';

const JOB_TYPES = ['Full-time', 'Internship', 'Contract', 'Part-time'] as const;

export const JobEditorScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'JobEditor'>>();
  const jobId = route.params?.jobId;
  const isEditing = Boolean(jobId);

  const existingJob = jobId ? INITIAL_JOBS.find((j) => j.id === jobId) : undefined;

  // Form state
  const [title, setTitle] = useState(existingJob?.title ?? '');
  const [sector, setSector] = useState<string>(existingJob?.sector ?? COOP_SECTORS[0]);
  const [location, setLocation] = useState(existingJob?.location ?? '');
  const [jobType, setJobType] = useState<string>(existingJob?.type ?? JOB_TYPES[0]);
  const [salaryRange, setSalaryRange] = useState(existingJob?.salary ?? '');
  const [openings, setOpenings] = useState(existingJob?.openings ?? 3);
  const [description, setDescription] = useState(existingJob?.description ?? '');
  const [deadline, setDeadline] = useState(existingJob?.deadline ?? '2026-11-30');
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(
    existingJob?.skills_required ?? [
      'Cooperative Management',
      'Dairy Operations',
    ]
  );
  const [customTagInput, setCustomTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleCompetency = (tag: string) => {
    if (selectedCompetencies.includes(tag)) {
      setSelectedCompetencies(selectedCompetencies.filter((t) => t !== tag));
    } else {
      setSelectedCompetencies([...selectedCompetencies, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedCompetencies.includes(trimmed)) {
      setSelectedCompetencies([...selectedCompetencies, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please provide a valid Job Title.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Missing Field', 'Please provide job location.');
      return;
    }
    if (selectedCompetencies.length === 0) {
      Alert.alert('Missing Competencies', 'Select at least one required cooperative competency.');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        Alert.alert(
          isEditing ? 'Job Updated' : 'Job Published',
          isEditing
            ? 'The opening details have been updated successfully.'
            : 'Your cooperative job requisition is now active and published to verified trainees.',
          [{ text: 'View Postings', onPress: () => navigation.goBack() }]
        );
      }, 300);
    }, 800);
  };

  return (
    <ScrollScreen
      title={isEditing ? 'Edit Job Opening' : 'Post Cooperative Job'}
      subtitle="Define role requirements and match against verified NCCT trainees"
      onBack={() => navigation.goBack()}
      avoidKeyboard
    >
      <View style={styles.container}>
        {/* Banner */}
        <View style={styles.infoBanner}>
          <Briefcase size={ICON.md} color={COLORS.primary} />
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>
              {isEditing ? 'Updating Vacancy' : 'New Cooperative Requisition'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              Target certified graduates from 14 National RICMs/ICMs and VAMNICOM.
            </Text>
          </View>
        </View>

        {/* Section 1: Job Basics */}
        <SectionHeader title="Role Overview" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Job Title *</Text>
          <View style={styles.inputWrap}>
            <Briefcase size={ICON.sm} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Dairy Procurement Supervisor"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Cooperative Sector / Department *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {COOP_SECTORS.map((sec) => {
              const active = sector === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.sectorPill, active && styles.sectorPillActive]}
                  onPress={() => setSector(sec)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sectorPillText, active && styles.sectorPillTextActive]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Location (District / State) *</Text>
          <View style={styles.inputWrap}>
            <MapPin size={ICON.sm} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Anand, Gujarat or Pune, Maharashtra"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Employment Type</Text>
          <View style={styles.typeRow}>
            {JOB_TYPES.map((t) => {
              const active = jobType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeButton, active && styles.typeButtonActive]}
                  onPress={() => setJobType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeButtonText, active && styles.typeButtonTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Compensation & Openings */}
        <SectionHeader title="Terms & Openings" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Salary Range / Remuneration</Text>
          <View style={styles.inputWrap}>
            <DollarSign size={ICON.sm} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              value={salaryRange}
              onChangeText={setSalaryRange}
              placeholder="e.g. ₹4,50,000 - ₹6,00,000 / year"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Number of Openings</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setOpenings(Math.max(1, openings - 1))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.stepperValueBox}>
              <Users size={ICON.sm} color={COLORS.primary} />
              <Text style={styles.stepperValueText}>{openings} positions</Text>
            </View>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setOpenings(openings + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Application Deadline</Text>
          <View style={styles.inputWrap}>
            <Calendar size={ICON.sm} color={COLORS.textMuted} />
            <TextInput
              style={styles.textInput}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Section 3: Required Competencies (NCCT Taxonomy) */}
        <SectionHeader title="Required Competencies (NCCT Taxonomy)" />
        <View style={styles.card}>
          <Text style={styles.hintText}>
            Select competencies verified by NCCT / VAMNICOM to automatically calculate candidate match scores.
          </Text>

          <View style={styles.tagsContainer}>
            {COMPETENCY_TAXONOMY.map((tag) => {
              const selected = selectedCompetencies.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  onPress={() => toggleCompetency(tag)}
                  activeOpacity={0.8}
                >
                  {selected ? (
                    <CheckCircle2 size={14} color={COLORS.textInverse} />
                  ) : (
                    <Plus size={14} color={COLORS.textSecondary} />
                  )}
                  <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom competency tag adder */}
          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Add Custom Competency</Text>
          <View style={styles.customTagRow}>
            <TextInput
              style={styles.customTagInput}
              value={customTagInput}
              onChangeText={setCustomTagInput}
              placeholder="e.g. Organic Milk Certification"
              placeholderTextColor={COLORS.textMuted}
              onSubmitEditing={addCustomTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={addCustomTag}
              activeOpacity={0.8}
            >
              <Plus size={ICON.sm} color={COLORS.textInverse} />
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {selectedCompetencies.length > 0 && (
            <View style={styles.selectedTagsSummary}>
              <Text style={styles.summaryLabel}>
                Selected ({selectedCompetencies.length}):
              </Text>
              <View style={styles.selectedTagsList}>
                {selectedCompetencies.map((tag) => (
                  <View key={tag} style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>{tag}</Text>
                    <TouchableOpacity onPress={() => toggleCompetency(tag)}>
                      <X size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Section 4: Detailed Description */}
        <SectionHeader title="Job Description & Responsibilities" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Role Summary & Cooperative Responsibilities</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe role scope, reporting structure, society interaction, and operational objectives..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length} characters</Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionWrap}>
          <Button
            label={isEditing ? 'Save Changes' : 'Publish Cooperative Opening'}
            variant="primary"
            onPress={handleSave}
            loading={saving}
            icon={savedSuccess ? <CheckCircle2 size={ICON.sm} color={COLORS.textInverse} /> : <Briefcase size={ICON.sm} color={COLORS.textInverse} />}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.primarySurface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  bannerSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
  },
  fieldLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textPrimary,
    marginBottom: SPACE.xs,
  },
  fieldSpacing: {
    marginTop: SPACE.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    height: HIT,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
  },
  textInput: {
    flex: 1,
    ...TEXT.body,
    height: '100%',
    padding: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
  },
  sectorPill: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectorPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sectorPillText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  sectorPillTextActive: {
    color: COLORS.textInverse,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  typeButton: {
    flex: 1,
    minWidth: '22%',
    height: HIT - 4,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: COLORS.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  stepperButton: {
    width: HIT,
    height: HIT,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepperValueBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    height: HIT,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperValueText: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  hintText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACE.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
    marginBottom: SPACE.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagChipText: {
    ...TEXT.caption,
    color: COLORS.textPrimary,
  },
  tagChipTextSelected: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  customTagRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    height: HIT - 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
    ...TEXT.body,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: HIT - 4,
    paddingHorizontal: SPACE.md,
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADII.md,
    justifyContent: 'center',
  },
  addTagButtonText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  selectedTagsSummary: {
    marginTop: SPACE.md,
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACE.xs,
  },
  summaryLabel: {
    ...TEXT.captionStrong,
    color: COLORS.textMuted,
  },
  selectedTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  selectedBadgeText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.sm,
    minHeight: 110,
    ...TEXT.body,
  },
  charCount: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACE.xs,
  },
  actionWrap: {
    marginTop: SPACE.sm,
    marginBottom: SPACE.xl,
  },
});
