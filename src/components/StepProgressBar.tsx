import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SCREEN_GUTTER } from '../theme/spacing';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  /** Name of the current step, shown on the right ("Logistics & airline"). */
  stepName: string;
}

// Replaces StepProgressDots: "Step 2 of 5 … Travelers" over one bar segment per step.
export function StepProgressBar({ currentStep, totalSteps, stepName }: StepProgressBarProps) {
  const theme = useTheme();
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}, ${stepName}`}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
    >
      <View style={styles.labels}>
        <Text variant="labelMedium" style={[styles.caps, { color: theme.colors.onSurfaceVariant }]}>
          Step {currentStep} of {totalSteps}
        </Text>
        <Text variant="labelMedium" style={[styles.caps, { color: theme.colors.onSurfaceVariant }]}>
          {stepName}
        </Text>
      </View>
      <View style={styles.segments}>
        {steps.map((step) => (
          <View
            key={step}
            style={[
              styles.segment,
              { backgroundColor: step <= currentStep ? theme.colors.primary : theme.colors.outlineVariant },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caps: {
    textTransform: 'uppercase',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
});
