import { configureFonts } from 'react-native-paper';

// Custom-loaded fonts don't fake-bold: RN won't synthesize a heavier weight
// for a TTF that wasn't shipped as that weight, so each MD3 variant must map
// to the actual weight file matching its default fontWeight token.
const WEIGHT_TO_GEIST_FAMILY: Record<string, string> = {
  '100': 'Geist_400Regular',
  '200': 'Geist_400Regular',
  '300': 'Geist_400Regular',
  '400': 'Geist_400Regular',
  '500': 'Geist_500Medium',
  '600': 'Geist_600SemiBold',
  '700': 'Geist_700Bold',
  '800': 'Geist_700Bold',
  '900': 'Geist_700Bold',
};

// Fraunces only ships 400/500/600 here — there is no bolder weight file, so
// 700+ falls back to 600SemiBold rather than faking a bold that doesn't exist.
const WEIGHT_TO_FRAUNCES_FAMILY: Record<string, string> = {
  '100': 'Fraunces_400Regular',
  '200': 'Fraunces_400Regular',
  '300': 'Fraunces_400Regular',
  '400': 'Fraunces_400Regular',
  '500': 'Fraunces_500Medium',
  '600': 'Fraunces_600SemiBold',
  '700': 'Fraunces_600SemiBold',
  '800': 'Fraunces_600SemiBold',
  '900': 'Fraunces_600SemiBold',
};

// Fraunces (Headings, standing in for the Superr style guide's "gelica") +
// Geist (Body & Labels): display/headline/title variants read as headings and
// get Fraunces; body/label variants stay Geist.
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
    const familyMap = HEADING_VARIANTS.has(key) ? WEIGHT_TO_FRAUNCES_FAMILY : WEIGHT_TO_GEIST_FAMILY;
    const fallback = HEADING_VARIANTS.has(key) ? 'Fraunces_400Regular' : 'Geist_400Regular';
    return [key, { ...value, fontFamily: familyMap[String(value.fontWeight)] ?? fallback }];
  });
  return Object.fromEntries(entries) as typeof baseTypescale;
}

export const pairedFontConfig = withPairedFamilies(baseTypescale);

export const GEIST_FAMILY = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const FRAUNCES_FAMILY = {
  regular: 'Fraunces_400Regular',
  medium: 'Fraunces_500Medium',
  semibold: 'Fraunces_600SemiBold',
  bold: 'Fraunces_600SemiBold',
} as const;
