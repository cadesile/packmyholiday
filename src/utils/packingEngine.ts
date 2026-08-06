import type { ActivityType, AgeGroup, PackingItem, PackingPlan, Traveler, TripConfig } from '../types/packing';
import { CATALOG_ENTRIES, FOOTWEAR_ITEMS, type CatalogEntry, type EngineContext } from '../data/itemCatalog';
import { INFANT_ESSENTIALS } from '../data/infantEssentials';
import { TODDLER_ESSENTIALS } from '../data/toddlerEssentials';
import { BABY_FAMILY_GEAR } from '../data/babyFamilyGear';
import {
  ADULT_SHOE_WEIGHT_GRAMS,
  CABIN_BAG_CAPACITY_KG,
  CHECKED_BAG_CAPACITY_KG,
  CHILD_SHOE_WEIGHT_GRAMS,
  FOOTWEAR_BASELINE_PAIRS,
  FOOTWEAR_HARD_CAP,
  FOOTWEAR_PRIORITY,
  LAUNDRY_EFFECTIVE_DAYS_CAP,
  demographicMultiplier,
} from '../data/weightConstants';
import { defaultIdGenerator, type IdGenerator } from './id';
import { roundQty, roundWeight } from './rounding';
import { calculateSunscreenRequirements } from './sunscreenEngine';
import { generateHealthAndBugItems } from './healthEngine';

export interface GeneratePackingPlanDeps {
  idGenerator?: IdGenerator;
  catalog?: CatalogEntry[];
}

type FootwearPriorityActivity = (typeof FOOTWEAR_PRIORITY)[number];

const FOOTWEAR_ITEM_ID_BY_ACTIVITY: Record<FootwearPriorityActivity, string> = {
  formal: 'formal_shoes',
  hiking: 'hiking_boots',
  exploring: 'exploring_shoes',
  sightseeing: 'sightseeing_shoes',
};

interface FootwearResolution {
  admittedItemIds: string[]; // includes the two baseline pairs
  rejectedNotes: string[];
}

export function resolveFootwear(activities: ActivityType[]): FootwearResolution {
  const candidates = FOOTWEAR_PRIORITY.filter((activity) => activities.includes(activity));
  const admitCount = Math.max(0, FOOTWEAR_HARD_CAP - FOOTWEAR_BASELINE_PAIRS);
  const admitted = candidates.slice(0, admitCount);
  const rejected = candidates.slice(admitCount);

  const admittedItemIds = ['worn_baseline', 'packed_baseline', ...admitted.map((a) => FOOTWEAR_ITEM_ID_BY_ACTIVITY[a])];

  const winnerName = admitted.length > 0 ? FOOTWEAR_ITEMS[FOOTWEAR_ITEM_ID_BY_ACTIVITY[admitted[0]]].name : undefined;
  const rejectedNotes = rejected.map((activity) => {
    const item = FOOTWEAR_ITEMS[FOOTWEAR_ITEM_ID_BY_ACTIVITY[activity]];
    return `${item.name} omitted — 3-pair footwear cap reached${winnerName ? ` (${winnerName} prioritized)` : ''}.`;
  });

  return { admittedItemIds, rejectedNotes };
}

function shoeWeightForAgeGroup(ageGroup: AgeGroup): number {
  if (ageGroup === 'adult') return ADULT_SHOE_WEIGHT_GRAMS;
  if (ageGroup === 'child') return CHILD_SHOE_WEIGHT_GRAMS;
  if (ageGroup === 'toddler') return roundWeight(CHILD_SHOE_WEIGHT_GRAMS * 0.65);
  return roundWeight(CHILD_SHOE_WEIGHT_GRAMS * 0.5);
}

function computeMaxWeightKg(config: TripConfig): number {
  return config.checkedBags * CHECKED_BAG_CAPACITY_KG + config.cabinBags * CABIN_BAG_CAPACITY_KG;
}

export function sumWeightKg(items: PackingItem[]): number {
  return roundWeight(items.reduce((sum, item) => sum + item.estimatedWeightGrams * item.quantity, 0)) / 1000;
}

function runOverweightSuggestionRules(config: TripConfig, items: PackingItem[]): string[] {
  const suggestions: string[] = [];

  if (!config.laundryAvailable && config.durationDays > LAUNDRY_EFFECTIVE_DAYS_CAP) {
    suggestions.push("Toggle 'Laundry Available' to cut clothing volume for longer trips.");
  }

  if (config.toiletryStrategy === 'pack') {
    const toiletriesWeightKg =
      items
        .filter((item) => item.category === 'toiletries')
        .reduce((sum, item) => sum + item.estimatedWeightGrams * item.quantity, 0) / 1000;
    if (toiletriesWeightKg > 0.5) {
      suggestions.push('Buy liquid toiletries at destination rather than packing them.');
    }
  }

  if (config.checkedBags < config.travelers.length) {
    suggestions.push('Consider upgrading your checked baggage allowance.');
  }

  return suggestions;
}

