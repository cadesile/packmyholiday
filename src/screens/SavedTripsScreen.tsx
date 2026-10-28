import React from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { useTripStore } from '../state/useTripStore';
import { CLIMATE_CARD_COLORS, CLIMATE_CARD_ICONS } from '../theme/paperTheme';
import { RADII } from '../theme/radii';
import { SCREEN_GUTTER } from '../theme/spacing';
import { HIT_SLOP_MIN } from '../theme/touchTargets';

interface SavedTripsScreenProps {
  onOpenTrip: () => void;
  onBack: () => void;
}

const SAVED_DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

export function SavedTripsScreen({ onOpenTrip, onBack }: SavedTripsScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const savedTrips = useTripStore((s) => s.savedTrips);
  const loadTrip = useTripStore((s) => s.loadTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={savedTrips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="displaySmall" accessibilityRole="header">
              Saved trips
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {savedTrips.length} trip{savedTrips.length === 1 ? '' : 's'} on this device
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const climate = item.config.climate;
          return (
            <View
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
            >
              <View style={[styles.badge, { backgroundColor: CLIMATE_CARD_COLORS[climate] }]}>
                <Icon source={CLIMATE_CARD_ICONS[climate]} size={26} color="#FFFFFF" />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}`}
                style={styles.cardText}
                onPress={() => {
                  loadTrip(item.id);
                  onOpenTrip();
                }}
              >
                <Text variant="titleMedium">{item.name}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.config.destination || 'Unknown destination'} · saved{' '}
                  {new Date(item.savedAt).toLocaleDateString(undefined, SAVED_DATE_FORMAT)}
                </Text>
              </Pressable>
              <IconButton
                icon="trash-can-outline"
                iconColor={theme.colors.onSurfaceVariant}
                hitSlop={HIT_SLOP_MIN}
                accessibilityLabel={`Delete ${item.name}`}
                onPress={() => deleteTrip(item.id)}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No saved trips yet.
          </Text>
        }
      />
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <AppButton variant="secondary" iconLeft="chevron-left" onPress={onBack} style={styles.back}>
          Back
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    gap: 4,
    marginBottom: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADII.cards,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    gap: 3,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  bottomBar: {
    paddingTop: 16,
    paddingHorizontal: SCREEN_GUTTER,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0E2A33',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -6 },
      },
      default: { elevation: 8 },
    }),
  },
  back: {
    alignSelf: 'stretch',
  },
});
