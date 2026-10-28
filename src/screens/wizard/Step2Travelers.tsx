import React from 'react';
import { StyleSheet } from 'react-native';
import { HelperText } from 'react-native-paper';
import { AppButton } from '../../components/AppButton';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { TravelerCard } from '../../components/TravelerCard';
import { useTripStore } from '../../state/useTripStore';

export function Step2Travelers() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const addTraveler = useTripStore((s) => s.addTraveler);
  const removeTraveler = useTripStore((s) => s.removeTraveler);
  const updateTraveler = useTripStore((s) => s.updateTraveler);
  const nextStep = useTripStore((s) => s.nextStep);
  const prevStep = useTripStore((s) => s.prevStep);

  const hasTravelers = draftConfig.travelers.length > 0;

  return (
    <WizardStepLayout
      title="Who’s coming?"
      stepName="Travelers"
      stepNumber={2}
      totalSteps={5}
      onBack={prevStep}
      onNext={nextStep}
      nextDisabled={!hasTravelers}
    >
      {draftConfig.travelers.map((traveler, index) => (
        <TravelerCard
          key={traveler.id}
          traveler={traveler}
          index={index}
          onChange={(partial) => updateTraveler(traveler.id, partial)}
          onRemove={() => removeTraveler(traveler.id)}
        />
      ))}

      <AppButton variant="secondary" iconLeft="account-plus-outline" onPress={addTraveler} style={styles.addButton}>
        Add traveler
      </AppButton>

      {!hasTravelers ? <HelperText type="error">Add at least one traveler to continue.</HelperText> : null}
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  addButton: {
    height: 56,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});
