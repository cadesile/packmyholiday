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
