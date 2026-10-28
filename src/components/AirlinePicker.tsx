import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { AIRLINE_PRESETS } from '../data/airlineCatalog';
import { RadioCard } from './RadioCard';

interface AirlinePickerProps {
  selectedAirlineId: string | undefined;
  onSelect: (airlineId: string | undefined) => void;
}

export function AirlinePicker({ selectedAirlineId, onSelect }: AirlinePickerProps) {
  const theme = useTheme();
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {AIRLINE_PRESETS.map((preset) => (
        <RadioCard
          key={preset.id}
          title={preset.name}
          description={`Checked ${preset.defaultCheckedWeightKg}kg · Cabin ${preset.defaultCabinWeightKg}kg`}
          selected={preset.id === selectedAirlineId}
          onPress={() => onSelect(preset.id)}
        />
      ))}
      {!selectedAirlineId ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          No airline selected — using manual baggage entry.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
});
