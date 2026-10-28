import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';

interface ChoiceTileProps {
  label: string;
  /** MaterialCommunityIcons name. */
  icon: string;
  /** Icon colour when unselected or selected; defaults to the theme's primary. */
  iconColor?: string;
  selected: boolean;
  onPress: () => void;
  /**
   * row     — 56 high, icon left, tick right (climate options)
   * stacked — 96+ high, icon over label, tick badge top-right (activities)
   */
  layout?: 'row' | 'stacked';
}

const BORDER_IDLE = 1.5;
const BORDER_SELECTED = 2;

// Replaces the icon chips on Step 1 (climate) and Step 3 (activities).
// Selected = tint fill + Lagoon border + tick, so state never relies on colour alone.
export function ChoiceTile({ label, icon, iconColor, selected, onPress, layout = 'row' }: ChoiceTileProps) {
  const theme = useTheme();
  const borderWidth = selected ? BORDER_SELECTED : BORDER_IDLE;
  const tint = iconColor ?? theme.colors.primary;
  const stacked = layout === 'stacked';

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        stacked ? styles.stacked : styles.row,
        {
          borderWidth,
          borderRadius: stacked ? RADII.cards : RADII.buttons,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
          // Keep the tile's outer size constant when the border thickens.
          padding: 14 - (borderWidth - BORDER_IDLE),
        },
      ]}
    >
      <Icon source={icon} size={stacked ? 28 : 22} color={tint} />
      <Text
        variant="bodyMedium"
        style={[
          stacked ? null : styles.rowLabel,
          {
            color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
            fontFamily: selected ? INTER_FAMILY.semibold : INTER_FAMILY.medium,
          },
        ]}
      >
        {label}
      </Text>
      {selected ? (
        stacked ? (
          <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
            <Icon source="check" size={14} color={theme.colors.onPrimary} />
          </View>
        ) : (
          <Icon source="check" size={18} color={theme.colors.primary} />
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    flex: 1,
  },
  stacked: {
    minHeight: 96,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
