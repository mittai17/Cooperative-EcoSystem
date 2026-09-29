import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SearchField } from '../../components/SearchField';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import {
  Award,
  CheckCircle2,
  Filter,
  MapPin,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';

interface SearchCandidate {
  id: string;
  name: string;
  avatar_initials: string;
  occupation: string;
  sector: 'Dairy' | 'Sugar' | 'Credit' | 'Handloom' | 'Fisheries' | 'Agriculture';
  experienceLevel: 'Entry' | 'Mid' | 'Senior';
  yearsExperience: number;
  state: string;
  district: string;
  matchScore: number;
  verified: boolean;
  institute: string;
  topSkills: string[];
}

const TALENT_DATA: SearchCandidate[] = [
  {
    id: 'trainee-pooja-patel',
    name: 'Pooja Patel',
    avatar_initials: 'PP',
    occupation: 'Dairy Operations Specialist',
    sector: 'Dairy',
    experienceLevel: 'Mid',
    yearsExperience: 2,
    state: 'Gujarat',
    district: 'Anand',
    matchScore: 96,
    verified: true,
    institute: 'RICM Anand',
    topSkills: ['Dairy Operations', 'Cold Chain', 'Quality Testing'],
  },
  {
    id: 'trainee-rahul-deshmukh',
    name: 'Rahul Deshmukh',
    avatar_initials: 'RD',
    occupation: 'Cooperative Banking Analyst',
    sector: 'Credit',
    experienceLevel: 'Mid',
    yearsExperience: 3,
    state: 'Maharashtra',
    district: 'Pune',
    matchScore: 92,
    verified: true,
    institute: 'VAMNICOM Pune',
    topSkills: ['Credit Appraisal', 'PACS ERP', 'Statutory Audit'],
  },
  {
    id: 'trainee-anita-meena',
    name: 'Anita Meena',
    avatar_initials: 'AM',
    occupation: 'Agri-Business & Marketing Officer',
    sector: 'Agriculture',
    experienceLevel: 'Entry',
    yearsExperience: 1,
    state: 'Rajasthan',
    district: 'Jaipur',
    matchScore: 84,
    verified: true,
    institute: 'ICM Jaipur',
    topSkills: ['FPO Mobilization', 'Digital Marketing', 'Coop Law'],
  },
  {
    id: 'trainee-suresh-kumar',
    name: 'Suresh Kumar',
    avatar_initials: 'SK',
    occupation: 'Cooperative Sugar Process Engineer',
    sector: 'Sugar',
    experienceLevel: 'Senior',
    yearsExperience: 5,
    state: 'Maharashtra',
    district: 'Kolhapur',
    matchScore: 94,
    verified: true,
    institute: 'VAMNICOM Pune',
    topSkills: ['Sugar Manufacturing', 'Cogeneration', 'Member Relations'],
  },
  {
    id: 'trainee-meenakshi-sundaram',
    name: 'Meenakshi Sundaram',
    avatar_initials: 'MS',
    occupation: 'Handloom Cluster Development Manager',
    sector: 'Handloom',
    experienceLevel: 'Mid',
    yearsExperience: 3,
    state: 'Tamil Nadu',
    district: 'Madurai',
    matchScore: 89,
    verified: true,
    institute: 'ICM Madurai',
    topSkills: ['Handloom Weaving', 'Dyeing Standards', 'Export Compliance'],
  },
  {
    id: 'trainee-amal-roy',
    name: 'Amal Roy',
    avatar_initials: 'AR',
    occupation: 'Fisheries Cooperative Supervisor',
    sector: 'Fisheries',
    experienceLevel: 'Entry',
    yearsExperience: 1,
    state: 'West Bengal',
    district: 'Kalyani',
    matchScore: 87,
    verified: true,
    institute: 'RICM Kalyani',
    topSkills: ['Hatchery Management', 'Cold Chain', 'Feed Nutrition'],
  },
  {
    id: 'trainee-priya-nair',
    name: 'Priya Nair',
    avatar_initials: 'PN',
    occupation: 'Primary Agriculture Credit Society (PACS) Secretary',
    sector: 'Credit',
    experienceLevel: 'Senior',
    yearsExperience: 4,
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    matchScore: 95,
    verified: true,
    institute: 'ICM Thiruvananthapuram',
    topSkills: ['PACS Computerization', 'NABARD Guidelines', 'Loan Recovery'],
  },
];

const SECTOR_FILTERS = ['All', 'Dairy', 'Sugar', 'Credit', 'Handloom', 'Fisheries', 'Agriculture'] as const;
const EXP_FILTERS = ['All', 'Entry (0-1 yr)', 'Mid (2-4 yrs)', 'Senior (5+ yrs)'] as const;
const STATE_FILTERS = ['All', 'Gujarat', 'Maharashtra', 'Tamil Nadu', 'Rajasthan', 'Kerala', 'West Bengal'] as const;
const MIN_MATCH_FILTERS = [0, 70, 80, 90] as const;

export const TalentSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedExp, setSelectedExp] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [minMatch, setMinMatch] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return TALENT_DATA.filter((candidate) => {
      // Sector
      if (selectedSector !== 'All' && candidate.sector !== selectedSector) {
        return false;
      }
      // Experience
      if (selectedExp !== 'All') {
        if (selectedExp.startsWith('Entry') && candidate.experienceLevel !== 'Entry') return false;
        if (selectedExp.startsWith('Mid') && candidate.experienceLevel !== 'Mid') return false;
        if (selectedExp.startsWith('Senior') && candidate.experienceLevel !== 'Senior') return false;
      }
      // State
      if (selectedState !== 'All' && candidate.state !== selectedState) {
        return false;
      }
      // Match Score
      if (candidate.matchScore < minMatch) {
        return false;
      }
      // Verified only
      if (verifiedOnly && !candidate.verified) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = candidate.name.toLowerCase().includes(q);
        const matchesOcc = candidate.occupation.toLowerCase().includes(q);
        const matchesDistrict = candidate.district.toLowerCase().includes(q);
        const matchesSkill = candidate.topSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesOcc && !matchesDistrict && !matchesSkill) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedSector, selectedExp, selectedState, minMatch, verifiedOnly]);

  return (
    <ScrollScreen
      title="Cooperative Talent Search"
      subtitle="Discover verified trainees from 14 National RICMs/ICMs"
      tab
      sticky={
        <View style={styles.stickyContainer}>
          <SearchField
            placeholder="Search by skill, name, role or district..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Sector Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {SECTOR_FILTERS.map((sec) => {
              const active = selectedSector === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedSector(sec)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Secondary Filters (State & Min Match) */}
          <View style={styles.secondaryFilterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryFilterScroll}
            >
              {/* Match Score Filter */}
              <TouchableOpacity
                style={[styles.smallFilterBtn, minMatch > 0 && styles.smallFilterBtnActive]}
                onPress={() => {
                  const nextIndex = (MIN_MATCH_FILTERS.indexOf(minMatch as any) + 1) % MIN_MATCH_FILTERS.length;
                  setMinMatch(MIN_MATCH_FILTERS[nextIndex]);
                }}
              >
                <Sparkles size={12} color={minMatch > 0 ? COLORS.textInverse : COLORS.primary} />
                <Text style={[styles.smallFilterText, minMatch > 0 && styles.smallFilterTextActive]}>
                  {minMatch === 0 ? 'Min Match: Any' : `Min Match: ${minMatch}%+`}
                </Text>
              </TouchableOpacity>

              {/* State Filter */}
              {STATE_FILTERS.map((st) => {
                const active = selectedState === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.smallFilterBtn, active && styles.smallFilterBtnActive]}
                    onPress={() => setSelectedState(st)}
                  >
                    <Text style={[styles.smallFilterText, active && styles.smallFilterTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.resultsCountBar}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={styles.boldText}>{filteredCandidates.length}</Text> verified cooperative candidates
          </Text>
          <TouchableOpacity
            style={[styles.verifiedToggle, verifiedOnly && styles.verifiedToggleActive]}
            onPress={() => setVerifiedOnly(!verifiedOnly)}
          >
            <ShieldCheck size={14} color={verifiedOnly ? COLORS.success : COLORS.textMuted} />
            <Text style={[styles.verifiedToggleText, verifiedOnly && styles.verifiedToggleTextActive]}>
              Verified Only
            </Text>
          </TouchableOpacity>
        </View>

        {filteredCandidates.length === 0 ? (
          <EmptyState
            title="No talent found"
            message="Try widening your sector, state, or minimum match score filter."
          />
        ) : (
          <View style={styles.candidatesGrid}>
            {filteredCandidates.map((candidate) => (
              <TouchableOpacity
                key={candidate.id}
                style={styles.candidateCard}
                activeOpacity={0.88}
                onPress={() =>
                  navigation.navigate('CandidateDetail', {
                    traineeId: candidate.id,
                  })
                }
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{candidate.avatar_initials}</Text>
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <View style={styles.candidateNameRow}>
                      <Text style={styles.candidateName}>{candidate.name}</Text>
                      {candidate.verified ? (
                        <ShieldCheck size={ICON.sm} color={COLORS.primary} />
                      ) : null}
                    </View>
                    <Text style={styles.candidateOccupation}>{candidate.occupation}</Text>
                    <View style={styles.locationChip}>
                      <MapPin size={12} color={COLORS.textMuted} />
                      <Text style={styles.locationText}>
                        {candidate.district}, {candidate.state}
                      </Text>
                    </View>
                  </View>
                  <Badge
                    label={`${candidate.matchScore}% Match`}
                    variant={candidate.matchScore >= 90 ? 'success' : 'primary'}
                  />
                </View>

                {/* Institute & Experience Meta */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <GraduationCap size={14} color={COLORS.primary} />
                    <Text style={styles.metaItemText}>{candidate.institute}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Briefcase size={14} color={COLORS.textSecondary} />
                    <Text style={styles.metaItemText}>
                      {candidate.yearsExperience} yrs exp ({candidate.sector})
                    </Text>
                  </View>
                </View>

                {/* Top Verified Skills */}
                <View style={styles.skillsWrap}>
                  {candidate.topSkills.map((skill) => (
                    <View key={skill} style={styles.skillPill}>
                      <CheckCircle2 size={10} color={COLORS.success} />
                      <Text style={styles.skillPillText}>{skill}</Text>
                    </View>
                  ))}
                </View>

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                  <Text style={styles.viewProfileText}>View Verified Passport</Text>
                  <ChevronRight size={ICON.sm} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACE.xs,
  },
  filterBar: {
    flexDirection: 'row',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
  },
  filterChip: {
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.textInverse,
  },
  secondaryFilterRow: {
    paddingHorizontal: SPACE.md,
    paddingBottom: SPACE.xs,
  },
  secondaryFilterScroll: {
    flexDirection: 'row',
    gap: SPACE.xs,
  },
  smallFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm + 2,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallFilterBtnActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  smallFilterText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  smallFilterTextActive: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  container: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  resultsCountBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCountText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  verifiedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifiedToggleActive: {
    backgroundColor: COLORS.successSurface,
    borderColor: '#C6F6D5',
  },
  verifiedToggleText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  verifiedToggleTextActive: {
    color: '#22543D',
    fontWeight: '600',
  },
  candidatesGrid: {
    gap: SPACE.md,
  },
  candidateCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  candidateName: {
    ...TEXT.bodyStrong,
    color: COLORS.textPrimary,
  },
  candidateOccupation: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    ...TEXT.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACE.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.xs,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.badgeBg,
    paddingHorizontal: SPACE.xs + 2,
    paddingVertical: 2,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.badgeBorder,
  },
  skillPillText: {
    ...TEXT.caption,
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
    paddingTop: SPACE.xs,
  },
  viewProfileText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
});
