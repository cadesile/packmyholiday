import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path, Rect } from 'react-native-svg';
import { BRICOLAGE_FAMILY } from '../theme/fonts';
import { BRAND } from '../theme/paperTheme';

// "Sunrise case": a suitcase with the sun coming up on its front. Drawn on a
// 64x64 grid; source of truth is assets/brand/logo-mark.svg (keep in sync).
//
//   color    — lagoon case on a light surface (default)
//   reversed — white case for lagoon / dark surfaces; the horizon line is
//              cut in `background` so it reads as a gap
export type LogoVariant = 'color' | 'reversed';

interface LogoMarkProps {
  size?: number;
  variant?: LogoVariant;
  /** Reversed only: the colour behind the mark (used for the horizon line). */
  background?: string;
}

export function LogoMark({ size = 32, variant = 'color', background = BRAND.lagoon }: LogoMarkProps) {
  const reversed = variant === 'reversed';
  const handle = reversed ? BRAND.white : BRAND.ink;
  const body = reversed ? BRAND.white : BRAND.lagoon;
  const horizon = reversed ? background : BRAND.white;
  // Below these sizes the fine detail turns to mush, so it drops out.
  const showHorizon = size >= 20;
  const showRays = size >= 28;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image" accessibilityLabel="packmyholiday">
      <Path
        d="M23 22v-6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6"
        fill="none"
        stroke={handle}
        strokeWidth={size < 20 ? 5 : 4}
        strokeLinecap="round"
      />
      <Rect x={6} y={22} width={52} height={36} rx={10} fill={body} />
      <Path d="M20 46a12 12 0 0 1 24 0z" fill={BRAND.sun} />
      {showRays ? (
        <Path
          d="M32 31v-3.5M21.4 35.4l-2.5-2.5M42.6 35.4l2.5-2.5"
          stroke={BRAND.sun}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      ) : null}
      {showHorizon ? <Rect x={14} y={48.5} width={36} height={3.5} rx={1.75} fill={horizon} /> : null}
    </Svg>
  );
}

interface WordmarkProps {
  size?: number;
  /** Light text for lagoon / dark backgrounds. */
  onDark?: boolean;
}

export function Wordmark({ size = 21, onDark = false }: WordmarkProps) {
  return (
    <Text
      accessibilityLabel="packmyholiday"
      style={{
        fontFamily: BRICOLAGE_FAMILY.bold,
        fontSize: size,
        lineHeight: size * 1.15,
        letterSpacing: -size * 0.025,
        includeFontPadding: false,
      }}
    >
      <Text style={{ color: onDark ? BRAND.white : BRAND.ink }}>pack</Text>
      <Text style={{ color: onDark ? '#FFD27A' : BRAND.lagoon }}>myholiday</Text>
    </Text>
  );
}

interface LogoProps {
  /** Mark size in px; the wordmark scales with it. */
  size?: number;
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Horizontal lockup: mark + wordmark. */
export function Logo({ size = 32, onDark = false, style }: LogoProps) {
  return (
    <View style={[styles.row, { gap: size * 0.25 }, style]}>
      <LogoMark size={size} variant={onDark ? 'reversed' : 'color'} />
      <Wordmark size={Math.round(size * 0.66)} onDark={onDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
