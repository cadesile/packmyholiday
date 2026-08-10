import type { PackingItem, Traveler, TripConfig } from '../types/packing';
import { BASE_ITEM_WEIGHTS_GRAMS } from './weightConstants';

export interface EngineContext {
  config: TripConfig;
  traveler?: Traveler;
  effectiveDays?: number;
}

export interface CatalogEntry {
  id: string;
  name: string;
  category: PackingItem['category'];
  iconName: string;
  baseWeightGrams: number; // adult baseline; scaled by demographicMultiplier for perTraveler entries
  quantityFormula: (ctx: EngineContext) => number; // 0 = omit
  appliesWhen?: (ctx: EngineContext) => boolean; // climate/activity/strategy gate
  perTraveler: boolean; // true = generated once per traveler, false = once per trip
}

const isPacking = (ctx: EngineContext) => ctx.config.toiletryStrategy === 'pack';
const hasActivity = (ctx: EngineContext, activity: string) => ctx.config.activities.includes(activity as never);

export const CATALOG_ENTRIES: CatalogEntry[] = [
  // --- Core clothing (per traveler, always applies) ---
  {
    id: 'top_tshirt',
    name: 'T-Shirt / Top',
    category: 'clothing',
    iconName: 'tshirt-crew-outline',
    baseWeightGrams: BASE_ITEM_WEIGHTS_GRAMS.top,
    perTraveler: true,
    quantityFormula: (ctx) => (ctx.effectiveDays ?? 0) + 1,
  },
  {
    id: 'bottom_trousers',
    name: 'Trousers / Bottoms',
    category: 'clothing',
    iconName: 'human',
    baseWeightGrams: BASE_ITEM_WEIGHTS_GRAMS.bottom,
    perTraveler: true,
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 2) + 1,
  },
  {
    id: 'underwear',
    name: 'Underwear',
    category: 'clothing',
    iconName: 'tshirt-crew',
    baseWeightGrams: BASE_ITEM_WEIGHTS_GRAMS.underwear,
    perTraveler: true,
    quantityFormula: (ctx) => (ctx.effectiveDays ?? 0) + 1,
  },
  {
    id: 'socks',
    name: 'Socks',
    category: 'clothing',
    iconName: 'sock',
    baseWeightGrams: BASE_ITEM_WEIGHTS_GRAMS.socks,
    perTraveler: true,
    quantityFormula: (ctx) => (ctx.effectiveDays ?? 0) + 1,
  },
  {
    id: 'sleepwear',
    name: 'Sleepwear',
    category: 'clothing',
    iconName: 'weather-night',
    baseWeightGrams: BASE_ITEM_WEIGHTS_GRAMS.sleepwear,
    perTraveler: true,
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 3),
  },

  // --- Climate modifiers (per traveler) ---
  {
    id: 'jacket_cold',
    name: 'Jacket',
    category: 'clothing',
    iconName: 'coat-rack',
    baseWeightGrams: 700,
    perTraveler: true,
    appliesWhen: (ctx) => ctx.config.climate === 'cold',
    quantityFormula: (ctx) => Math.min(2, Math.ceil((ctx.effectiveDays ?? 0) / 3)),
  },
  {
    id: 'thermal_base_layer',
    name: 'Thermal Base Layer',
    category: 'clothing',
    iconName: 'tshirt-v-outline',
    baseWeightGrams: 220,
    perTraveler: true,
    appliesWhen: (ctx) => ctx.config.climate === 'cold',
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 3),
  },
  {
    id: 'rain_jacket',
    name: 'Rain Jacket',
    category: 'clothing',
    iconName: 'weather-pouring',
    baseWeightGrams: 450,
    perTraveler: true,
    appliesWhen: (ctx) => ctx.config.climate === 'rainy',
    quantityFormula: () => 1,
  },
  {
    id: 'travel_umbrella',
    name: 'Travel Umbrella',
    category: 'essentials',
    iconName: 'umbrella-outline',
    baseWeightGrams: 300,
    perTraveler: true,
    appliesWhen: (ctx) => ctx.config.climate === 'rainy',
    quantityFormula: () => 1,
  },

  // --- Activity modifiers (non-footwear) ---
  {
    id: 'swimwear',
    name: 'Swimwear',
    category: 'clothing',
    iconName: 'swim',
    baseWeightGrams: 180,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'beach'),
    quantityFormula: () => 2,
  },
  {
    id: 'beach_towel',
    name: 'Beach Towel',
    category: 'essentials',
    iconName: 'towel',
    baseWeightGrams: 400,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'beach'),
    quantityFormula: () => 1,
  },
  {
    id: 'hiking_socks',
    name: 'Hiking Socks',
    category: 'clothing',
    iconName: 'sock',
    baseWeightGrams: 60,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'hiking'),
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 3),
  },
  {
    id: 'day_backpack',
    name: 'Day Backpack',
    category: 'essentials',
    iconName: 'bag-personal-outline',
    baseWeightGrams: 900,
    perTraveler: false,
    appliesWhen: (ctx) =>
      hasActivity(ctx, 'hiking') || hasActivity(ctx, 'exploring') || hasActivity(ctx, 'sightseeing'),
    quantityFormula: () => 1,
  },
  {
    id: 'formal_outfit',
    name: 'Formal Outfit',
    category: 'clothing',
    iconName: 'tie',
    baseWeightGrams: 500,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'formal'),
    quantityFormula: () => 1,
  },
  {
    id: 'nightlife_outfit',
    name: 'Going-Out Outfit',
    category: 'clothing',
    iconName: 'party-popper',
    baseWeightGrams: 400,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'nightlife'),
    quantityFormula: () => 1,
  },
  {
    id: 'styling_tools',
    name: 'Styling Tools',
    category: 'electronics',
    iconName: 'hair-dryer',
    baseWeightGrams: 300,
    perTraveler: false,
    appliesWhen: (ctx) => hasActivity(ctx, 'nightlife'),
    quantityFormula: () => 1,
  },
  {
    id: 'gym_kit',
    name: 'Gym Kit',
    category: 'clothing',
    iconName: 'dumbbell',
    baseWeightGrams: 250,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'gym'),
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 4),
  },
  {
    id: 'work_outfit',
    name: 'Work Outfit',
    category: 'clothing',
    iconName: 'briefcase-outline',
    baseWeightGrams: 450,
    perTraveler: true,
    appliesWhen: (ctx) => hasActivity(ctx, 'work'),
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 3),
  },
  {
    id: 'laptop_accessories',
    name: 'Laptop & Charger',
    category: 'electronics',
    iconName: 'laptop',
    baseWeightGrams: 500,
    perTraveler: false,
    appliesWhen: (ctx) => hasActivity(ctx, 'work'),
    quantityFormula: () => 1,
  },

  // --- Toiletries (per traveler, gated by toiletryStrategy) ---
  {
    id: 'toothbrush',
    name: 'Toothbrush',
    category: 'toiletries',
    iconName: 'toothbrush',
    baseWeightGrams: 20,
    perTraveler: true,
    appliesWhen: isPacking,
    quantityFormula: () => 1,
  },
  {
    id: 'toothpaste',
    name: 'Toothpaste',
    category: 'toiletries',
    iconName: 'tube-outline',
    baseWeightGrams: 100,
    perTraveler: true,
    appliesWhen: isPacking,
    quantityFormula: (ctx) => Math.ceil((ctx.effectiveDays ?? 0) / 10) + 1,
  },
  {
    id: 'shampoo_bar',
    name: 'Shampoo Bar',
    category: 'toiletries',
    iconName: 'shower',
    baseWeightGrams: 90,
    perTraveler: true,
    appliesWhen: isPacking,
    quantityFormula: () => 1,
  },
  {
    id: 'deodorant',
    name: 'Deodorant',
    category: 'toiletries',
    iconName: 'spray-bottle',
    baseWeightGrams: 50,
    perTraveler: true,
    appliesWhen: isPacking,
    quantityFormula: () => 1,
  },

  // --- Shared essentials/electronics (once per trip) ---
  {
    id: 'universal_adapter',
    name: 'Universal Travel Adapter',
    category: 'electronics',
    iconName: 'power-plug-outline',
    baseWeightGrams: 150,
    perTraveler: false,
    quantityFormula: () => 1,
  },
  {
    id: 'first_aid_kit',
    name: 'First Aid Kit',
    category: 'essentials',
    iconName: 'medical-bag',
    baseWeightGrams: 200,
    perTraveler: false,
    quantityFormula: () => 1,
  },
  {
    id: 'passport_wallet',
    name: 'Passport Wallet',
    category: 'essentials',
    iconName: 'passport',
    baseWeightGrams: 150,
    perTraveler: false,
    quantityFormula: () => 1,
  },
  {
    id: 'phone_charger',
    name: 'Phone Charger',
    category: 'electronics',
    iconName: 'cellphone-charging',
    baseWeightGrams: 100,
    perTraveler: true,
    quantityFormula: () => 1,
  },

  // --- Makeup & Beauty (Feminine travelers + Formal/Nightlife) ---
  {
    id: 'makeup_cosmetics_kit',
    name: 'Makeup & Cosmetics Pouch',
    category: 'toiletries',
    iconName: 'palette-swatch-outline',
    baseWeightGrams: 250,
    perTraveler: true,
    appliesWhen: (ctx) =>
      ctx.traveler?.style === 'feminine' &&
      (hasActivity(ctx, 'formal') || hasActivity(ctx, 'nightlife')) &&
      isPacking(ctx),
    quantityFormula: () => 1,
  },
  {
    id: 'makeup_remover_cleanser',
    name: 'Makeup Remover / Cleanser',
    category: 'toiletries',
    iconName: 'spray-bottle',
    baseWeightGrams: 120,
    perTraveler: true,
    appliesWhen: (ctx) =>
      ctx.traveler?.style === 'feminine' &&
      (hasActivity(ctx, 'formal') || hasActivity(ctx, 'nightlife')) &&
      isPacking(ctx),
    quantityFormula: () => 1,
  },
];

export interface FootwearItemSpec {
  id: string;
  name: string;
  iconName: string;
}

export const FOOTWEAR_ITEMS: Record<string, FootwearItemSpec> = {
  worn_baseline: { id: 'worn_baseline', name: 'Everyday Shoes (worn)', iconName: 'shoe-sneaker' },
  packed_baseline: { id: 'packed_baseline', name: 'Everyday Shoes (packed)', iconName: 'shoe-sneaker' },
  formal_shoes: { id: 'formal_shoes', name: 'Formal Shoes', iconName: 'shoe-formal' },
  hiking_boots: { id: 'hiking_boots', name: 'Hiking Boots', iconName: 'shoe-print' },
  exploring_shoes: { id: 'exploring_shoes', name: 'Comfortable Walking Shoes', iconName: 'walk' },
  sightseeing_shoes: { id: 'sightseeing_shoes', name: 'Comfortable Walking Shoes', iconName: 'walk' },
};
