import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { pairedFontConfig } from './fonts';
import type { ClimateType, PackingItem } from '../types/packing';

// "Superr" palette: cream-paper canvas + marker-orange accent (the guide's
// only chromatic UI color), charcoal ink for all text/borders/structure. See
// the pasted Superr style reference for the full rationale — this is a light
// re-theme of that guide's tokens, not an independent invention.
export const lightTheme = {
  ...MD3LightTheme,
  fonts: pairedFontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#ff6f1e', // Marker Orange
    onPrimary: '#fdfbf9', // Cream Paper
    primaryContainer: '#ffe4d1',
    onPrimaryContainer: '#2b1a07', // Cocoa Ink
    secondary: '#ce500a', // Burnt Sienna
    onSecondary: '#fdfbf9',
    secondaryContainer: '#f7efe9', // Dew Drop
    onSecondaryContainer: '#2b1a07',
    tertiary: '#22c55e', // Sprout Sticker — used sparingly for tag/divider accents only
    onTertiary: '#fdfbf9',
    tertiaryContainer: '#dcf6e6',
    onTertiaryContainer: '#0f3d22',
    background: '#fdfbf9', // Cream Paper
    onBackground: '#171717', // Charcoal
    surface: '#fdfbf9',
    onSurface: '#171717',
    surfaceVariant: '#f7efe9', // Dew Drop
    onSurfaceVariant: '#5c5754',
    outline: '#171717', // Charcoal — the guide's only border color, no fill states
    outlineVariant: '#bebcbb', // Shadow Mist
    error: '#DC2626',
    onError: '#FFFFFF',
  },
};

// The guide is light-only; this dark variant is an interpretation, not
// specified by the source — same roles, inverted for a dark canvas, keeping
// Marker Orange as the one constant accent.
export const darkTheme = {
  ...MD3DarkTheme,
  fonts: pairedFontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ff8c47', // brightened Marker Orange for dark-surface contrast
    onPrimary: '#2b1a07',
    primaryContainer: '#5c3212',
    onPrimaryContainer: '#ffe4d1',
    secondary: '#e2895a',
    onSecondary: '#2b1a07',
    secondaryContainer: '#3a2a20',
    onSecondaryContainer: '#f7efe9',
    tertiary: '#4ade80',
    onTertiary: '#0f3d22',
    tertiaryContainer: '#155d34',
    onTertiaryContainer: '#dcf6e6',
    background: '#171717', // Charcoal
    onBackground: '#fdfbf9',
    surface: '#221f1c',
    onSurface: '#fdfbf9',
    surfaceVariant: '#2b1a07',
    onSurfaceVariant: '#bebcbb',
    outline: '#bebcbb',
    outlineVariant: '#3a342f',
    error: '#F87171',
    onError: '#3B0A0A',
  },
};

// Decorative-only sticker palette — the guide is explicit these never
// promote to functional UI (buttons, links, category/status colors).
export const STICKER_COLORS = {
  sky: '#3b82f6',
  bubblegum: '#ff66cf',
  sprout: '#22c55e',
} as const;

// Per-category accent colors for icon badges on the packing plan (Output)
// screen — not part of the MD3 palette, since Paper's theme has no slot for
// a five-way category accent map.
export const CATEGORY_COLORS: Record<PackingItem['category'], string> = {
  clothing: '#ce500a',
  toiletries: '#0e7490',
  footwear: '#a16207',
  electronics: '#374b43',
  essentials: '#7c3aed',
};

// Trip summary card background per presumed climate — same rationale as
// CATEGORY_COLORS: not part of the MD3 palette, Paper has no slot for this.
export const CLIMATE_CARD_COLORS: Record<ClimateType, string> = {
  warm: '#ff6f1e',
  mild: '#5c5754',
  cold: '#0e7490',
  rainy: '#374b43',
};

export const CLIMATE_CARD_ICONS: Record<ClimateType, string> = {
  warm: 'weather-sunny',
  mild: 'weather-partly-cloudy',
  cold: 'snowflake',
  rainy: 'weather-rainy',
};
