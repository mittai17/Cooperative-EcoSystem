import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { SUPPORTED_LANGUAGES, setLanguage } from '../i18n';
import { COLORS, ICON, RADII, SPACE, TEXT } from '../constants/theme';

export function LanguageSettingsScreen() {
  const { i18n } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Language</Text>
        <Text style={styles.description}>Choose your interface language. Content translations appear when available.</Text>
        {SUPPORTED_LANGUAGES.map((language) => {
          const selected = i18n.resolvedLanguage === language.code || i18n.language === language.code;
          return (
            <TouchableOpacity
              key={language.code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void setLanguage(language.code)}
              style={[styles.option, selected && styles.selected]}
            >
              <View style={styles.labels}>
                <Text style={styles.native}>{language.native}</Text>
                <Text style={styles.label}>{language.label}</Text>
              </View>
              {selected && <Check size={ICON.md} color={COLORS.primary} />}
            </TouchableOpacity>
          );
        })}
        <Text style={styles.note}>Some screens are still available in English while translations are prepared.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACE.lg, gap: SPACE.sm },
  title: { ...TEXT.title },
  description: { ...TEXT.body, color: COLORS.textSecondary, marginBottom: SPACE.md },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: SPACE.md, borderRadius: RADII.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  selected: { borderColor: COLORS.primary },
  labels: { flex: 1 },
  native: { ...TEXT.bodyStrong },
  label: { ...TEXT.caption, color: COLORS.textSecondary },
  note: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: SPACE.md },
});
