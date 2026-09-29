export const COLORS = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#FAF7F7',
  card: '#FFFFFF',
  border: '#EFE4E4',
  borderLight: '#F5EDED',

  // Brand accent (single red)
  primary: '#D8232A',
  primaryDark: '#1F1416', // warm ink (headings)
  primaryLight: '#E5484D',
  primarySurface: '#FDECEC',
  primaryBorder: '#F8C9CB',

  // Status (green is used for success only)
  success: '#10B981',
  successSurface: '#ECFDF5',
  danger: '#DC2626',
  dangerSurface: '#FEF2F2',

  // Neutrals / typography
  textPrimary: '#1F1416',
  textSecondary: '#5E5257',
  textMuted: '#8A7E82',
  textInverse: '#FFFFFF',

  // Neutral chips
  badgeBg: '#F6F0F0',
  badgeBorder: '#E6D9DA',

  // Media (camera overlay)
  media: '#1A1214',
  mediaText: '#D9CDD0',
  scrim: 'rgba(0,0,0,0.55)',
};

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

// 8pt rhythm
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Icon sizes (lucide, default 2px stroke everywhere)
export const ICON = {
  sm: 16, // inline meta glyphs
  md: 20, // controls, list icons
  lg: 24, // tab bar, header actions
};

// Minimum touch target
export const HIT = 44;

// Type scale: title 20 / section 16 / body 14 / caption 12
export const TEXT = {
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, color: COLORS.primaryDark },
  section: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, color: COLORS.primaryDark },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, color: COLORS.textPrimary },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, color: COLORS.textPrimary },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, color: COLORS.textSecondary },
  captionStrong: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, color: COLORS.textSecondary },
};

// Flat card: hairline border, no shadow
export const CARD = {
  backgroundColor: COLORS.card,
  borderRadius: RADII.md,
  borderWidth: 1,
  borderColor: COLORS.border,
};

// Line height multiplier for Indic scripts to prevent matras from clipping
export function getLineHeightMultiplier(lang?: string): number {
  if (!lang) return 1.0;
  if (['hi', 'mr', 'gu', 'ta'].includes(lang)) {
    return 1.18;
  }
  return 1.0;
}
