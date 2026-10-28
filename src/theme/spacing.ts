// 4px-base spacing scale.
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20, // screen gutter
  xl: 24,
  xxl: 28,
  xxxl: 32,
  huge: 40,
  giant: 48,
  massive: 64,
} as const;

/** Horizontal padding for every screen and the bottom action bar. */
export const SCREEN_GUTTER = SPACING.lg;

/** Height of buttons, text fields and choice tiles (row layout is 56). */
export const CONTROL_HEIGHT = 52;
