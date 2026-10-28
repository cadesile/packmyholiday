import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';
import { MIN_TOUCH } from '../theme/touchTargets';

interface SegmentedControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  /** Segment height; 44 default, 48 for the standalone toiletry control. */
  height?: number;
}

// Replaces Paper's SegmentedButtons: a tinted track with a filled Lagoon pill
// under the selected option.
export function SegmentedControl<T extends string>({ value, options, onChange, height = MIN_TOUCH }: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              { height, backgroundColor: selected ? theme.colors.primary : 'transparent' },
            ]}
          >
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{
                color: selected ? theme.colors.onPrimary : theme.colors.onSurface,
                fontFamily: selected ? INTER_FAMILY.semibold : INTER_FAMILY.medium,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: RADII.track,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: RADII.segment,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
