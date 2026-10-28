import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { AirlinePicker } from '../../components/AirlinePicker';
import { ChoiceTile } from '../../components/ChoiceTile';
import { LocationSearchInput } from '../../components/LocationSearchInput';
import { SectionLabel } from '../../components/SectionLabel';
import { TripDateRangePicker } from '../../components/TripDateRangePicker';
import { useTripStore } from '../../state/useTripStore';
import { INTER_FAMILY } from '../../theme/fonts';
import { CLIMATE_CARD_COLORS } from '../../theme/paperTheme';
import type { ClimateType } from '../../types/packing';

const CLIMATE_OPTIONS: { value: ClimateType; label: string; icon: string }[] = [
  { value: 'warm', label: 'Warm / Sunny', icon: 'weather-sunny' },
  { value: 'mild', label: 'Mild', icon: 'weather-partly-cloudy' },
  { value: 'cold', label: 'Cold / Snow', icon: 'snowflake' },
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

  const nights = draftConfig.durationDays;

  return (
    <WizardStepLayout
      title="Where are you off to?"
      stepName="Logistics & airline"
      stepNumber={1}
      totalSteps={5}
      onNext={nextStep}
    >
      <LocationSearchInput initialQuery={draftConfig.destination} onSelect={selectLocation} />

      <View style={styles.group}>
        <View style={styles.labelRow}>
          <SectionLabel>Trip dates</SectionLabel>
          {nights > 0 ? (
            <Text variant="bodySmall" style={{ color: theme.colors.primary, fontFamily: INTER_FAMILY.semibold }}>
              {nights} night{nights === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
        <TripDateRangePicker startDate={draftConfig.startDate} endDate={draftConfig.endDate} onChange={setTripDates} />
      </View>

      <View style={styles.group}>
        <SectionLabel>Climate</SectionLabel>
        {draftConfig.weatherProfile ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {draftConfig.weatherProfile.isHistoricalEstimate
              ? 'Estimated from last year’s weather for these dates.'
              : 'Estimated from the current forecast.'}
          </Text>
        ) : null}
        {weatherLookupError ? (
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            Couldn&apos;t fetch weather ({weatherLookupError}). Pick a climate below.
          </Text>
        ) : null}
        <View style={styles.tileGrid}>
          {CLIMATE_OPTIONS.map((option) => (
            <View key={option.value} style={styles.tileCell}>
              <ChoiceTile
                label={option.label}
                icon={option.icon}
                iconColor={CLIMATE_CARD_COLORS[option.value]}
                selected={draftConfig.climate === option.value}
                onPress={() => updateDraftConfig({ climate: option.value })}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <SectionLabel>Airline</SectionLabel>
        <AirlinePicker selectedAirlineId={draftConfig.airlineId} onSelect={selectAirline} />
      </View>
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileCell: {
    flexBasis: '47.5%',
    flexGrow: 1,
  },
});
