import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { COLORS, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  /** leading glyph (already sized/coloured) */
  icon?: React.ReactNode;
  /** trailing 44dp action, e.g. show/hide password */
  trailing?: { icon: React.ReactNode; label: string; onPress: () => void };
  hint?: string;
}

/** Labelled single-line input in the app's field style (same tokens as SearchField). */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, icon, trailing, hint, style, ...inputProps }, ref) => (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        {icon}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={label}
          {...inputProps}
        />
        {trailing ? (
          <TouchableOpacity
            onPress={trailing.onPress}
            style={styles.trailing}
            accessibilityRole="button"
            accessibilityLabel={trailing.label}
          >
            {trailing.icon}
          </TouchableOpacity>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
);
TextField.displayName = 'TextField';

export const FIELD_ICON = { size: ICON.md, color: COLORS.textMuted } as const;

const styles = StyleSheet.create({
  group: { gap: SPACE.xs },
  label: { ...TEXT.captionStrong },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    height: HIT + 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingLeft: SPACE.md,
  },
  input: { flex: 1, ...TEXT.body, height: '100%', padding: 0 },
  trailing: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  hint: { ...TEXT.caption },
});
