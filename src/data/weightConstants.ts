import type { AgeGroup } from '../types/packing';

export const CHECKED_BAG_CAPACITY_KG = 23;
export const CABIN_BAG_CAPACITY_KG = 10;

export const LAUNDRY_EFFECTIVE_DAYS_CAP = 5;
export const CLOTHING_REUSE_FACTOR = 0.7;

export const DEMOGRAPHIC_WEIGHT_MULTIPLIER: Record<AgeGroup, number> = {
  adult: 1.0,
  child: 0.5,
  toddler: 0.35,
  infant: 0.25,
};

export function demographicMultiplier(ageGroup: AgeGroup): number {
  return DEMOGRAPHIC_WEIGHT_MULTIPLIER[ageGroup];
}

export const FOOTWEAR_HARD_CAP = 3;
export const FOOTWEAR_BASELINE_PAIRS = 2;

// Priority order for the single competitive footwear slot (index 0 = wins ties).
export const FOOTWEAR_PRIORITY: ReadonlyArray<'formal' | 'hiking' | 'exploring' | 'sightseeing'> = [
  'formal',
  'hiking',
  'exploring',
  'sightseeing',
];

export const ADULT_SHOE_WEIGHT_GRAMS = 900;
export const CHILD_SHOE_WEIGHT_GRAMS = 400;

export const BASE_ITEM_WEIGHTS_GRAMS = {
  top: 180,
  bottom: 600,
  underwear: 60,
  socks: 40,
  sleepwear: 250,
} as const;

export const SUNSCREEN_SINGLE_DOSE_ML: Record<AgeGroup, number> = {
  adult: 30,
  child: 20,
  toddler: 15,
  infant: 10,
};

export const SUNSCREEN_DENSITY_G_PER_ML = 1.05;
export const SUNSCREEN_BOTTLE_SIZE_ML = 200;
export const CARRY_ON_LIQUID_LIMIT_ML = 100;
