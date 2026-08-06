import { create } from 'zustand';
import type { PackingPlan, Traveler, TripConfig } from '../types/packing';
import { generatePackingPlan } from '../utils/packingEngine';
import { defaultIdGenerator } from '../utils/id';
import { loadSavedTrips, persistSavedTrips, type SavedTrip } from './storage';
import { computeDurationDays, toISODateString } from '../utils/tripDates';
import { createTravelPlannerService } from '../services/weather/factory';
import type { LocationResult } from '../services/weather/types';
import type { TravelPlannerService } from '../services/weather/TravelPlannerService';

export type { SavedTrip };

const MIN_WIZARD_STEP = 1;
const MAX_WIZARD_STEP = 5;

// Instantiated lazily (rather than at module load) so that jest.mock('.../factory')
// in tests is guaranteed to be fully set up before the mocked factory is invoked.
let travelPlannerServiceInstance: TravelPlannerService | null = null;
function getTravelPlannerService(): TravelPlannerService {
  if (!travelPlannerServiceInstance) {
    travelPlannerServiceInstance = createTravelPlannerService();
  }
  return travelPlannerServiceInstance;
}

function defaultDraftConfig(): TripConfig {
  const start = new Date();
  const startDate = toISODateString(start);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endDate = toISODateString(end);

  return {
    destination: '',
    location: undefined,
    startDate,
    endDate,
    airlineId: undefined,
    climate: 'mild',
    durationDays: computeDurationDays(startDate, endDate),
    weatherProfile: undefined,
    travelers: [],
    checkedBags: 1,
    cabinBags: 1,
    laundryAvailable: false,
    toiletryStrategy: 'pack',
    activities: [],
  };
}

function canAdvanceFromStep(step: number, draftConfig: TripConfig): boolean {
  if (step === 2) {
    return draftConfig.travelers.length > 0;
  }
  return true;
}

interface TripStoreState {
  wizardStep: number;
  draftConfig: TripConfig;
  currentPlan: PackingPlan | null;
  savedTrips: SavedTrip[];
  hydrated: boolean;
  weatherLookupError: string | null;

  hydrate: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  updateDraftConfig: (partial: Partial<TripConfig>) => void;
  setTripDates: (startDate: string, endDate: string) => void;
  selectLocation: (location: LocationResult) => void;
  fetchWeather: () => Promise<void>;
  addTraveler: () => void;
  removeTraveler: (id: string) => void;
  updateTraveler: (id: string, partial: Partial<Traveler>) => void;
  selectAirline: (airlineId: string | undefined) => void;
  computePlan: () => void;
  toggleItemPacked: (itemId: string) => void;
  saveTrip: (name: string) => Promise<void>;
  loadTrip: (id: string) => void;
  deleteTrip: (id: string) => Promise<void>;
  resetWizard: () => void;
}

export const useTripStore = create<TripStoreState>((set, get) => ({
  wizardStep: MIN_WIZARD_STEP,
  draftConfig: defaultDraftConfig(),
  currentPlan: null,
  savedTrips: [],
  hydrated: false,
  weatherLookupError: null,

  hydrate: async () => {
    const savedTrips = await loadSavedTrips();
    set({ savedTrips, hydrated: true });
  },

  nextStep: () => {
    const { wizardStep, draftConfig } = get();
    if (!canAdvanceFromStep(wizardStep, draftConfig)) return;
    set({ wizardStep: Math.min(MAX_WIZARD_STEP, wizardStep + 1) });
  },

  prevStep: () => {
    set((state) => ({ wizardStep: Math.max(MIN_WIZARD_STEP, state.wizardStep - 1) }));
  },

  updateDraftConfig: (partial) => {
    set((state) => ({ draftConfig: { ...state.draftConfig, ...partial } }));
  },

  setTripDates: (startDate, endDate) => {
    if (endDate < startDate) return;
    const durationDays = computeDurationDays(startDate, endDate);
    set((state) => ({ draftConfig: { ...state.draftConfig, startDate, endDate, durationDays } }));
    if (get().draftConfig.location) {
      void get().fetchWeather();
    }
  },

  selectLocation: (location) => {
    set((state) => ({ draftConfig: { ...state.draftConfig, location, destination: location.name } }));
    void get().fetchWeather();
  },

  fetchWeather: async () => {
    const { draftConfig } = get();
    if (!draftConfig.location) return;
    set({ weatherLookupError: null });
    try {
      const travelPlannerService = getTravelPlannerService();
      const profile = await travelPlannerService.getTripWeather(draftConfig.location, draftConfig.startDate, draftConfig.endDate);
      const climate = travelPlannerService.deriveClimateType(profile);
      set((state) => ({ draftConfig: { ...state.draftConfig, weatherProfile: profile, climate } }));
    } catch (error) {
      set({ weatherLookupError: error instanceof Error ? error.message : 'Failed to fetch weather.' });
    }
  },

  addTraveler: () => {
    const traveler: Traveler = { id: defaultIdGenerator(), ageGroup: 'adult', style: 'unisex' };
    set((state) => ({
      draftConfig: { ...state.draftConfig, travelers: [...state.draftConfig.travelers, traveler] },
    }));
  },

  removeTraveler: (id) => {
    set((state) => ({
      draftConfig: {
        ...state.draftConfig,
        travelers: state.draftConfig.travelers.filter((t) => t.id !== id),
      },
    }));
  },

  updateTraveler: (id, partial) => {
    set((state) => ({
      draftConfig: {
        ...state.draftConfig,
        travelers: state.draftConfig.travelers.map((t) => (t.id === id ? { ...t, ...partial } : t)),
      },
    }));
  },

  selectAirline: (airlineId) => {
    // Convenience default only — checkedBags/cabinBags remain user-editable
    // counts and are not overwritten (see plan gap 14).
    set((state) => ({ draftConfig: { ...state.draftConfig, airlineId } }));
  },

  computePlan: () => {
    const plan = generatePackingPlan(get().draftConfig);
    set({ currentPlan: plan });
  },

  toggleItemPacked: (itemId) => {
    set((state) => {
      if (!state.currentPlan) return state;
      return {
        currentPlan: {
          ...state.currentPlan,
          items: state.currentPlan.items.map((item) =>
            item.id === itemId ? { ...item, packed: !item.packed } : item
          ),
        },
      };
    });
  },

  saveTrip: async (name) => {
    const { draftConfig, currentPlan, savedTrips } = get();
    if (!currentPlan) return;
    const trip: SavedTrip = {
      id: defaultIdGenerator(),
      name,
      config: draftConfig,
      plan: currentPlan,
      savedAt: new Date().toISOString(),
    };
    const nextSavedTrips = [...savedTrips, trip];
    set({ savedTrips: nextSavedTrips });
    await persistSavedTrips(nextSavedTrips);
  },

  loadTrip: (id) => {
    const trip = get().savedTrips.find((t) => t.id === id);
    if (!trip) return;
    set({ draftConfig: trip.config, currentPlan: trip.plan });
  },

  deleteTrip: async (id) => {
    const nextSavedTrips = get().savedTrips.filter((t) => t.id !== id);
    set({ savedTrips: nextSavedTrips });
    await persistSavedTrips(nextSavedTrips);
  },

  resetWizard: () => {
    set({ wizardStep: MIN_WIZARD_STEP, draftConfig: defaultDraftConfig(), currentPlan: null, weatherLookupError: null });
  },
}));
