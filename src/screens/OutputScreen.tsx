import React, { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { Button, Dialog, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { WeightBudgetBar } from '../components/WeightBudgetBar';
import { PackingItemRow } from '../components/PackingItemRow';
import { SelectableChip } from '../components/SelectableChip';
import { TripSummaryCard } from '../components/TripSummaryCard';
import { useTripStore } from '../state/useTripStore';
import { buildTravelerLabels } from '../utils/travelerLabel';
import { hasTripChanged } from '../utils/tripDiff';
import { HIT_SLOP_MIN } from '../theme/touchTargets';
import { CATEGORY_COLORS } from '../theme/paperTheme';
import type { PackingItem } from '../types/packing';

const CATEGORY_TABS: { value: PackingItem['category']; label: string; icon: string }[] = [
  { value: 'clothing', label: 'Clothing', icon: 'tshirt-crew-outline' },
  { value: 'toiletries', label: 'Toiletries', icon: 'shower' },
  { value: 'footwear', label: 'Footwear', icon: 'shoe-sneaker' },
  { value: 'electronics', label: 'Electronics', icon: 'laptop' },
  { value: 'essentials', label: 'Essentials', icon: 'bag-personal-outline' },
];

const SHARED_SECTION_TITLE = 'Shared';

interface OutputScreenProps {
  onDone: () => void;
}

export function OutputScreen({ onDone }: OutputScreenProps) {
  const theme = useTheme();
  const currentPlan = useTripStore((s) => s.currentPlan);
  const draftConfig = useTripStore((s) => s.draftConfig);
  const travelers = useTripStore((s) => s.draftConfig.travelers);
  const toggleItemPacked = useTripStore((s) => s.toggleItemPacked);
  const toggleItemExcluded = useTripStore((s) => s.toggleItemExcluded);
  const removeItem = useTripStore((s) => s.removeItem);
  const setItemQuantity = useTripStore((s) => s.setItemQuantity);
  const saveTrip = useTripStore((s) => s.saveTrip);
  const loadedTripId = useTripStore((s) => s.loadedTripId);
  const savedTrips = useTripStore((s) => s.savedTrips);
  const [category, setCategory] = useState<PackingItem['category']>('clothing');
  const [tripName, setTripName] = useState('');
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const travelerLabels = useMemo(() => buildTravelerLabels(travelers), [travelers]);

  const loadedTrip = useMemo(
    () => (loadedTripId ? savedTrips.find((t) => t.id === loadedTripId) ?? null : null),
    [loadedTripId, savedTrips]
  );
  const displayName = loadedTrip ? loadedTrip.name : tripName;
  const isDirty = useMemo(
    () => hasTripChanged(loadedTrip, draftConfig, currentPlan),
    [loadedTrip, draftConfig, currentPlan]
  );

  const filteredItems = useMemo(
    () => (currentPlan ? currentPlan.items.filter((item) => item.category === category) : []),
    [currentPlan, category]
  );

  const sections = useMemo(() => {
    const itemsByTraveler = new Map<string, PackingItem[]>();
    const sharedItems: PackingItem[] = [];

    for (const item of filteredItems) {
      if (item.assignedTravelerId) {
        const existing = itemsByTraveler.get(item.assignedTravelerId) ?? [];
        existing.push(item);
        itemsByTraveler.set(item.assignedTravelerId, existing);
      } else {
        sharedItems.push(item);
      }
    }

    const travelerSections = travelers
      .filter((traveler) => itemsByTraveler.has(traveler.id))
      .map((traveler) => ({
        title: travelerLabels[traveler.id],
        data: itemsByTraveler.get(traveler.id) ?? [],
      }));

    const sharedSection = sharedItems.length > 0 ? [{ title: SHARED_SECTION_TITLE, data: sharedItems }] : [];

    return [...travelerSections, ...sharedSection];
  }, [filteredItems, travelers, travelerLabels]);

  if (!currentPlan) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium">No packing plan yet.</Text>
        <Button mode="contained" onPress={onDone}>
          Back to Wizard
        </Button>
      </View>
    );
  }

  const hasSuggestions = currentPlan.optimizationSuggestions.length > 0;
  const includedItems = currentPlan.items.filter((item) => !item.excluded);
  const totalItemCount = includedItems.reduce((sum, item) => sum + item.quantity, 0);
  const packedItemCount = includedItems.reduce((sum, item) => sum + (item.packed ? item.quantity : 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text variant="headlineSmall">Your Packing Plan</Text>
        {hasSuggestions ? (
          <IconButton
            icon={currentPlan.isOverWeight ? 'alert-circle' : 'information-outline'}
            iconColor={currentPlan.isOverWeight ? theme.colors.error : theme.colors.primary}
            hitSlop={HIT_SLOP_MIN}
            accessibilityLabel="View packing suggestions"
            onPress={() => setSuggestionsVisible(true)}
          />
        ) : null}
      </View>

      <TripSummaryCard
        destination={draftConfig.destination}
        climate={draftConfig.climate}
        startDate={draftConfig.startDate}
        endDate={draftConfig.endDate}
        durationDays={draftConfig.durationDays}
        travelerCount={travelers.length}
        totalItems={totalItemCount}
        packedItems={packedItemCount}
      />

      <View style={styles.header}>
        <WeightBudgetBar
          totalEstimatedWeightKg={currentPlan.totalEstimatedWeightKg}
          maxAllowedWeightKg={currentPlan.maxAllowedWeightKg}
          isOverWeight={currentPlan.isOverWeight}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {CATEGORY_TABS.map((tab) => (
          <SelectableChip
            key={tab.value}
            label={tab.label}
            icon={tab.icon}
            badgeColor={CATEGORY_COLORS[tab.value]}
            selected={category === tab.value}
            onPress={() => setCategory(tab.value)}
          />
        ))}
      </ScrollView>

      <SectionList
        style={styles.list}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PackingItemRow
            item={item}
            onToggle={toggleItemPacked}
            onToggleExcluded={toggleItemExcluded}
            onRemove={removeItem}
            onQuantityChange={setItemQuantity}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
            <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
              {section.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {section.data.length} item{section.data.length === 1 ? '' : 's'}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
        ListEmptyComponent={<Text style={styles.emptyText}>No items in this category.</Text>}
      />

      <View style={styles.saveRow}>
        <TextInput
          label="Trip name"
          value={displayName}
          onChangeText={loadedTrip ? undefined : setTripName}
          disabled={!!loadedTrip}
          mode="outlined"
          style={styles.saveInput}
        />
        <Button
          mode="contained"
          disabled={loadedTrip ? !isDirty : !displayName.trim()}
          onPress={async () => {
            await saveTrip(displayName.trim());
            setTripName('');
          }}
        >
          Save Trip
        </Button>
      </View>

      <Button mode="text" onPress={onDone}>
        Back to Wizard
      </Button>

      <Portal>
        <Dialog visible={suggestionsVisible} onDismiss={() => setSuggestionsVisible(false)}>
          <Dialog.Icon icon={currentPlan.isOverWeight ? 'alert-circle' : 'information-outline'} />
          <Dialog.Title style={styles.dialogTitle}>
            {currentPlan.isOverWeight ? 'Over Weight Budget' : 'Suggestions'}
          </Dialog.Title>
          <Dialog.Content>
            {currentPlan.optimizationSuggestions.map((suggestion, index) => (
              <Text key={index} variant="bodyMedium" style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSuggestionsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    marginBottom: 4,
  },
  tabsScroll: {
    marginVertical: 4,
    height: 44,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  saveRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  saveInput: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  suggestionText: {
    marginBottom: 8,
  },
});
