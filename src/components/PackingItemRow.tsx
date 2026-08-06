import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, IconButton, Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { HIT_SLOP_MIN } from '../theme/touchTargets';
import type { PackingItem } from '../types/packing';

interface PackingItemRowProps {
  item: PackingItem;
  onToggle: (itemId: string) => void;
  onToggleExcluded: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

export function PackingItemRow({ item, onToggle, onToggleExcluded, onRemove }: PackingItemRowProps) {
  const theme = useTheme();
  const totalWeightKg = (item.estimatedWeightGrams * item.quantity) / 1000;

  return (
    <View style={[styles.row, item.excluded && styles.excludedRow]}>
      <Checkbox.Android
        status={item.packed ? 'checked' : 'unchecked'}
        color={theme.colors.primary}
        uncheckedColor={theme.colors.outline}
        onPress={() => onToggle(item.id)}
      />
      <View style={styles.textGroup}>
        <Text
          variant="bodyLarge"
          style={[
            styles.name,
            item.packed && { color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' },
          ]}
        >
          {item.name}
          {item.quantity > 1 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {' '}
              x{item.quantity}
            </Text>
          ) : null}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {totalWeightKg.toFixed(2)}kg
        </Text>
      </View>
      <IconButton
        icon={item.excluded ? 'eye-outline' : 'eye-off-outline'}
        size={20}
        hitSlop={HIT_SLOP_MIN}
        accessibilityLabel={item.excluded ? 'Include item in weight budget' : 'Exclude item from weight budget'}
        onPress={() => onToggleExcluded(item.id)}
      />
      <IconButton
        icon="trash-can-outline"
        size={20}
        hitSlop={HIT_SLOP_MIN}
        accessibilityLabel="Remove item"
        onPress={() => onRemove(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  excludedRow: {
    opacity: 0.5,
  },
  textGroup: {
    flex: 1,
  },
  name: {
    fontFamily: INTER_FAMILY.medium,
  },
});
