import { configureFonts } from 'react-native-paper';

// Custom-loaded fonts don't fake-bold: RN won't synthesize a heavier weight
// for a TTF that wasn't shipped as that weight, so each MD3 variant must map
// to the actual weight file matching its default fontWeight token.
const WEIGHT_TO_INTER_FAMILY: Record<string, string> = {
  '100': 'Inter_400Regular',
  '200': 'Inter_400Regular',
  '300': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_700Bold',
  '900': 'Inter_700Bold',
};

const WEIGHT_TO_JAKARTA_FAMILY: Record<string, string> = {
  '100': 'PlusJakartaSans_400Regular',
  '200': 'PlusJakartaSans_400Regular',
  '300': 'PlusJakartaSans_400Regular',
  '400': 'PlusJakartaSans_400Regular',
  '500': 'PlusJakartaSans_500Medium',
  '600': 'PlusJakartaSans_600SemiBold',
  '700': 'PlusJakartaSans_700Bold',
  '800': 'PlusJakartaSans_700Bold',
  '900': 'PlusJakartaSans_700Bold',
};

// Plus Jakarta Sans (Headings) + Inter (Body & Numbers): display/headline/title
// variants read as headings and get Jakarta; body/label variants stay Inter.
const HEADING_VARIANTS = new Set([
  'displayLarge',
  'displayMedium',
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
  'titleLarge',
  'titleMedium',
  'titleSmall',
]);

const baseTypescale = configureFonts();

function withPairedFamilies(typescale: typeof baseTypescale): typeof baseTypescale {
  const entries = Object.entries(typescale).map(([key, value]) => {
    const familyMap = HEADING_VARIANTS.has(key) ? WEIGHT_TO_JAKARTA_FAMILY : WEIGHT_TO_INTER_FAMILY;
    const fallback = HEADING_VARIANTS.has(key) ? 'PlusJakartaSans_400Regular' : 'Inter_400Regular';
    return [key, { ...value, fontFamily: familyMap[String(value.fontWeight)] ?? fallback }];
  });
  return Object.fromEntries(entries) as typeof baseTypescale;
}

export const pairedFontConfig = withPairedFamilies(baseTypescale);

export const INTER_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const JAKARTA_FAMILY = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;
