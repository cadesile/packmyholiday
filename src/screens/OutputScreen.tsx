import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { Dialog, Icon, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { WeightBudgetBar } from '../components/WeightBudgetBar';
import { PackingItemRow } from '../components/PackingItemRow';
import { SectionLabel } from '../components/SectionLabel';
import { SelectableChip } from '../components/SelectableChip';
import { TripSummaryCard } from '../components/TripSummaryCard';
import { useTripStore } from '../state/useTripStore';
import { buildTravelerLabels } from '../utils/travelerLabel';
import { hasTripChanged } from '../utils/tripDiff';
import { INTER_FAMILY } from '../theme/fonts';
import { CATEGORY_COLORS } from '../theme/paperTheme';
import { RADII } from '../theme/radii';
import { CONTROL_HEIGHT, SCREEN_GUTTER } from '../theme/spacing';
import { MIN_TOUCH } from '../theme/touchTargets';
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
  const insets = useSafeAreaInsets();
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
        <AppButton onPress={onDone}>Back to wizard</AppButton>
      </View>
    );
  }

  const hasSuggestions = currentPlan.optimizationSuggestions.length > 0;
  const includedItems = currentPlan.items.filter((item) => !item.excluded);
  const totalItemCount = includedItems.reduce((sum, item) => sum + item.quantity, 0);
  const packedItemCount = includedItems.reduce((sum, item) => sum + (item.packed ? item.quantity : 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Text variant="headlineMedium" accessibilityRole="header" style={styles.title}>
            Your packing plan
          </Text>
          <AppButton variant="text" onPress={onDone}>
            New trip
          </AppButton>
          {hasSuggestions ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View packing suggestions"
              onPress={() => setSuggestionsVisible(true)}
              style={[
                styles.roundButton,
                {
                  backgroundColor: currentPlan.isOverWeight ? theme.colors.errorContainer : theme.colors.surface,
                  borderColor: currentPlan.isOverWeight ? theme.colors.error : theme.colors.outlineVariant,
                },
              ]}
            >
              <Icon
                source={currentPlan.isOverWeight ? 'alert-circle-outline' : 'information-outline'}
                size={20}
                color={currentPlan.isOverWeight ? theme.colors.error : theme.colors.primary}
              />
            </Pressable>
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

        <WeightBudgetBar
          totalEstimatedWeightKg={currentPlan.totalEstimatedWeightKg}
          maxAllowedWeightKg={currentPlan.maxAllowedWeightKg}
          isOverWeight={currentPlan.isOverWeight}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
          accessibilityRole="tablist"
        >
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
      </View>

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
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No items in this category.</Text>
        }
      />

      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.saveField}>
          <SectionLabel>Trip name</SectionLabel>
          <TextInput
            accessibilityLabel="Trip name"
            placeholder="Name this trip"
            value={displayName}
            onChangeText={loadedTrip ? undefined : setTripName}
            disabled={!!loadedTrip}
            mode="outlined"
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.primary}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            style={[styles.saveInput, { backgroundColor: theme.colors.surface }]}
          />
        </View>
        <AppButton
          disabled={loadedTrip ? !isDirty : !displayName.trim()}
          onPress={async () => {
            await saveTrip(displayName.trim());
            setTripName('');
          }}
        >
          Save trip
        </AppButton>
      </View>

      <Portal>
        <Dialog
          visible={suggestionsVisible}
          onDismiss={() => setSuggestionsVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Icon
            icon={currentPlan.isOverWeight ? 'alert-circle-outline' : 'information-outline'}
            color={currentPlan.isOverWeight ? theme.colors.error : theme.colors.primary}
          />
          <Dialog.Title style={styles.dialogTitle}>
            {currentPlan.isOverWeight ? 'Over weight budget' : 'Suggestions'}
          </Dialog.Title>
          <Dialog.Content>
            {currentPlan.optimizationSuggestions.map((suggestion, index) => (
              <Text key={index} variant="bodyMedium" style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton variant="text" onPress={() => setSuggestionsVisible(false)}>
              Close
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    flex: 1,
  },
  roundButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsScroll: {
    marginHorizontal: -SCREEN_GUTTER,
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SCREEN_GUTTER,
    paddingBottom: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 12,
    paddingBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 14,
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
  saveField: {
    flex: 1,
    gap: 4,
  },
  saveInput: {
    height: CONTROL_HEIGHT,
  },
  inputOutline: {
    borderRadius: RADII.inputs,
    borderWidth: 1.5,
  },
  inputContent: {
    fontFamily: INTER_FAMILY.medium,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dialog: {
    borderRadius: RADII.hero,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  suggestionText: {
    marginBottom: 8,
  },
});
