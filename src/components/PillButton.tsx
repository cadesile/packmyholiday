import React from 'react';
import { Button, useTheme, type ButtonProps } from 'react-native-paper';
import { RADII } from '../theme/radii';

// The Superr guide's "Pill Action Button": cream fill, charcoal border, pill
// radius — no filled/solid CTA color, ever. The dark border carries the
// button's identity, not a background fill.
export function PillButton({ style, ...props }: ButtonProps) {
  const theme = useTheme();
  return (
    <Button
      mode="outlined"
      buttonColor={theme.colors.surface}
      textColor={theme.colors.onSurface}
      style={[{ borderRadius: RADII.buttons, borderColor: theme.colors.outline, borderWidth: 1.5 }, style]}
      {...props}
    />
  );
}
