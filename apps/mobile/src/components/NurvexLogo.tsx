import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACE } from '../constants/theme';

const MARK = require('../../assets/nurvex-mark.png');

interface NurvexLogoProps {
  size?: 'sm' | 'default' | 'lg';
  inverted?: boolean;
  showTagline?: boolean;
}

const SIZES = {
  sm: { mark: 30, text: 16, tagline: 8 },
  default: { mark: 38, text: 20, tagline: 9 },
  lg: { mark: 52, text: 28, tagline: 10 },
} as const;

export const NurvexLogo: React.FC<NurvexLogoProps> = ({
  size = 'default',
  inverted = false,
  showTagline = false,
}) => {
  const dimensions = SIZES[size];
  return (
    <View style={styles.row} accessible accessibilityLabel="NURVEX - Learn, Skill, Work, Grow Together">
      <Image
        source={MARK}
        style={{ width: dimensions.mark, height: dimensions.mark }}
        resizeMode="contain"
      />
      <View style={styles.words}>
        <Text
          style={[
            styles.wordmark,
            { fontSize: dimensions.text, color: inverted ? COLORS.textInverse : COLORS.textPrimary },
          ]}
        >
          NURVEX
        </Text>
        {showTagline ? (
          <Text
            style={[
              styles.tagline,
              { fontSize: dimensions.tagline, color: inverted ? 'rgba(255,255,255,0.72)' : COLORS.textMuted },
            ]}
          >
            LEARN · SKILL · WORK · GROW TOGETHER
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm + 2 },
  words: { gap: 3 },
  wordmark: { fontWeight: '800', letterSpacing: 0.2 },
  tagline: { fontWeight: '600', letterSpacing: 1.1 },
});