import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { InfoBanner } from '../../components/InfoBanner';
import { Stepper } from '../../components/Stepper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { useTripStore } from '../../state/useTripStore';
import { getAirlinePreset } from '../../data/airlineCatalog';
import { INTER_FAMILY } from '../../theme/fonts';
import { RADII } from '../../theme/radii';

export function Step5BaggageReview() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const computePlan = useTripStore((s) => s.computePlan);
  const prevStep = useTripStore((s) => s.prevStep);

  const airlinePreset = getAirlinePreset(draftConfig.airlineId);

  return (
    <WizardStepLayout
      title="How much are you taking?"
      stepName="Baggage review"
      stepNumber={5}
      totalSteps={5}
      onBack={prevStep}
      onNext={computePlan}
      nextLabel="Generate packing plan"
    >
      {airlinePreset ? (
        <InfoBanner>
          {`${airlinePreset.name} allows about ${airlinePreset.defaultCheckedWeightKg}kg checked and ${airlinePreset.defaultCabinWeightKg}kg cabin per bag. Confirm the bag counts below. They’re still yours to edit.`}
        </InfoBanner>
      ) : null}

      <BagCard
        icon="bag-suitcase-outline"
        title="Checked bags"
        caption="About 23kg each"
        value={draftConfig.checkedBags}
        noun="checked bags"
        onChange={(checkedBags) => updateDraftConfig({ checkedBags })}
      />
      <BagCard
        icon="bag-carry-on"
        title="Cabin bags"
        caption="About 10kg each"
        value={draftConfig.cabinBags}
        noun="cabin bags"
        onChange={(cabinBags) => updateDraftConfig({ cabinBags })}
      />
    </WizardStepLayout>
  );
}

function BagCard({
  icon,
  title,
  caption,
  value,
  noun,
  onChange,
}: {
  icon: string;
  title: string;
  caption: string;
  value: number;
  noun: string;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={[styles.iconTile, { backgroundColor: theme.colors.primaryContainer }]}>
        <Icon source={icon} size={28} color={theme.colors.primary} />
      </View>
      <View style={styles.text}>
        <Text variant="bodyLarge" style={{ fontFamily: INTER_FAMILY.semibold }}>
          {title}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {caption}
        </Text>
      </View>
      <Stepper
        value={value}
        accessibilityNoun={noun}
        onDecrement={() => onChange(Math.max(0, value - 1))}
        onIncrement={() => onChange(value + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADII.cards,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
