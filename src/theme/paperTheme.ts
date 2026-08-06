import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { pairedFontConfig } from './fonts';
import type { ClimateType, PackingItem } from '../types/packing';

// "Classy Palette": green primary (#30BA90) + charcoal-green secondary
// (#374B43) for header surfaces, deep/bright blue (#007BBF / #17AFF8) as the
// tertiary accent, and muted sage (#9AB0A7) driving outlines/surfaceVariant.
export const lightTheme = {
  ...MD3LightTheme,
  fonts: pairedFontConfig,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#30BA90',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D7F3E9',
    onPrimaryContainer: '#0B3A2C',
    secondary: '#374B43',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E1E7E3',
    onSecondaryContainer: '#1F2B26',
    tertiary: '#007BBF',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#D6EFFC',
    onTertiaryContainer: '#00415F',
    background: '#F7F9FA',
    onBackground: '#22302B',
    surface: '#FFFFFF',
    onSurface: '#22302B',
    surfaceVariant: '#E6ECE9',
    onSurfaceVariant: '#5B6B65',
    outline: '#9AB0A7',
    outlineVariant: '#D7DEDA',
    error: '#DC2626',
    onError: '#FFFFFF',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: pairedFontConfig,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5BD9AE',
    onPrimary: '#04291D',
    primaryContainer: '#155D48',
    onPrimaryContainer: '#B9F0DD',
    secondary: '#A9C4B7',
    onSecondary: '#17241E',
    secondaryContainer: '#26362F',
    onSecondaryContainer: '#CBE0D3',
    tertiary: '#17AFF8',
    onTertiary: '#00344C',
    tertiaryContainer: '#004A6B',
    onTertiaryContainer: '#C7EAFC',
    background: '#16211C',
    onBackground: '#E9F0EC',
    surface: '#1C2A24',
    onSurface: '#E9F0EC',
    surfaceVariant: '#243830',
    onSurfaceVariant: '#9AB0A7',
    outline: '#3F5A4E',
    outlineVariant: '#2C4038',
    error: '#F87171',
    onError: '#3B0A0A',
  },
};

// Per-category accent colors for icon badges on the packing plan (Output)
// screen — not part of the MD3 palette, since Paper's theme has no slot for
// a five-way category accent map.
export const CATEGORY_COLORS: Record<PackingItem['category'], string> = {
  clothing: '#0E6B64',
  toiletries: '#F2994A',
  footwear: '#A16207',
  electronics: '#3B82F6',
  essentials: '#8B5CF6',
};

// Trip summary card background per presumed climate — same rationale as
// CATEGORY_COLORS: not part of the MD3 palette, Paper has no slot for this.
export const CLIMATE_CARD_COLORS: Record<ClimateType, string> = {
  warm: '#D9822B',
  mild: '#374B43',
  cold: '#3E6C9C',
  rainy: '#546A7B',
};

export const CLIMATE_CARD_ICONS: Record<ClimateType, string> = {
  warm: 'weather-sunny',
  mild: 'weather-partly-cloudy',
  cold: 'snowflake',
  rainy: 'weather-rainy',
};
