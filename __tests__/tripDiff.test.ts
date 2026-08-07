import { hasTripChanged } from '../src/utils/tripDiff';
import type { SavedTrip } from '../src/state/storage';
import type { PackingItem, PackingPlan, TripConfig } from '../src/types/packing';

function makeConfig(overrides: Partial<TripConfig> = {}): TripConfig {
  return {
    destination: 'Krakow',
    startDate: '2026-08-06',
    endDate: '2026-08-14',
    climate: 'mild',
    durationDays: 9,
    travelers: [],
    checkedBags: 1,
    cabinBags: 1,
    laundryAvailable: false,
    reuseClothing: false,
    toiletryStrategy: 'pack',
    activities: [],
    ...overrides,
  };
}

function makeItem(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: 'item-1',
    name: 'T-Shirt / Top',
    category: 'clothing',
    quantity: 9,
    estimatedWeightGrams: 180,
    packed: false,
    ...overrides,
  };
}

function makePlan(items: PackingItem[]): PackingPlan {
  return {
    items,
    totalEstimatedWeightKg: 1.62,
    maxAllowedWeightKg: 23,
    isOverWeight: false,
    optimizationSuggestions: [],
  };
}

function makeSavedTrip(overrides: Partial<SavedTrip> = {}): SavedTrip {
  return {
    id: 'trip-1',
    name: 'Krakow Trip',
    config: makeConfig(),
    plan: makePlan([makeItem()]),
    savedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('hasTripChanged', () => {
  it('returns true when loadedTrip is null', () => {
    expect(hasTripChanged(null, makeConfig(), makePlan([makeItem()]))).toBe(true);
  });

  it('returns false when config and plan are deep-equal but different object references', () => {
    const loadedTrip = makeSavedTrip();
    const config = makeConfig();
    const plan = makePlan([makeItem()]);
    expect(hasTripChanged(loadedTrip, config, plan)).toBe(false);
  });

  it('returns true when a config field differs', () => {
    const loadedTrip = makeSavedTrip();
    const config = makeConfig({ destination: 'Vienna' });
    expect(hasTripChanged(loadedTrip, config, loadedTrip.plan)).toBe(true);
  });

  it('returns true when plan is null but loadedTrip is set', () => {
    const loadedTrip = makeSavedTrip();
    expect(hasTripChanged(loadedTrip, loadedTrip.config, null)).toBe(true);
  });

  it('returns true when an item quantity differs', () => {
    const loadedTrip = makeSavedTrip();
    const plan = makePlan([makeItem({ quantity: 5 })]);
    expect(hasTripChanged(loadedTrip, loadedTrip.config, plan)).toBe(true);
  });

  it('returns true when an item is packed', () => {
    const loadedTrip = makeSavedTrip();
    const plan = makePlan([makeItem({ packed: true })]);
    expect(hasTripChanged(loadedTrip, loadedTrip.config, plan)).toBe(true);
  });

  it('returns true when an item is excluded', () => {
    const loadedTrip = makeSavedTrip();
    const plan = makePlan([makeItem({ excluded: true })]);
    expect(hasTripChanged(loadedTrip, loadedTrip.config, plan)).toBe(true);
  });

  it('returns true when an item is removed', () => {
    const loadedTrip = makeSavedTrip({ plan: makePlan([makeItem({ id: 'a' }), makeItem({ id: 'b' })]) });
    const plan = makePlan([makeItem({ id: 'a' })]);
    expect(hasTripChanged(loadedTrip, loadedTrip.config, plan)).toBe(true);
  });
});
