import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { FRAUNCES_FAMILY } from '../theme/fonts';
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
  const cardColor = CLIMATE_CARD_COLORS[climate];
  const onCardColor = '#FFFFFF';

  return (
    <View style={[styles.card, { backgroundColor: cardColor }]}>
      <View style={styles.weatherIcon}>
        <Icon source={CLIMATE_CARD_ICONS[climate]} size={72} color="rgba(255,255,255,0.22)" />
      </View>

      <Text variant="titleLarge" style={[styles.destination, { color: onCardColor }]}>
        {destination || 'Your Trip'}
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: onCardColor }]}>
        {formatDateRange(startDate, endDate)}
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: onCardColor }]}>
        {durationDays} night{durationDays === 1 ? '' : 's'} · {travelerCount} traveler{travelerCount === 1 ? '' : 's'}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text variant="headlineSmall" style={[styles.statValue, { color: onCardColor }]}>
            {totalItems}
          </Text>
          <Text variant="bodySmall" style={{ color: onCardColor, opacity: 0.75 }}>
            Total items
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text variant="headlineSmall" style={[styles.statValue, { color: onCardColor }]}>
            {packedItems}
          </Text>
          <Text variant="bodySmall" style={{ color: onCardColor, opacity: 0.75 }}>
            Packed
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text variant="headlineSmall" style={[styles.statValue, { color: onCardColor }]}>
            {toPack}
          </Text>
          <Text variant="bodySmall" style={{ color: onCardColor, opacity: 0.75 }}>
            To pack
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 4,
    overflow: 'hidden',
  },
  weatherIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  destination: {
    fontFamily: FRAUNCES_FAMILY.bold,
    paddingRight: 64,
  },
  subtitle: {
    opacity: 0.85,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FRAUNCES_FAMILY.bold,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
