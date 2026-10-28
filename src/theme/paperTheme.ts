import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { pairedFontConfig } from './fonts';
import type { ClimateType, PackingItem } from '../types/packing';

// "Lagoon & Sun": a calm teal base (Lagoon) so lists and numbers stay readable,
// with one warm amber (Sun) reserved for the next action on each screen.
//
// Role mapping — Paper has no "cta" slot, so the Sun accent lives in
// `secondary` / `onSecondary` in both modes. AppButton's "primary" variant is
// the only consumer; everything else is teal.
export const lightTheme = {
  ...MD3LightTheme,
  roundness: 14,
  fonts: pairedFontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0B6B73', // Lagoon 600
    onPrimary: '#FFFFFF',
    primaryContainer: '#E6F3F3', // Lagoon 50 — selected fills
    onPrimaryContainer: '#0B5A62', // Lagoon 700
    secondary: '#FFB627', // Sun 400 — next-action button fill
    onSecondary: '#0E2A33', // Ink
    secondaryContainer: '#FFEBC0', // Sun 100 — info banners
    onSecondaryContainer: '#0E2A33',
    tertiary: '#2F5D8C',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#DCE8F4',
    onTertiaryContainer: '#16314E',
    background: '#F2F6F6', // Ground
    onBackground: '#0E2A33', // Ink
    surface: '#FFFFFF',
    onSurface: '#0E2A33',
    surfaceVariant: '#E6EEEE', // segmented-control track, progress track
    onSurfaceVariant: '#51666E', // Ink 2 — secondary text
    outline: '#7F9298', // unselected control borders (3:1 on white)
    outlineVariant: '#D9E3E4', // Line — card and divider borders
    error: '#C2412D', // Alert
    onError: '#FFFFFF',
    errorContainer: '#FBE3DE',
    onErrorContainer: '#5A150B',
    // Cards sit on borders, not tint: keep every Paper elevation level white.
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 14,
  fonts: pairedFontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5CCBD1',
    onPrimary: '#0A1A20',
    primaryContainer: '#16444A',
    onPrimaryContainer: '#CFE9EA',
    secondary: '#FFC857', // Sun, lifted for dark surfaces
    onSecondary: '#0A1A20',
    secondaryContainer: '#4A3A12',
    onSecondaryContainer: '#FFEBC0',
    tertiary: '#8FB5DE',
    onTertiary: '#0A1A20',
    tertiaryContainer: '#1F3F5F',
    onTertiaryContainer: '#DCE8F4',
    background: '#0A1A20',
    onBackground: '#E8F2F3',
    surface: '#12262E',
    onSurface: '#E8F2F3',
    surfaceVariant: '#1B333C',
    onSurfaceVariant: '#9DB4BA',
    outline: '#5E7A82',
    outlineVariant: '#24404A',
    error: '#F08A78',
    onError: '#3B0A0A',
    errorContainer: '#5A150B',
    onErrorContainer: '#FBE3DE',
    elevation: {
      level0: 'transparent',
      level1: '#12262E',
      level2: '#12262E',
      level3: '#12262E',
      level4: '#12262E',
      level5: '#12262E',
    },
  },
};

// Logo and illustration colours. These never change with the colour scheme
// except where a LogoMark `variant` says so.
export const BRAND = {
  lagoon: '#0B6B73',
  sun: '#FFB627',
  ink: '#0E2A33',
  white: '#FFFFFF',
  groundDark: '#0A1A20',
} as const;

// Per-category accent colors for icon badges on the packing plan (Output)
// screen — not part of the MD3 palette, since Paper's theme has no slot for
// a five-way category accent map. All pass 4.5:1 under a white glyph.
export const CATEGORY_COLORS: Record<PackingItem['category'], string> = {
  clothing: '#0B6B73',
  toiletries: '#A23B72',
  footwear: '#8A6A00',
  electronics: '#2F5D8C',
  essentials: '#6B4FA3',
};

// Trip summary card background per presumed climate — same rationale as
// CATEGORY_COLORS. All pass 4.5:1 under white text.
export const CLIMATE_CARD_COLORS: Record<ClimateType, string> = {
  warm: '#B4510A',
  mild: '#0B6B73',
  cold: '#2F5D8C',
  rainy: '#4A6174',
};

export const CLIMATE_CARD_ICONS: Record<ClimateType, string> = {
  warm: 'weather-sunny',
  mild: 'weather-partly-cloudy',
  cold: 'snowflake',
  rainy: 'weather-rainy',
};
