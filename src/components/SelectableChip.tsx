import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';
import { MIN_TOUCH } from '../theme/touchTargets';

interface SelectableChipProps {
  label: string;
  icon?: string;
  /** Renders `icon` as a coloured circular badge (e.g. per-category accent) instead of a plain tinted icon. */
  badgeColor?: string;
  selected: boolean;
  onPress: () => void;
}

// Pill used for the packing-plan category tabs. Selected = tint fill + Lagoon
// border + semibold label; the badge keeps its category colour either way.
export function SelectableChip({ label, icon, badgeColor, selected, onPress }: SelectableChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderWidth: selected ? 2 : 1.5,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
          paddingLeft: icon ? 8 : 16,
        },
      ]}
    >
      {icon ? (
        badgeColor ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Icon source={icon} size={16} color="#FFFFFF" />
          </View>
        ) : (
          <Icon source={icon} size={20} color={theme.colors.primary} />
        )
      ) : null}
      <Text
        variant="bodySmall"
        style={{
          fontSize: 15,
          color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
          fontFamily: selected ? INTER_FAMILY.semibold : INTER_FAMILY.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: MIN_TOUCH,
    paddingRight: 14,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
