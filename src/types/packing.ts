import type { LocationResult, WeatherProfile } from '../services/weather/types';

export type AgeGroup = 'adult' | 'child' | 'toddler' | 'infant';
export type StylePreference = 'masculine' | 'feminine' | 'unisex';
export type ActivityType =
  | 'beach'
  | 'hiking'
  | 'formal'
  | 'gym'
  | 'sightseeing'
  | 'work'
  | 'exploring'
  | 'nightlife';
export type ClimateType = 'warm' | 'mild' | 'cold' | 'rainy';
export type ToiletryStrategy = 'pack' | 'buy_on_arrival';

export interface Traveler {
  id: string;
  ageGroup: AgeGroup;
  style: StylePreference;
  sensitiveSkin?: boolean;
}

export interface TripConfig {
  destination: string;
  location?: LocationResult;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  airlineId?: string;
  climate: ClimateType;
  durationDays: number;
  weatherProfile?: WeatherProfile;
  travelers: Traveler[];
  checkedBags: number; // ~23kg capacity each
  cabinBags: number; // ~10kg capacity each
  laundryAvailable: boolean;
  reuseClothing: boolean;
  toiletryStrategy: ToiletryStrategy;
  activities: ActivityType[];
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'clothing' | 'toiletries' | 'footwear' | 'electronics' | 'essentials';
  quantity: number;
  estimatedWeightGrams: number;
  packed: boolean;
  excluded?: boolean;
  assignedTravelerId?: string;
  iconName?: string;
}

export interface BabyEssentialSpec {
  id: string;
  name: string;
  category: PackingItem['category'];
  iconName: string;
  quantityFormula: (effectiveDays: number) => number;
  baseWeightGrams: number;
  appliesWhen?: (config: TripConfig) => boolean;
}

export interface PackingPlan {
  items: PackingItem[];
  totalEstimatedWeightKg: number;
  maxAllowedWeightKg: number;
  isOverWeight: boolean;
  optimizationSuggestions: string[];
}
