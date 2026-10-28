import { configureFonts } from 'react-native-paper';

// Lagoon & Sun type system: Bricolage Grotesque (headings, numbers, wordmark)
// + Inter (body, labels, controls).
//
// Custom-loaded fonts don't fake-bold: RN won't synthesize a heavier weight
// for a TTF that wasn't shipped as that weight, so every variant names the
// exact weight file and keeps `fontWeight: '400'` to stop Android applying a
// second synthetic bold on top.
export const INTER_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const BRICOLAGE_FAMILY = {
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
} as const;

type Type = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: '400';
};

const heading = (family: string, fontSize: number, lineHeight: number, trackingEm: number): Type => ({
  fontFamily: family,
  fontSize,
  lineHeight,
  letterSpacing: Math.round(fontSize * trackingEm * 100) / 100,
  fontWeight: '400',
});

const body = (family: string, fontSize: number, lineHeight: number, letterSpacing = 0): Type => ({
  fontFamily: family,
  fontSize,
  lineHeight,
  letterSpacing,
  fontWeight: '400',
});

// Maps the design-system type scale (see .context/stages/05_ui/output/design-system.md)
// onto Paper's MD3 variant names.
export const pairedFontConfig = configureFonts({
  config: {
    // Bricolage — headings
    displayLarge: heading(BRICOLAGE_FAMILY.bold, 40, 44, -0.02),
    displayMedium: heading(BRICOLAGE_FAMILY.bold, 36, 40, -0.02),
    displaySmall: heading(BRICOLAGE_FAMILY.bold, 32, 36, -0.02), // Display: wizard step titles
    headlineLarge: heading(BRICOLAGE_FAMILY.bold, 30, 34, -0.015),
    headlineMedium: heading(BRICOLAGE_FAMILY.bold, 26, 30, -0.01), // Title: plan / saved trips
    headlineSmall: heading(BRICOLAGE_FAMILY.bold, 24, 28, -0.01), // trip card destination
    titleLarge: heading(BRICOLAGE_FAMILY.semibold, 20, 26, 0), // Heading
    titleMedium: heading(BRICOLAGE_FAMILY.semibold, 18, 22, 0), // Subhead: card titles
    titleSmall: heading(BRICOLAGE_FAMILY.bold, 17, 22, 0), // list section headers
    // Inter — body and controls
    bodyLarge: body(INTER_FAMILY.regular, 16, 24),
    bodyMedium: body(INTER_FAMILY.regular, 16, 24), // Body
    bodySmall: body(INTER_FAMILY.regular, 14, 20), // Small
    labelLarge: body(INTER_FAMILY.semibold, 16, 20), // buttons
    labelMedium: body(INTER_FAMILY.semibold, 13, 16, 0.78), // Label (apply uppercase via SectionLabel)
    labelSmall: body(INTER_FAMILY.medium, 12, 16, 0.2), // Caption
  },
});
