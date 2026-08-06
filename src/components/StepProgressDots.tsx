import React, { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

interface StepProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

const DOT_SIZE = 26;

export function StepProgressDots({ currentStep, totalSteps }: StepProgressDotsProps) {
  const theme = useTheme();
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={styles.row}>
      {steps.map((step) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        const isFilled = isCompleted || isActive;

        return (
          <Fragment key={step}>
            {step > 1 ? (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: step <= currentStep ? theme.colors.primary : theme.colors.outlineVariant },
                ]}
              />
            ) : null}
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isFilled ? theme.colors.primary : theme.colors.surface,
                  borderColor: isFilled ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            >
              {isCompleted ? (
                <Icon source="check" size={14} color={theme.colors.onPrimary} />
              ) : (
                <Text
                  variant="labelMedium"
                  style={{ color: isActive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
                >
                  {step}
                </Text>
              )}
            </View>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
});
