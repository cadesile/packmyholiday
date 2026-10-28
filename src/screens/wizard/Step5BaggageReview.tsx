import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, IconButton, Text } from 'react-native-paper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { useTripStore } from '../../state/useTripStore';
import { getAirlinePreset } from '../../data/airlineCatalog';
import { HIT_SLOP_MIN } from '../../theme/touchTargets';

export function Step5BaggageReview() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const computePlan = useTripStore((s) => s.computePlan);
  const prevStep = useTripStore((s) => s.prevStep);

  const airlinePreset = getAirlinePreset(draftConfig.airlineId);

  return (
    <WizardStepLayout
      title="Baggage Review"
      stepNumber={5}
      totalSteps={5}
      onBack={prevStep}
      onNext={computePlan}
      nextLabel="Generate Packing Plan"
      stickerIcon="bag-suitcase"
      stickerColor="sky"
    >
      {airlinePreset ? (
        <HelperText type="info" visible>
          {airlinePreset.name} allows ~{airlinePreset.defaultCheckedWeightKg}kg checked /{' '}
          {airlinePreset.defaultCabinWeightKg}kg cabin per bag. Confirm the bag counts below — these are still
          yours to edit.
        </HelperText>
      ) : null}

      <View style={styles.stepperRow}>
        <Text variant="titleMedium">Checked Bags (~23kg each)</Text>
        <View style={styles.stepperControls}>
          <IconButton
            icon="minus"
            mode="outlined"
            hitSlop={HIT_SLOP_MIN}
            onPress={() => updateDraftConfig({ checkedBags: Math.max(0, draftConfig.checkedBags - 1) })}
          />
          <Text variant="headlineSmall">{draftConfig.checkedBags}</Text>
          <IconButton
            icon="plus"
            mode="outlined"
            hitSlop={HIT_SLOP_MIN}
            onPress={() => updateDraftConfig({ checkedBags: draftConfig.checkedBags + 1 })}
          />
        </View>
      </View>

      <View style={styles.stepperRow}>
        <Text variant="titleMedium">Cabin Bags (~10kg each)</Text>
        <View style={styles.stepperControls}>
          <IconButton
            icon="minus"
            mode="outlined"
            hitSlop={HIT_SLOP_MIN}
            onPress={() => updateDraftConfig({ cabinBags: Math.max(0, draftConfig.cabinBags - 1) })}
          />
          <Text variant="headlineSmall">{draftConfig.cabinBags}</Text>
          <IconButton
            icon="plus"
            mode="outlined"
            hitSlop={HIT_SLOP_MIN}
            onPress={() => updateDraftConfig({ cabinBags: draftConfig.cabinBags + 1 })}
          />
        </View>
      </View>
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
