import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';

interface RadioCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

// One option in a single-choice list (airline picker): a bordered card with a
// radio dot on the left. Selected = Lagoon border + tint fill.
export function RadioCard({ title, description, selected, onPress }: RadioCardProps) {
  const theme = useTheme();
  const borderWidth = selected ? 2 : 1.5;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderWidth,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
          paddingHorizontal: 16 - (borderWidth - 1.5),
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          { borderColor: selected ? theme.colors.primary : theme.colors.outline },
        ]}
      >
        {selected ? <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} /> : null}
      </View>
      <View style={styles.text}>
        <Text variant="bodyLarge" style={{ fontFamily: INTER_FAMILY.semibold, color: theme.colors.onSurface }}>
          {title}
        </Text>
        {description ? (
          <Text
            variant="bodySmall"
            style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    borderRadius: RADII.buttons,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
