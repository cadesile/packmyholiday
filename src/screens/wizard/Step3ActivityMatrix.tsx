import React from 'react';
import { Text, useTheme } from 'react-native-paper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { ActivityChipGrid } from '../../components/ActivityChipGrid';
import { useTripStore } from '../../state/useTripStore';
import type { ActivityType } from '../../types/packing';

export function Step3ActivityMatrix() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const nextStep = useTripStore((s) => s.nextStep);
  const prevStep = useTripStore((s) => s.prevStep);
  const theme = useTheme();

  const toggleActivity = (activity: ActivityType) => {
    const activities = draftConfig.activities.includes(activity)
      ? draftConfig.activities.filter((a) => a !== activity)
      : [...draftConfig.activities, activity];
    updateDraftConfig({ activities });
  };

  return (
    <WizardStepLayout
      title="What will you get up to?"
      stepName="Trip style"
      stepNumber={3}
      totalSteps={5}
      onBack={prevStep}
      onNext={nextStep}
    >
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: -12 }}>
        Select everything that applies. This shapes your packing list.
      </Text>
      <ActivityChipGrid selected={draftConfig.activities} onToggle={toggleActivity} />
    </WizardStepLayout>
  );
}
