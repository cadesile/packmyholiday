import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { INTER_FAMILY } from '../theme/fonts';
import { HIT_SLOP_MIN, MIN_TOUCH } from '../theme/touchTargets';
import type { PackingItem } from '../types/packing';

interface PackingItemRowProps {
  item: PackingItem;
  onToggle: (itemId: string) => void;
  onToggleExcluded: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

export function PackingItemRow({ item, onToggle, onToggleExcluded, onRemove, onQuantityChange }: PackingItemRowProps) {
  const theme = useTheme();
  const totalWeightKg = (item.estimatedWeightGrams * item.quantity) / 1000;

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }, item.excluded && styles.excludedRow]}>
      {/* 24px box inside a 44px touch target */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={item.name}
        accessibilityState={{ checked: item.packed }}
        onPress={() => onToggle(item.id)}
        style={styles.checkTarget}
      >
        <View
          style={[
            styles.checkbox,
            item.packed
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { borderColor: theme.colors.outline },
          ]}
        >
          {item.packed ? <Icon source="check" size={16} color={theme.colors.onPrimary} /> : null}
        </View>
      </Pressable>

      <View style={styles.textGroup}>
        <Text
          variant="bodyLarge"
          style={[
            styles.name,
            { color: item.packed ? theme.colors.onSurfaceVariant : theme.colors.onSurface },
            item.packed && { textDecorationLine: 'line-through' },
          ]}
        >
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.excluded ? 'Excluded from budget' : `${totalWeightKg.toFixed(2)}kg`}
          </Text>
          <View style={styles.stepper}>
            <IconButton
              icon="minus"
              size={14}
              disabled={item.quantity <= 1}
              hitSlop={HIT_SLOP_MIN}
              accessibilityLabel="Decrease quantity"
              style={styles.stepperButton}
              onPress={() => onQuantityChange(item.id, item.quantity - 1)}
            />
            <Text variant="bodySmall" style={styles.stepperValue}>
              ×{item.quantity}
            </Text>
            <IconButton
              icon="plus"
              size={14}
              hitSlop={HIT_SLOP_MIN}
              accessibilityLabel="Increase quantity"
              style={styles.stepperButton}
              onPress={() => onQuantityChange(item.id, item.quantity + 1)}
            />
          </View>
        </View>
      </View>

      <IconButton
        icon={item.excluded ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        iconColor={theme.colors.onSurfaceVariant}
        hitSlop={HIT_SLOP_MIN}
        accessibilityLabel={item.excluded ? 'Include item in weight budget' : 'Exclude item from weight budget'}
        onPress={() => onToggleExcluded(item.id)}
      />
      <IconButton
        icon="trash-can-outline"
        size={20}
        iconColor={theme.colors.onSurfaceVariant}
        hitSlop={HIT_SLOP_MIN}
        accessibilityLabel="Remove item"
        onPress={() => onRemove(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  excludedRow: {
    opacity: 0.55,
  },
  checkTarget: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: INTER_FAMILY.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    margin: 0,
  },
  stepperValue: {
    minWidth: 22,
    textAlign: 'center',
  },
});
