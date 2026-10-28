import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

interface WeightBudgetBarProps {
  totalEstimatedWeightKg: number;
  maxAllowedWeightKg: number;
  isOverWeight: boolean;
}

export function WeightBudgetBar({ totalEstimatedWeightKg, maxAllowedWeightKg, isOverWeight }: WeightBudgetBarProps) {
  const theme = useTheme();
  const progress = maxAllowedWeightKg > 0 ? Math.min(1, totalEstimatedWeightKg / maxAllowedWeightKg) : 0;
  const fill = isOverWeight ? theme.colors.error : theme.colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.figures}>
        <Text variant="titleLarge" style={{ color: isOverWeight ? theme.colors.error : theme.colors.onSurface }}>
          {totalEstimatedWeightKg.toFixed(1)}kg
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          of {maxAllowedWeightKg.toFixed(1)}kg budget
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Weight budget used"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      >
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: fill }]} />
      </View>
      {isOverWeight ? (
        <View style={styles.warning}>
          <Icon source="alert-circle-outline" size={18} color={theme.colors.error} />
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            Over weight budget. See suggestions.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  figures: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
