import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { RADII } from '../theme/radii';
import { CLIMATE_CARD_COLORS, CLIMATE_CARD_ICONS } from '../theme/paperTheme';
import { formatDateRange } from '../utils/tripDates';
import type { ClimateType } from '../types/packing';

interface TripSummaryCardProps {
  destination: string;
  climate: ClimateType;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelerCount: number;
  totalItems: number;
  packedItems: number;
}

// Text on the card is always white: every CLIMATE_CARD_COLORS entry passes 4.5:1 under it.
const ON_CARD = '#FFFFFF';
const ON_CARD_MUTED = 'rgba(255,255,255,0.92)';
const DIVIDER = 'rgba(255,255,255,0.25)';

export function TripSummaryCard({
  destination,
  climate,
  startDate,
  endDate,
  durationDays,
  travelerCount,
  totalItems,
  packedItems,
}: TripSummaryCardProps) {
  const toPack = totalItems - packedItems;

  return (
    <View style={[styles.card, { backgroundColor: CLIMATE_CARD_COLORS[climate] }]}>
      <View style={styles.weatherIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Icon source={CLIMATE_CARD_ICONS[climate]} size={72} color="rgba(255,255,255,0.22)" />
      </View>

      <View style={styles.heading}>
        <Text variant="headlineSmall" style={{ color: ON_CARD }}>
          {destination || 'Your Trip'}
        </Text>
        <Text variant="bodySmall" style={{ color: ON_CARD_MUTED }}>
          {formatDateRange(startDate, endDate)} · {durationDays} night{durationDays === 1 ? '' : 's'} · {travelerCount}{' '}
          traveler{travelerCount === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Stat value={totalItems} label="Total items" />
        <View style={styles.statDivider} />
        <Stat value={packedItems} label="Packed" />
        <View style={styles.statDivider} />
        <Stat value={toPack} label="To pack" />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label.toLowerCase()}`}>
      <Text variant="headlineMedium" style={{ color: ON_CARD }}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: ON_CARD_MUTED, fontSize: 13 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.hero,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
  },
  weatherIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  heading: {
    gap: 2,
    paddingRight: 72,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
    paddingTop: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: DIVIDER,
  },
});
