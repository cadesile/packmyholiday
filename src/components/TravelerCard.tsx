import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Switch, Text, useTheme } from 'react-native-paper';
import type { AgeGroup, StylePreference, Traveler } from '../types/packing';
import { HIT_SLOP_MIN } from '../theme/touchTargets';
import { INTER_FAMILY } from '../theme/fonts';
import { RADII } from '../theme/radii';
import { SectionLabel } from './SectionLabel';
import { SegmentedControl } from './SegmentedControl';

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
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
            <Text variant="titleSmall" style={{ color: theme.colors.onPrimary, fontSize: 15, lineHeight: 20 }}>
              {index + 1}
            </Text>
          </View>
          <Text variant="titleMedium">Traveler {index + 1}</Text>
        </View>
        <IconButton
          icon="close"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          hitSlop={HIT_SLOP_MIN}
          onPress={onRemove}
          accessibilityLabel={`Remove traveler ${index + 1}`}
        />
      </View>

      <View style={styles.field}>
        <SectionLabel>Age group</SectionLabel>
        <SegmentedControl
          value={traveler.ageGroup}
          options={AGE_GROUP_OPTIONS}
          onChange={(value) => onChange({ ageGroup: value })}
        />
      </View>

      <View style={styles.field}>
        <SectionLabel>Clothing style</SectionLabel>
        <SegmentedControl
          value={traveler.style}
          options={STYLE_OPTIONS}
          onChange={(value) => onChange({ style: value })}
        />
      </View>

      <View style={styles.switchRow}>
        <Text variant="bodySmall" style={styles.switchLabel}>
          Sensitive skin / kids SPF 50+
        </Text>
        <Switch
          value={!!traveler.sensitiveSkin}
          color={theme.colors.primary}
          onValueChange={(value) => onChange({ sensitiveSkin: value })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADII.cards,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: INTER_FAMILY.medium,
  },
});
