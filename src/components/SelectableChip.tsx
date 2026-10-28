import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, Chip, useTheme } from 'react-native-paper';
import { GEIST_FAMILY } from '../theme/fonts';

interface SelectableChipProps {
  label: string;
  icon?: string;
  /** Renders `icon` as a colored circular badge (e.g. per-category accent) instead of a plain tinted icon. */
  badgeColor?: string;
  selected: boolean;
  onPress: () => void;
}

// Paper's Chip only swaps to a checkmark when no custom `icon` is passed, and
// showSelectedOverlay defaults to false — so a selected chip with a custom
// icon is otherwise visually identical to an unselected one. This makes the
// selected state explicit via background/border/text instead.
export function SelectableChip({ label, icon, badgeColor, selected, onPress }: SelectableChipProps) {
  const theme = useTheme();
  const avatar =
    badgeColor && icon ? (
      <Avatar.Icon size={22} icon={icon} color="#FFFFFF" style={{ backgroundColor: badgeColor }} />
    ) : undefined;

  return (
    <Chip
      icon={avatar ? undefined : icon}
      avatar={avatar}
      selected={selected}
      selectedColor={theme.colors.primary}
      showSelectedOverlay
      mode={selected ? 'flat' : 'outlined'}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.primary, borderWidth: 1.5 }
          : { borderColor: theme.colors.outline },
      ]}
      textStyle={selected ? styles.selectedText : undefined}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginBottom: 4,
  },
  selectedText: {
    fontFamily: GEIST_FAMILY.bold,
  },
});
