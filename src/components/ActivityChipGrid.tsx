import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ActivityType } from '../types/packing';
import { SelectableChip } from './SelectableChip';

interface ActivityChipGridProps {
  selected: ActivityType[];
  onToggle: (activity: ActivityType) => void;
}

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'beach', label: 'Pool & Beach', icon: 'beach' },
  { value: 'nightlife', label: 'Nights Out', icon: 'glass-cocktail' },
  { value: 'exploring', label: 'Exploring', icon: 'compass-outline' },
  { value: 'hiking', label: 'Hiking', icon: 'hiking' },
  { value: 'sightseeing', label: 'Sightseeing', icon: 'binoculars' },
  { value: 'formal', label: 'Formal', icon: 'tie' },
  { value: 'gym', label: 'Gym', icon: 'dumbbell' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
];

export function ActivityChipGrid({ selected, onToggle }: ActivityChipGridProps) {
  return (
    <View style={styles.grid}>
      {ACTIVITY_OPTIONS.map((option) => (
        <SelectableChip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={selected.includes(option.value)}
          onPress={() => onToggle(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
