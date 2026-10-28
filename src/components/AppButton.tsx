import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { RADII } from '../theme/radii';
import { CONTROL_HEIGHT } from '../theme/spacing';
import { MIN_TOUCH } from '../theme/touchTargets';

export type AppButtonVariant = 'primary' | 'secondary' | 'text';

interface AppButtonProps {
  children: string;
  onPress: () => void;
  /** primary = Sun fill (the one forward action per screen), secondary = Lagoon outline, text = no chrome. */
  variant?: AppButtonVariant;
  /** MaterialCommunityIcons name shown after the label (e.g. "arrow-right"). */
  iconRight?: string;
  /** MaterialCommunityIcons name shown before the label. */
  iconLeft?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// Replaces the Superr "PillButton". One amber button per screen: the forward
// action. Everything else is teal.
export function AppButton({
  children,
  onPress,
  variant = 'primary',
  iconRight,
  iconLeft,
  disabled,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const theme = useTheme();

  let backgroundColor = 'transparent';
  let borderColor = 'transparent';
  let color = theme.colors.primary;
  if (variant === 'primary') {
    backgroundColor = disabled ? theme.colors.surfaceVariant : theme.colors.secondary;
    color = disabled ? theme.colors.onSurfaceVariant : theme.colors.onSecondary;
  } else if (variant === 'secondary') {
    backgroundColor = theme.colors.surface;
    borderColor = disabled ? theme.colors.outlineVariant : theme.colors.primary;
    color = disabled ? theme.colors.onSurfaceVariant : theme.colors.primary;
  } else if (disabled) {
    color = theme.colors.onSurfaceVariant;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'text' ? styles.text : null,
        { backgroundColor, borderColor, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={styles.content}>
        {iconLeft ? <Icon source={iconLeft} size={20} color={color} /> : null}
        <Text variant="labelLarge" style={{ color }}>
          {children}
        </Text>
        {iconRight ? <Icon source={iconRight} size={20} color={color} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: CONTROL_HEIGHT,
    borderRadius: RADII.buttons,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    height: MIN_TOUCH,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
