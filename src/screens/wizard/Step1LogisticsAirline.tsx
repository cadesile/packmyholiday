import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { AirlinePicker } from '../../components/AirlinePicker';
import { LocationSearchInput } from '../../components/LocationSearchInput';
import { TripDateRangePicker } from '../../components/TripDateRangePicker';
import { SelectableChip } from '../../components/SelectableChip';
import { useTripStore } from '../../state/useTripStore';
import type { ClimateType } from '../../types/packing';

const CLIMATE_OPTIONS: { value: ClimateType; label: string; icon: string }[] = [
  { value: 'warm', label: 'Warm/Sunny', icon: 'weather-sunny' },
  { value: 'mild', label: 'Mild/Temperate', icon: 'weather-partly-cloudy' },
  { value: 'cold', label: 'Cold/Snow', icon: 'snowflake' },
  { value: 'rainy', label: 'Rainy', icon: 'weather-rainy' },
];

export function Step1LogisticsAirline() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const selectAirline = useTripStore((s) => s.selectAirline);
  const selectLocation = useTripStore((s) => s.selectLocation);
  const setTripDates = useTripStore((s) => s.setTripDates);
  const weatherLookupError = useTripStore((s) => s.weatherLookupError);
  const nextStep = useTripStore((s) => s.nextStep);
  const theme = useTheme();

  return (
    <WizardStepLayout
      title="Logistics & Airline"
      stepNumber={1}
      totalSteps={5}
      onNext={nextStep}
      stickerIcon="airplane"
      stickerColor="sky"
    >
      <LocationSearchInput initialQuery={draftConfig.destination} onSelect={selectLocation} />

      <Text variant="titleMedium">Trip Dates</Text>
      <TripDateRangePicker startDate={draftConfig.startDate} endDate={draftConfig.endDate} onChange={setTripDates} />

      <Text variant="titleMedium">Climate</Text>
      {draftConfig.weatherProfile ? (
        <Text variant="bodySmall" style={styles.weatherHint}>
          {draftConfig.weatherProfile.isHistoricalEstimate
            ? 'Estimated from last year’s weather for these dates.'
            : 'Estimated from the current forecast.'}
        </Text>
      ) : null}
      {weatherLookupError ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          Couldn&apos;t fetch weather ({weatherLookupError}) — pick a climate below.
        </Text>
      ) : null}
      <View style={styles.chipRow}>
        {CLIMATE_OPTIONS.map((option) => (
          <SelectableChip
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={draftConfig.climate === option.value}
            onPress={() => updateDraftConfig({ climate: option.value })}
          />
        ))}
      </View>

      <Text variant="titleMedium">Airline</Text>
      <AirlinePicker selectedAirlineId={draftConfig.airlineId} onSelect={selectAirline} />
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherHint: {
    fontStyle: 'italic',
  },
});
