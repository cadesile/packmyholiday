import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ActivityType } from '../types/packing';
import { ChoiceTile } from './ChoiceTile';

interface ActivityChipGridProps {
  selected: ActivityType[];
  onToggle: (activity: ActivityType) => void;
}

const ACTIVITY_OPTIONS: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'beach', label: 'Pool & beach', icon: 'beach' },
  { value: 'nightlife', label: 'Nights out', icon: 'glass-cocktail' },
  { value: 'exploring', label: 'Exploring', icon: 'compass-outline' },
  { value: 'hiking', label: 'Hiking', icon: 'hiking' },
  { value: 'sightseeing', label: 'Sightseeing', icon: 'binoculars' },
  { value: 'formal', label: 'Formal', icon: 'tie' },
  { value: 'gym', label: 'Gym', icon: 'dumbbell' },
  { value: 'work', label: 'Work', icon: 'briefcase-outline' },
];

// Two-column grid of stacked tiles.
export function ActivityChipGrid({ selected, onToggle }: ActivityChipGridProps) {
  return (
    <View style={styles.grid}>
      {ACTIVITY_OPTIONS.map((option) => (
        <View key={option.value} style={styles.cell}>
          <ChoiceTile
            layout="stacked"
            label={option.label}
            icon={option.icon}
            selected={selected.includes(option.value)}
            onPress={() => onToggle(option.value)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    // Two per row: half the width minus half the 12px gap.
    flexBasis: '47.5%',
    flexGrow: 1,
  },
});
