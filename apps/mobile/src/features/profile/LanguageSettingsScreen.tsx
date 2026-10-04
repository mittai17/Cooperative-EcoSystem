import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Check, ChevronLeft, Globe } from 'lucide-react-native';
import { SUPPORTED_LANGUAGES, setLanguage, SupportedLanguageCode } from '../../i18n';
import { COLORS, ICON, RADII, SPACE, TEXT } from '../../constants/theme';

const GREETINGS: Record<SupportedLanguageCode, string> = {
  en: 'Welcome to NURVEX',
  hi: 'NURVEX में आपका स्वागत है',
  mr: 'NURVEX मध्ये आपले स्वागत आहे',
  gu: 'NURVEX માં આપનું સ્વાગત છે',
  ta: 'NURVEX-க்கு உங்களை வரவேற்கிறோம்',
};

export const LanguageSettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const navigation = useNavigation();
  const [switching, setSwitching] = useState<string | null>(null);

  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';

  const handleSelectLanguage = async (code: SupportedLanguageCode) => {
    if (code === currentLang) return;
    setSwitching(code);
    try {
      await setLanguage(code);
    } catch (err) {
      console.warn('Failed to switch language:', err);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('common:back', 'Back')}
          >
            <ChevronLeft size={ICON.lg} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>
            {t('profile:language', 'Preferred Language')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner with Globe icon */}
        <View style={styles.bannerCard}>
          <View style={styles.globeIconBox}>
            <Globe size={28} color={COLORS.primary} />
          </View>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>
              {GREETINGS[currentLang as SupportedLanguageCode] ?? GREETINGS.en}
            </Text>
            <Text style={styles.bannerSubtitle}>
              Select your interface language. Cooperative training and learning modules will adapt accordingly.
            </Text>
          </View>
        </View>

        {/* Language Options List */}
        <View style={styles.optionsList}>
          {SUPPORTED_LANGUAGES.map((language) => {
            const isSelected = currentLang === language.code;
            const isPending = switching === language.code;

            return (
              <TouchableOpacity
                key={language.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => void handleSelectLanguage(language.code)}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.labelsBox}>
                  <Text style={[styles.nativeLabel, isSelected && styles.nativeLabelSelected]}>
                    {language.native}
                  </Text>
                  <Text style={styles.englishLabel}>{language.label}</Text>
                </View>

                {isPending ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : isSelected ? (
                  <View style={styles.checkCircle}>
                    <Check size={18} color={COLORS.textInverse} />
                  </View>
                ) : (
                  <View style={styles.radioUnchecked} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Language changes update instantly without requiring app restart. Offline course packages and attendance records preserve their multilingual metadata.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: SPACE.sm,
    padding: SPACE.xs,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    ...TEXT.section,
    fontSize: 18,
  },
  content: {
    padding: SPACE.md,
    gap: SPACE.md,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACE.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACE.md,
  },
  globeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextBox: {
    flex: 1,
  },
  bannerTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primary,
    fontSize: 15,
  },
  bannerSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  optionsList: {
    gap: SPACE.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  labelsBox: {
    flex: 1,
  },
  nativeLabel: {
    ...TEXT.bodyStrong,
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  nativeLabelSelected: {
    color: COLORS.primary,
  },
  englishLabel: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioUnchecked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  noteBox: {
    padding: SPACE.sm,
  },
  noteText: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default LanguageSettingsScreen;
