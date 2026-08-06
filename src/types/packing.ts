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
  airlineId?: string;
  climate: ClimateType;
  durationDays: number;
  travelers: Traveler[];
  checkedBags: number; // ~23kg capacity each
  cabinBags: number; // ~10kg capacity each
  laundryAvailable: boolean;
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
  assignedTravelerId?: string;
  iconName?: string;
}

export interface PackingPlan {
  items: PackingItem[];
  totalEstimatedWeightKg: number;
  maxAllowedWeightKg: number;
  isOverWeight: boolean;
  optimizationSuggestions: string[];
}
