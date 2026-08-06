import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List, RadioButton, Text } from 'react-native-paper';
import { AIRLINE_PRESETS } from '../data/airlineCatalog';

interface AirlinePickerProps {
  selectedAirlineId: string | undefined;
  onSelect: (airlineId: string | undefined) => void;
}

export function AirlinePicker({ selectedAirlineId, onSelect }: AirlinePickerProps) {
  return (
    <View style={styles.container}>
      <RadioButton.Group
        value={selectedAirlineId ?? ''}
        onValueChange={(value) => onSelect(value || undefined)}
      >
        {AIRLINE_PRESETS.map((preset) => (
          <List.Item
            key={preset.id}
            title={preset.name}
            description={`Checked ${preset.defaultCheckedWeightKg}kg · Cabin ${preset.defaultCabinWeightKg}kg`}
            onPress={() => onSelect(preset.id)}
            left={() => <RadioButton value={preset.id} />}
          />
        ))}
      </RadioButton.Group>
      {!selectedAirlineId ? <Text variant="bodySmall">No airline selected — using manual baggage entry.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
});
