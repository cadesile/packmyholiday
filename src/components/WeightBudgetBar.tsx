import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { JAKARTA_FAMILY } from '../theme/fonts';

interface WeightBudgetBarProps {
  totalEstimatedWeightKg: number;
  maxAllowedWeightKg: number;
  isOverWeight: boolean;
}

export function WeightBudgetBar({ totalEstimatedWeightKg, maxAllowedWeightKg, isOverWeight }: WeightBudgetBarProps) {
  const theme = useTheme();
  const progress = maxAllowedWeightKg > 0 ? Math.min(1, totalEstimatedWeightKg / maxAllowedWeightKg) : 0;

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.weightText}>
        {totalEstimatedWeightKg.toFixed(1)}kg
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {' '}/ {maxAllowedWeightKg.toFixed(1)}kg budget
        </Text>
      </Text>
      <ProgressBar
        progress={progress}
        color={isOverWeight ? theme.colors.error : theme.colors.primary}
        style={styles.bar}
      />
      {isOverWeight ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
          Over weight budget — see suggestions below.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingVertical: 8,
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  weightText: {
    fontFamily: JAKARTA_FAMILY.bold,
  },
});
