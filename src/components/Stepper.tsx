import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { MIN_TOUCH } from '../theme/touchTargets';

interface StepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** Noun used in the screen-reader labels, e.g. "checked bags". */
  accessibilityNoun: string;
  /** Disable the minus button at or below this value (default 0). */
  min?: number;
}

// Big round − / + control with the count between them (bag counts).
// − is an outline, + is filled, so the direction reads without the glyph.
export function Stepper({ value, onDecrement, onIncrement, accessibilityNoun, min = 0 }: StepperProps) {
  const theme = useTheme();
  const atMin = value <= min;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Fewer ${accessibilityNoun}`}
        accessibilityState={{ disabled: atMin }}
        disabled={atMin}
        onPress={onDecrement}
        style={[
          styles.button,
          { borderWidth: 1.5, borderColor: atMin ? theme.colors.outlineVariant : theme.colors.primary, backgroundColor: theme.colors.surface },
        ]}
      >
        <Icon source="minus" size={20} color={atMin ? theme.colors.outline : theme.colors.primary} />
      </Pressable>
      <Text
        variant="headlineMedium"
        accessibilityLabel={`${value} ${accessibilityNoun}`}
        style={[styles.value, { color: theme.colors.onSurface }]}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`More ${accessibilityNoun}`}
        onPress={onIncrement}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <Icon source="plus" size={20} color={theme.colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 32,
  },
});
