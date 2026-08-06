import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { StepProgressDots } from './StepProgressDots';

interface WizardStepLayoutProps {
  title: string;
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export function WizardStepLayout({
  title,
  stepNumber,
  totalSteps,
  children,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Next',
}: WizardStepLayoutProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.progressWrap}>
        <StepProgressDots currentStep={stepNumber} totalSteps={totalSteps} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        {children}
      </ScrollView>
      <View style={[styles.bottomNav, { borderTopColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
        {onBack ? (
          <Button mode="outlined" onPress={onBack} style={styles.navButton}>
            Back
          </Button>
        ) : (
          <View style={styles.navButton} />
        )}
        <Button mode="contained" onPress={onNext} disabled={nextDisabled} style={styles.navButton}>
          {nextLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressWrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: {
    flex: 1,
  },
});
