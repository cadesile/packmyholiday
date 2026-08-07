import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { useTripStore } from '../../state/useTripStore';
import type { ToiletryStrategy } from '../../types/packing';

const TOILETRY_OPTIONS: { value: ToiletryStrategy; label: string }[] = [
  { value: 'pack', label: 'Pack Liquids' },
  { value: 'buy_on_arrival', label: 'Buy on Arrival' },
];

export function Step4HealthHygiene() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const nextStep = useTripStore((s) => s.nextStep);
  const prevStep = useTripStore((s) => s.prevStep);

  const requiresBugSpray =
    draftConfig.climate === 'warm' || draftConfig.climate === 'rainy' || draftConfig.activities.includes('hiking');

  return (
    <WizardStepLayout title="Health, Hygiene & Logistics" stepNumber={4} totalSteps={5} onBack={prevStep} onNext={nextStep}>
      <Text variant="titleMedium">Toiletry Strategy</Text>
      <SegmentedButtons
        value={draftConfig.toiletryStrategy}
        onValueChange={(value) => updateDraftConfig({ toiletryStrategy: value as ToiletryStrategy })}
        buttons={TOILETRY_OPTIONS}
      />

      <View style={styles.switchRow}>
        <Text variant="titleMedium">Laundry Available Midway</Text>
        <Switch
          value={draftConfig.laundryAvailable}
          onValueChange={(value) => updateDraftConfig({ laundryAvailable: value })}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchLabelGroup}>
          <Text variant="titleMedium">Reuse Some Clothing</Text>
          <Text variant="bodySmall">Pack fewer clothes, assuming some items get worn more than once</Text>
        </View>
        <Switch
          value={draftConfig.reuseClothing}
          onValueChange={(value) => updateDraftConfig({ reuseClothing: value })}
        />
      </View>

      <Text variant="titleMedium">Health Advisory</Text>
      <List.Item
        title="Insect repellent"
        description={requiresBugSpray ? 'Recommended for this climate/activity mix' : 'Not flagged for this trip'}
        left={(props) => <List.Icon {...props} icon="bug" />}
      />
      <List.Item
        title="Tap water safety"
        description="Check local advisories before drinking tap water at your destination."
        left={(props) => <List.Icon {...props} icon="cup-water" />}
      />
      <List.Item
        title="Vaccine advisories"
        description="Check NHS/CDC travel health advisories for your destination well ahead of departure."
        left={(props) => <List.Icon {...props} icon="needle" />}
      />
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelGroup: {
    flex: 1,
    marginRight: 12,
    gap: 2,
  },
});
