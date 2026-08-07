const mockSearchLocations = jest.fn();
const mockGetTripWeather = jest.fn();
const mockDeriveClimateType = jest.fn();

jest.mock('../src/services/weather/factory', () => ({
  createTravelPlannerService: () => ({
    searchLocations: mockSearchLocations,
    getTripWeather: mockGetTripWeather,
    deriveClimateType: mockDeriveClimateType,
  }),
}));

import { useTripStore } from '../src/state/useTripStore';
import type { LocationResult } from '../src/services/weather/types';
import type { SavedTrip } from '../src/state/storage';
import type { PackingItem, PackingPlan } from '../src/types/packing';

function makeItem(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: 'item-1',
    name: 'Test Item',
    category: 'clothing',
    quantity: 1,
    estimatedWeightGrams: 500,
    packed: false,
    ...overrides,
  };
}

function makePlan(items: PackingItem[]): PackingPlan {
  return {
    items,
    totalEstimatedWeightKg: 999, // deliberately wrong, to prove the actions recompute it
    maxAllowedWeightKg: 23,
    isOverWeight: false,
    optimizationSuggestions: [],
  };
}

function makeSavedTrip(overrides: Partial<SavedTrip> = {}): SavedTrip {
  return {
    id: 'trip-1',
    name: 'Existing Trip',
    config: useTripStore.getState().draftConfig,
    plan: makePlan([makeItem()]),
    savedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const LONDON: LocationResult = {
  id: '1',
  name: 'London',
  country: 'United Kingdom',
  countryCode: 'GB',
  latitude: 51.5,
  longitude: -0.13,
  timezone: 'Europe/London',
};

beforeEach(() => {
  useTripStore.getState().resetWizard();
  mockSearchLocations.mockReset();
  mockGetTripWeather.mockReset();
  mockDeriveClimateType.mockReset();
});

describe('setTripDates', () => {
  it('updates dates and recomputes durationDays', () => {
    useTripStore.getState().setTripDates('2026-08-10', '2026-08-16');
    const { draftConfig } = useTripStore.getState();
    expect(draftConfig.startDate).toBe('2026-08-10');
    expect(draftConfig.endDate).toBe('2026-08-16');
    expect(draftConfig.durationDays).toBe(7);
  });

  it('is a no-op when endDate is before startDate', () => {
    const before = useTripStore.getState().draftConfig;
    useTripStore.getState().setTripDates('2026-08-16', '2026-08-10');
    expect(useTripStore.getState().draftConfig).toEqual(before);
  });

  it('does not trigger a weather fetch when no location is selected', () => {
    useTripStore.getState().setTripDates('2026-08-10', '2026-08-16');
    expect(mockGetTripWeather).not.toHaveBeenCalled();
  });

  it('re-fetches weather when a location is already selected', async () => {
    useTripStore.setState((state) => ({ draftConfig: { ...state.draftConfig, location: LONDON } }));
    mockGetTripWeather.mockResolvedValue({
      isHistoricalEstimate: false,
      summary: {
        avgTempC: 18,
        minTempC: 12,
        maxTempC: 24,
        overallCondition: 'sunny',
        totalRainExpectedMm: 0,
        maxRainProbabilityPct: 5,
        climateTags: ['warm'],
      },
      dailyBreakdown: [],
    });
    mockDeriveClimateType.mockReturnValue('warm');

    useTripStore.getState().setTripDates('2026-08-10', '2026-08-16');
    await Promise.resolve();
    await Promise.resolve();

    expect(mockGetTripWeather).toHaveBeenCalledTimes(1);
    expect(mockGetTripWeather).toHaveBeenCalledWith(LONDON, '2026-08-10', '2026-08-16');
  });
});

describe('selectLocation', () => {
  it('sets location and destination, then triggers a weather fetch', async () => {
    mockGetTripWeather.mockResolvedValue({
      isHistoricalEstimate: false,
      summary: {
        avgTempC: 20,
        minTempC: 15,
        maxTempC: 25,
        overallCondition: 'sunny',
        totalRainExpectedMm: 0,
        maxRainProbabilityPct: 5,
        climateTags: ['warm'],
      },
      dailyBreakdown: [],
    });
    mockDeriveClimateType.mockReturnValue('warm');

    useTripStore.getState().selectLocation(LONDON);
    await Promise.resolve();
    await Promise.resolve();

    const { draftConfig } = useTripStore.getState();
    expect(draftConfig.location).toEqual(LONDON);
    expect(draftConfig.destination).toBe('London');
    expect(draftConfig.climate).toBe('warm');
    expect(mockGetTripWeather).toHaveBeenCalled();
  });
});

describe('fetchWeather', () => {
  it('does nothing when no location is selected', async () => {
    await useTripStore.getState().fetchWeather();
    expect(mockGetTripWeather).not.toHaveBeenCalled();
  });

  it('sets weatherProfile and climate on success', async () => {
    useTripStore.setState((state) => ({ draftConfig: { ...state.draftConfig, location: LONDON } }));
    const profile = {
      isHistoricalEstimate: true,
      summary: {
        avgTempC: 2,
        minTempC: -3,
        maxTempC: 5,
        overallCondition: 'snowy',
        totalRainExpectedMm: 0,
        maxRainProbabilityPct: 10,
        climateTags: ['cold' as const],
      },
      dailyBreakdown: [],
    };
    mockGetTripWeather.mockResolvedValue(profile);
    mockDeriveClimateType.mockReturnValue('cold');

    await useTripStore.getState().fetchWeather();

    const { draftConfig, weatherLookupError } = useTripStore.getState();
    expect(draftConfig.weatherProfile).toEqual(profile);
    expect(draftConfig.climate).toBe('cold');
    expect(weatherLookupError).toBeNull();
  });

  it('sets weatherLookupError and leaves climate unchanged on failure', async () => {
    useTripStore.setState((state) => ({ draftConfig: { ...state.draftConfig, location: LONDON, climate: 'mild' } }));
    mockGetTripWeather.mockRejectedValue(new Error('network down'));

    await useTripStore.getState().fetchWeather();

    const { draftConfig, weatherLookupError } = useTripStore.getState();
    expect(draftConfig.climate).toBe('mild');
    expect(weatherLookupError).toBe('network down');
  });
});

describe('toggleItemExcluded', () => {
  it('flips excluded on the matching item and recomputes weight, ignoring excluded items', () => {
    useTripStore.setState({
      currentPlan: makePlan([
        makeItem({ id: 'a', estimatedWeightGrams: 500 }),
        makeItem({ id: 'b', estimatedWeightGrams: 500 }),
      ]),
    });

    useTripStore.getState().toggleItemExcluded('a');

    const { currentPlan } = useTripStore.getState();
    expect(currentPlan?.items.find((i) => i.id === 'a')?.excluded).toBe(true);
    expect(currentPlan?.items.find((i) => i.id === 'b')?.excluded).toBeFalsy();
    expect(currentPlan?.totalEstimatedWeightKg).toBe(0.5); // only item 'b' counts now
  });

  it('restores an excluded item back into the weight total when toggled again', () => {
    useTripStore.setState({
      currentPlan: makePlan([makeItem({ id: 'a', estimatedWeightGrams: 500, excluded: true })]),
    });

    useTripStore.getState().toggleItemExcluded('a');

    const { currentPlan } = useTripStore.getState();
    expect(currentPlan?.items[0].excluded).toBe(false);
    expect(currentPlan?.totalEstimatedWeightKg).toBe(0.5);
  });

  it('does nothing when there is no current plan', () => {
    useTripStore.setState({ currentPlan: null });
    expect(() => useTripStore.getState().toggleItemExcluded('a')).not.toThrow();
    expect(useTripStore.getState().currentPlan).toBeNull();
  });
});

describe('removeItem', () => {
  it('removes the item from the plan and recomputes weight', () => {
    useTripStore.setState({
      currentPlan: makePlan([
        makeItem({ id: 'a', estimatedWeightGrams: 500 }),
        makeItem({ id: 'b', estimatedWeightGrams: 500 }),
      ]),
    });

    useTripStore.getState().removeItem('a');

    const { currentPlan } = useTripStore.getState();
    expect(currentPlan?.items.map((i) => i.id)).toEqual(['b']);
    expect(currentPlan?.totalEstimatedWeightKg).toBe(0.5);
  });

  it('recomputes isOverWeight after removal', () => {
    useTripStore.setState({
      currentPlan: {
        ...makePlan([
          makeItem({ id: 'a', estimatedWeightGrams: 20_000_000 }), // way over budget
          makeItem({ id: 'b', estimatedWeightGrams: 500 }),
        ]),
        maxAllowedWeightKg: 23,
        isOverWeight: true,
      },
    });

    useTripStore.getState().removeItem('a');

    const { currentPlan } = useTripStore.getState();
    expect(currentPlan?.isOverWeight).toBe(false);
  });

  it('does nothing when there is no current plan', () => {
    useTripStore.setState({ currentPlan: null });
    expect(() => useTripStore.getState().removeItem('a')).not.toThrow();
    expect(useTripStore.getState().currentPlan).toBeNull();
  });
});

describe('setItemQuantity', () => {
  it('updates the item quantity and recomputes weight', () => {
    useTripStore.setState({
      currentPlan: makePlan([makeItem({ id: 'a', estimatedWeightGrams: 200, quantity: 3 })]),
    });

    useTripStore.getState().setItemQuantity('a', 5);

    const { currentPlan } = useTripStore.getState();
    expect(currentPlan?.items[0].quantity).toBe(5);
    expect(currentPlan?.totalEstimatedWeightKg).toBe(1); // 200g * 5 = 1000g -> 1kg
  });

  it('clamps to a minimum of 1', () => {
    useTripStore.setState({
      currentPlan: makePlan([makeItem({ id: 'a', quantity: 1 })]),
    });

    useTripStore.getState().setItemQuantity('a', 0);

    expect(useTripStore.getState().currentPlan?.items[0].quantity).toBe(1);
  });

  it('ignores excluded items when recomputing weight', () => {
    useTripStore.setState({
      currentPlan: makePlan([
        makeItem({ id: 'a', estimatedWeightGrams: 200, quantity: 1, excluded: true }),
        makeItem({ id: 'b', estimatedWeightGrams: 100, quantity: 1 }),
      ]),
    });

    useTripStore.getState().setItemQuantity('a', 10);

    expect(useTripStore.getState().currentPlan?.totalEstimatedWeightKg).toBe(0.1); // only 'b' counts
  });

  it('does nothing when there is no current plan', () => {
    useTripStore.setState({ currentPlan: null });
    expect(() => useTripStore.getState().setItemQuantity('a', 5)).not.toThrow();
    expect(useTripStore.getState().currentPlan).toBeNull();
  });
});

describe('loadTrip', () => {
  it('copies config and plan into draftConfig/currentPlan and sets loadedTripId', () => {
    const trip = makeSavedTrip({ id: 'trip-1', config: { ...useTripStore.getState().draftConfig, destination: 'Krakow' } });
    useTripStore.setState({ savedTrips: [trip] });

    useTripStore.getState().loadTrip('trip-1');

    const state = useTripStore.getState();
    expect(state.draftConfig).toEqual(trip.config);
    expect(state.currentPlan).toEqual(trip.plan);
    expect(state.loadedTripId).toBe('trip-1');
  });

  it('is a no-op when the id does not exist', () => {
    const before = useTripStore.getState();
    useTripStore.getState().loadTrip('missing');
    const after = useTripStore.getState();
    expect(after.loadedTripId).toBeNull();
    expect(after.draftConfig).toBe(before.draftConfig);
    expect(after.currentPlan).toBe(before.currentPlan);
  });
});

describe('resetWizard', () => {
  it('clears loadedTripId back to null', () => {
    useTripStore.setState({ loadedTripId: 'trip-1' });
    useTripStore.getState().resetWizard();
    expect(useTripStore.getState().loadedTripId).toBeNull();
  });
});

describe('saveTrip', () => {
  it('creates a new trip and sets loadedTripId to the new id when nothing is loaded', async () => {
    useTripStore.setState({ currentPlan: makePlan([makeItem()]), loadedTripId: null, savedTrips: [] });

    await useTripStore.getState().saveTrip('My Trip');

    const { savedTrips, loadedTripId } = useTripStore.getState();
    expect(savedTrips).toHaveLength(1);
    expect(savedTrips[0].name).toBe('My Trip');
    expect(loadedTripId).toBe(savedTrips[0].id);
  });

  it('updates the existing entry in place when loadedTripId matches a saved trip', async () => {
    const original = makeSavedTrip({ id: 'trip-1', name: 'Old Name' });
    const newPlan = makePlan([makeItem({ id: 'a', quantity: 3 })]);
    useTripStore.setState({
      savedTrips: [original],
      loadedTripId: 'trip-1',
      currentPlan: newPlan,
      draftConfig: original.config,
    });

    await useTripStore.getState().saveTrip('Old Name');

    const { savedTrips, loadedTripId } = useTripStore.getState();
    expect(savedTrips).toHaveLength(1);
    expect(savedTrips[0].id).toBe('trip-1');
    expect(savedTrips[0].plan).toEqual(newPlan);
    expect(savedTrips[0].savedAt).not.toBe(original.savedAt);
    expect(loadedTripId).toBe('trip-1');
  });

  it('falls back to creating a new trip when loadedTripId no longer exists in savedTrips', async () => {
    useTripStore.setState({
      savedTrips: [],
      loadedTripId: 'deleted-trip',
      currentPlan: makePlan([makeItem()]),
    });

    await useTripStore.getState().saveTrip('Recovered Trip');

    const { savedTrips, loadedTripId } = useTripStore.getState();
    expect(savedTrips).toHaveLength(1);
    expect(savedTrips[0].id).not.toBe('deleted-trip');
    expect(loadedTripId).toBe(savedTrips[0].id);
  });

  it('does nothing when there is no current plan', async () => {
    useTripStore.setState({ currentPlan: null, savedTrips: [] });
    await useTripStore.getState().saveTrip('x');
    expect(useTripStore.getState().savedTrips).toHaveLength(0);
  });
});