export function generatePackingPlan(config: TripConfig, deps: GeneratePackingPlanDeps = {}): PackingPlan {
  const idGen = deps.idGenerator ?? defaultIdGenerator;
  const catalog = deps.catalog ?? CATALOG_ENTRIES;

  const maxAllowedWeightKg = computeMaxWeightKg(config);
  const travelers: Traveler[] = config.travelers ?? [];

  if (travelers.length === 0) {
    return {
      items: [],
      totalEstimatedWeightKg: 0,
      maxAllowedWeightKg,
      isOverWeight: false,
      optimizationSuggestions: ['Add at least one traveler to generate a plan.'],
    };
  }

  const durationDays = Math.max(1, config.durationDays || 1);
  const effectiveDays = config.laundryAvailable ? Math.min(durationDays, LAUNDRY_EFFECTIVE_DAYS_CAP) : durationDays;

  const items: PackingItem[] = [];
  const footwear = resolveFootwear(config.activities);

  for (const traveler of travelers) {
    const ctx: EngineContext = { config, traveler, effectiveDays };
    const multiplier = demographicMultiplier(traveler.ageGroup);

    for (const entry of catalog) {
      if (!entry.perTraveler) continue;
      if (entry.appliesWhen && !entry.appliesWhen(ctx)) continue;
      const quantity = roundQty(entry.quantityFormula(ctx));
      if (quantity <= 0) continue;
      items.push({
        id: idGen(),
        name: entry.name,
        category: entry.category,
        quantity,
        estimatedWeightGrams: roundWeight(entry.baseWeightGrams * multiplier),
        packed: false,
        assignedTravelerId: traveler.id,
        iconName: entry.iconName,
      });
    }

    const shoeWeight = shoeWeightForAgeGroup(traveler.ageGroup);
    for (const itemId of footwear.admittedItemIds) {
      const spec = FOOTWEAR_ITEMS[itemId];
      items.push({
        id: idGen(),
        name: spec.name,
        category: 'footwear',
        quantity: 1,
        estimatedWeightGrams: roundWeight(shoeWeight),
        packed: false,
        assignedTravelerId: traveler.id,
        iconName: spec.iconName,
      });
    }

    if (traveler.ageGroup === 'infant') {
      for (const spec of INFANT_ESSENTIALS) {
        if (spec.appliesWhen && !spec.appliesWhen(config)) continue;
        const quantity = roundQty(spec.quantityFormula(effectiveDays));
        if (quantity <= 0) continue;
        items.push({
          id: idGen(),
          name: spec.name,
          category: spec.category,
          quantity,
          estimatedWeightGrams: roundWeight(spec.baseWeightGrams),
          packed: false,
          assignedTravelerId: traveler.id,
          iconName: spec.iconName,
        });
      }
    }

    if (traveler.ageGroup === 'toddler') {
      for (const spec of TODDLER_ESSENTIALS) {
        if (spec.appliesWhen && !spec.appliesWhen(config)) continue;
        const quantity = roundQty(spec.quantityFormula(effectiveDays));
        if (quantity <= 0) continue;
        items.push({
          id: idGen(),
          name: spec.name,
          category: spec.category,
          quantity,
          estimatedWeightGrams: roundWeight(spec.baseWeightGrams),
          packed: false,
          assignedTravelerId: traveler.id,
          iconName: spec.iconName,
        });
      }
    }
  }

  const hasBabyTraveler = travelers.some((t) => t.ageGroup === 'infant' || t.ageGroup === 'toddler');
  if (hasBabyTraveler) {
    for (const spec of BABY_FAMILY_GEAR) {
      const quantity = roundQty(spec.quantityFormula());
      if (quantity <= 0) continue;
      items.push({
        id: idGen(),
        name: spec.name,
        category: spec.category,
        quantity,
        estimatedWeightGrams: roundWeight(spec.baseWeightGrams),
        packed: false,
        iconName: spec.iconName,
      });
    }
  }

  const sharedCtx: EngineContext = { config };
  for (const entry of catalog) {
    if (entry.perTraveler) continue;
    if (entry.appliesWhen && !entry.appliesWhen(sharedCtx)) continue;
    const quantity = roundQty(entry.quantityFormula(sharedCtx));
    if (quantity <= 0) continue;
    items.push({
      id: idGen(),
      name: entry.name,
      category: entry.category,
      quantity,
      estimatedWeightGrams: roundWeight(entry.baseWeightGrams),
      packed: false,
      iconName: entry.iconName,
    });
  }

  const suggestions: string[] = [...footwear.rejectedNotes];

  if (config.toiletryStrategy === 'pack') {
    const isCarryOnOnly = config.checkedBags === 0;
    const sunscreen = calculateSunscreenRequirements(travelers, config.activities, durationDays, isCarryOnOnly, config.climate);
    if (sunscreen.totalVolumeMl > 0) {
      items.push({
        id: idGen(),
        name: 'Sunscreen',
        category: 'toiletries',
        quantity: sunscreen.bottleCount200ml,
        estimatedWeightGrams: sunscreen.totalWeightGrams,
        packed: false,
        iconName: 'sunglasses',
      });
      suggestions.push(sunscreen.recommendationNote);
    }
  } else {
    suggestions.push('Toiletries: buy on arrival — not included in packed weight.');
  }

  items.push(...generateHealthAndBugItems(config.climate, config.activities, travelers.length, idGen));

  const totalEstimatedWeightKg = sumWeightKg(items);

  const isOverWeight = totalEstimatedWeightKg > maxAllowedWeightKg;
  if (isOverWeight) {
    suggestions.push(...runOverweightSuggestionRules(config, items));
  }

  return {
    items,
    totalEstimatedWeightKg,
    maxAllowedWeightKg,
    isOverWeight,
    optimizationSuggestions: suggestions,
  };
}
