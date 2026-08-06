import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PackingPlan, TripConfig } from '../types/packing';

export interface SavedTrip {
  id: string;
  name: string;
  config: TripConfig;
  plan: PackingPlan;
  savedAt: string;
}

const STORAGE_KEY = '@packmyholiday/savedTrips';
const CURRENT_SCHEMA_VERSION = 1;

interface PersistedPayload {
  schemaVersion: number;
  trips: SavedTrip[];
}

function migrate(raw: unknown): SavedTrip[] {
  if (!raw || typeof raw !== 'object') return [];
  const payload = raw as Partial<PersistedPayload>;
  // No-op migration path for the current schema version; future format
  // changes add version-specific branches here.
  if (Array.isArray(payload.trips)) {
    return payload.trips;
  }
  return [];
}

export async function loadSavedTrips(): Promise<SavedTrip[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return migrate(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function persistSavedTrips(trips: SavedTrip[]): Promise<void> {
  const payload: PersistedPayload = { schemaVersion: CURRENT_SCHEMA_VERSION, trips };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function clearSavedTrips(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
