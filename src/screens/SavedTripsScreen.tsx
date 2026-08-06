import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { useTripStore } from '../state/useTripStore';
import { HIT_SLOP_MIN } from '../theme/touchTargets';
import { JAKARTA_FAMILY } from '../theme/fonts';

interface SavedTripsScreenProps {
  onOpenTrip: () => void;
  onBack: () => void;
}

export function SavedTripsScreen({ onOpenTrip, onBack }: SavedTripsScreenProps) {
  const theme = useTheme();
  const savedTrips = useTripStore((s) => s.savedTrips);
  const loadTrip = useTripStore((s) => s.loadTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.secondary }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSecondary }]}>
          Saved Trips
        </Text>
      </View>
      <FlatList
        data={savedTrips}
        keyExtractor={(trip) => trip.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="contained" onPress={() => { loadTrip(item.id); onOpenTrip(); }}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardText}>
                <Text variant="titleMedium" style={{ fontFamily: JAKARTA_FAMILY.semibold }}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.config.destination || 'Unknown destination'} · saved{' '}
                  {new Date(item.savedAt).toLocaleDateString()}
                </Text>
              </View>
              <IconButton
                icon="delete-outline"
                hitSlop={HIT_SLOP_MIN}
                accessibilityLabel={`Delete ${item.name}`}
                onPress={() => deleteTrip(item.id)}
              />
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No saved trips yet.</Text>}
      />
      <Button mode="text" onPress={onBack} style={styles.backButton}>
        Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontFamily: JAKARTA_FAMILY.bold,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  backButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
});
