import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({ value, onChangeText, placeholder }) => (
  <View style={styles.box}>
    <Search size={ICON.md} color={COLORS.textMuted} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
      autoCorrect={false}
      accessibilityLabel={placeholder}
    />
    {value.length > 0 ? (
      <TouchableOpacity
        onPress={() => onChangeText('')}
        style={styles.clear}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
      >
        <X size={ICON.md} color={COLORS.textMuted} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingLeft: SPACE.md - SPACE.xs,
    height: HIT,
    gap: SPACE.sm,
    marginHorizontal: SPACE.md,
    marginTop: SPACE.sm,
  },
  input: {
    flex: 1,
    ...TEXT.body,
    height: '100%',
    padding: 0,
  },
  clear: {
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
