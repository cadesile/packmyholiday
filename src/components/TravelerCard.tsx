import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, IconButton, SegmentedButtons, Switch, Text } from 'react-native-paper';
import type { AgeGroup, StylePreference, Traveler } from '../types/packing';
import { HIT_SLOP_MIN } from '../theme/touchTargets';
import { INTER_FAMILY } from '../theme/fonts';

interface TravelerCardProps {
  traveler: Traveler;
  index: number;
  onChange: (partial: Partial<Traveler>) => void;
  onRemove: () => void;
}

const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'toddler', label: 'Toddler' },
  { value: 'infant', label: 'Infant' },
];

const STYLE_OPTIONS: { value: StylePreference; label: string }[] = [
  { value: 'masculine', label: 'Masculine' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'unisex', label: 'Unisex' },
];

export function TravelerCard({ traveler, index, onChange, onRemove }: TravelerCardProps) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleMedium">Traveler {index + 1}</Text>
          <IconButton
            icon="close"
            size={18}
            hitSlop={HIT_SLOP_MIN}
            onPress={onRemove}
            accessibilityLabel={`Remove traveler ${index + 1}`}
          />
        </View>

        <Text variant="labelLarge" style={styles.fieldLabel}>Age Group</Text>
        <SegmentedButtons
          value={traveler.ageGroup}
          onValueChange={(value) => onChange({ ageGroup: value as AgeGroup })}
          buttons={AGE_GROUP_OPTIONS}
        />

        <Text variant="labelLarge" style={styles.fieldLabel}>Clothing Style</Text>
        <SegmentedButtons
          value={traveler.style}
          onValueChange={(value) => onChange({ style: value as StylePreference })}
          buttons={STYLE_OPTIONS}
        />

        <View style={styles.switchRow}>
          <Text variant="labelLarge" style={styles.fieldLabel}>Sensitive Skin / Kids SPF 50+</Text>
          <Switch
            value={!!traveler.sensitiveSkin}
            onValueChange={(value) => onChange({ sensitiveSkin: value })}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: INTER_FAMILY.semibold,
  },
});
