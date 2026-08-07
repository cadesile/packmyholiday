import type { PackingPlan, TripConfig } from '../types/packing';
import type { SavedTrip } from '../state/storage';

export function hasTripChanged(loadedTrip: SavedTrip | null, config: TripConfig, plan: PackingPlan | null): boolean {
  if (!loadedTrip) return true;
  if (JSON.stringify(loadedTrip.config) !== JSON.stringify(config)) return true;
  if (JSON.stringify(loadedTrip.plan) !== JSON.stringify(plan)) return true;
  return false;
}
