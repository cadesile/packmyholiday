import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from './AppButton';
import { StepProgressBar } from './StepProgressBar';
import { SCREEN_GUTTER } from '../theme/spacing';

interface WizardStepLayoutProps {
  /** Large heading, written as a question or statement ("Where are you off to?"). */
  title: string;
  /** Short step name for the progress label ("Logistics & airline"). */
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  /** "Next" shows a trailing arrow; any other label (the final step) gets the wider button and a narrow Back. */
  nextLabel?: string;
}

const DEFAULT_NEXT_LABEL = 'Next';

export function WizardStepLayout({
  title,
  stepName,
  stepNumber,
  totalSteps,
  children,
  onBack,
  onNext,
  nextDisabled,
  nextLabel = DEFAULT_NEXT_LABEL,
}: WizardStepLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isFinalLabel = nextLabel !== DEFAULT_NEXT_LABEL;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StepProgressBar currentStep={stepNumber} totalSteps={totalSteps} stepName={stepName} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text variant="displaySmall" accessibilityRole="header" style={{ color: theme.colors.onBackground }}>
          {title}
        </Text>
        {children}
      </ScrollView>
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {onBack ? (
          <AppButton variant="secondary" onPress={onBack} style={isFinalLabel ? styles.backNarrow : styles.flex}>
            Back
          </AppButton>
        ) : null}
        <AppButton
          variant="primary"
          onPress={onNext}
          disabled={nextDisabled}
          iconRight={isFinalLabel ? undefined : 'arrow-right'}
          style={styles.flex}
        >
          {nextLabel}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: SCREEN_GUTTER,
    borderTopWidth: 1,
    // Only the action bar casts a shadow; cards use borders.
    ...Platform.select({
      ios: {
        shadowColor: '#0E2A33',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -6 },
      },
      default: { elevation: 8 },
    }),
  },
  flex: {
    flex: 1,
  },
  backNarrow: {
    width: 96,
    paddingHorizontal: 0,
  },
});
