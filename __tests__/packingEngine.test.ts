import { generatePackingPlan, resolveFootwear } from '../src/utils/packingEngine';
import type { ActivityType, ClimateType, Traveler, TripConfig } from '../src/types/packing';

function makeStubIdGen() {
  let n = 0;
  return () => `id-${n++}`;
}

function makeTraveler(overrides: Partial<Traveler> = {}): Traveler {
  return { id: overrides.id ?? `t-${Math.random()}`, ageGroup: 'adult', style: 'unisex', ...overrides };
}

function makeConfig(overrides: Partial<TripConfig> = {}): TripConfig {
  return {
    destination: 'Test City',
    climate: 'mild' as ClimateType,
    durationDays: 5,
    travelers: [makeTraveler({ id: 'traveler-1' })],
    checkedBags: 2,
    cabinBags: 1,
    laundryAvailable: false,
    toiletryStrategy: 'pack',
    activities: [] as ActivityType[],
    ...overrides,
  };
}

function itemsFor(items: ReturnType<typeof generatePackingPlan>['items'], name: string) {
  return items.filter((i) => i.name === name);
}

describe('generatePackingPlan — baseline clothing formulas', () => {
  it.each([1, 4, 7, 10])('computes correct quantities for %i days (no laundry)', (days) => {
    const config = makeConfig({ durationDays: days });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    const ed = days;

    expect(itemsFor(plan.items, 'T-Shirt / Top')[0].quantity).toBe(ed + 1);
    expect(itemsFor(plan.items, 'Trousers / Bottoms')[0].quantity).toBe(Math.ceil(ed / 2) + 1);
    expect(itemsFor(plan.items, 'Underwear')[0].quantity).toBe(ed + 1);
    expect(itemsFor(plan.items, 'Socks')[0].quantity).toBe(ed + 1);
    expect(itemsFor(plan.items, 'Sleepwear')[0].quantity).toBe(Math.ceil(ed / 3));
  });

  it('clamps effective days to 5 when laundry is available, even for long trips', () => {
    const config = makeConfig({ durationDays: 14, laundryAvailable: true });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    const ed = 5;
    expect(itemsFor(plan.items, 'T-Shirt / Top')[0].quantity).toBe(ed + 1);
  });

  it('does not clamp when laundry is unavailable', () => {
    const config = makeConfig({ durationDays: 14, laundryAvailable: false });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, 'T-Shirt / Top')[0].quantity).toBe(15);
  });
});

describe('generatePackingPlan — demographic multipliers', () => {
  it('scales weight 1.0x / 0.5x / 0.25x for adult / child / infant', () => {
    const adultConfig = makeConfig({ travelers: [makeTraveler({ id: 'a', ageGroup: 'adult' })] });
    const childConfig = makeConfig({ travelers: [makeTraveler({ id: 'c', ageGroup: 'child' })] });
    const infantConfig = makeConfig({ travelers: [makeTraveler({ id: 'i', ageGroup: 'infant' })] });

    const adultTop = itemsFor(generatePackingPlan(adultConfig, { idGenerator: makeStubIdGen() }).items, 'T-Shirt / Top')[0];
    const childTop = itemsFor(generatePackingPlan(childConfig, { idGenerator: makeStubIdGen() }).items, 'T-Shirt / Top')[0];
    const infantTop = itemsFor(generatePackingPlan(infantConfig, { idGenerator: makeStubIdGen() }).items, 'T-Shirt / Top')[0];

    expect(childTop.estimatedWeightGrams).toBe(Math.round(adultTop.estimatedWeightGrams * 0.5));
    expect(infantTop.estimatedWeightGrams).toBe(Math.round(adultTop.estimatedWeightGrams * 0.25));
  });

  it('scales weight 0.35x for toddler, distinct from child (0.5x) and infant (0.25x)', () => {
    const adultConfig = makeConfig({ travelers: [makeTraveler({ id: 'a', ageGroup: 'adult' })] });
    const toddlerConfig = makeConfig({ travelers: [makeTraveler({ id: 't', ageGroup: 'toddler' })] });

    const adultTop = itemsFor(generatePackingPlan(adultConfig, { idGenerator: makeStubIdGen() }).items, 'T-Shirt / Top')[0];
    const toddlerTop = itemsFor(generatePackingPlan(toddlerConfig, { idGenerator: makeStubIdGen() }).items, 'T-Shirt / Top')[0];

    expect(toddlerTop.estimatedWeightGrams).toBe(Math.round(adultTop.estimatedWeightGrams * 0.35));
  });

  it('gives toddlers a heavier baseline shoe weight than infants but lighter than children', () => {
    const infantConfig = makeConfig({ travelers: [makeTraveler({ id: 'i', ageGroup: 'infant' })] });
    const toddlerConfig = makeConfig({ travelers: [makeTraveler({ id: 't', ageGroup: 'toddler' })] });
    const childConfig = makeConfig({ travelers: [makeTraveler({ id: 'c', ageGroup: 'child' })] });

    const infantShoe = itemsFor(generatePackingPlan(infantConfig, { idGenerator: makeStubIdGen() }).items, 'Everyday Shoes (worn)')[0];
    const toddlerShoe = itemsFor(generatePackingPlan(toddlerConfig, { idGenerator: makeStubIdGen() }).items, 'Everyday Shoes (worn)')[0];
    const childShoe = itemsFor(generatePackingPlan(childConfig, { idGenerator: makeStubIdGen() }).items, 'Everyday Shoes (worn)')[0];

    expect(toddlerShoe.estimatedWeightGrams).toBeGreaterThan(infantShoe.estimatedWeightGrams);
    expect(toddlerShoe.estimatedWeightGrams).toBeLessThan(childShoe.estimatedWeightGrams);
  });

  it('injects the fixed infant essentials pack, independent of the clothing multiplier', () => {
    const config = makeConfig({ travelers: [makeTraveler({ id: 'i', ageGroup: 'infant' })], durationDays: 6 });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    const diapers = itemsFor(plan.items, 'Diapers')[0];
    const wipes = itemsFor(plan.items, 'Baby Wipes (pack)')[0];
    const mat = itemsFor(plan.items, 'Changing Mat')[0];

    expect(diapers.quantity).toBe(6 * 6);
    expect(diapers.estimatedWeightGrams).toBe(15);
    expect(wipes.quantity).toBe(Math.ceil(6 / 3));
    expect(mat.quantity).toBe(1);
    expect(diapers.assignedTravelerId).toBe('i');
  });

  it('adds the expanded infant clothing/feeding items with correct categories and quantities', () => {
    const config = makeConfig({ travelers: [makeTraveler({ id: 'i', ageGroup: 'infant' })], durationDays: 6 });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });

    const onesies = itemsFor(plan.items, 'Onesies / Bodysuits')[0];
    expect(onesies.category).toBe('clothing');
    expect(onesies.quantity).toBe(Math.ceil(6 * 1.5) + 1);

    const sleepsuits = itemsFor(plan.items, 'Footed Sleepsuits')[0];
    expect(sleepsuits.quantity).toBe(Math.ceil(6 / 2) + 1);

    const formula = itemsFor(plan.items, 'Formula Powder (tin)')[0];
    expect(formula.category).toBe('essentials');
    expect(formula.quantity).toBe(Math.ceil(6 / 5) + 1);

    const muslins = itemsFor(plan.items, 'Muslin / Burp Cloths')[0];
    expect(muslins.quantity).toBe(6);

    const rashCream = itemsFor(plan.items, 'Diaper Rash Cream')[0];
    expect(rashCream.category).toBe('toiletries');
  });

  it('only adds swim diapers when the beach activity is selected', () => {
    const beachConfig = makeConfig({
      travelers: [makeTraveler({ id: 'i', ageGroup: 'infant' })],
      durationDays: 6,
      activities: ['beach'],
    });
    const noBeachConfig = makeConfig({
      travelers: [makeTraveler({ id: 'i', ageGroup: 'infant' })],
      durationDays: 6,
      activities: [],
    });

    const beachPlan = generatePackingPlan(beachConfig, { idGenerator: makeStubIdGen() });
    const noBeachPlan = generatePackingPlan(noBeachConfig, { idGenerator: makeStubIdGen() });

    expect(itemsFor(beachPlan.items, 'Swim Diapers')).toHaveLength(1);
    expect(itemsFor(noBeachPlan.items, 'Swim Diapers')).toHaveLength(0);
  });
});

describe('generatePackingPlan — climate modifiers', () => {
  it('adds jacket and thermal layers for cold climate', () => {
    const config = makeConfig({ climate: 'cold' });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, 'Jacket').length).toBe(1);
    expect(itemsFor(plan.items, 'Thermal Base Layer').length).toBe(1);
    expect(itemsFor(plan.items, 'Rain Jacket').length).toBe(0);
  });

  it('adds rain jacket and umbrella for rainy climate', () => {
    const config = makeConfig({ climate: 'rainy' });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, 'Rain Jacket').length).toBe(1);
    expect(itemsFor(plan.items, 'Travel Umbrella').length).toBe(1);
    expect(itemsFor(plan.items, 'Jacket').length).toBe(0);
  });

  it('adds no climate-specific items for warm/mild', () => {
    const warm = generatePackingPlan(makeConfig({ climate: 'warm' }), { idGenerator: makeStubIdGen() });
    const mild = generatePackingPlan(makeConfig({ climate: 'mild' }), { idGenerator: makeStubIdGen() });
    for (const plan of [warm, mild]) {
      expect(itemsFor(plan.items, 'Jacket').length).toBe(0);
      expect(itemsFor(plan.items, 'Rain Jacket').length).toBe(0);
    }
  });
});

describe('generatePackingPlan — activity modifiers', () => {
  it.each([
    ['beach', 'Swimwear'],
    ['formal', 'Formal Outfit'],
    ['nightlife', 'Going-Out Outfit'],
    ['gym', 'Gym Kit'],
    ['work', 'Work Outfit'],
  ] as [ActivityType, string][])('adds %s-specific item when %s is selected', (activity, expectedName) => {
    const plan = generatePackingPlan(makeConfig({ activities: [activity] }), { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, expectedName).length).toBeGreaterThan(0);
  });

  it('shares one day backpack across hiking/exploring/sightseeing rather than duplicating per traveler', () => {
    const config = makeConfig({
      travelers: [makeTraveler({ id: 'a' }), makeTraveler({ id: 'b' })],
      activities: ['hiking', 'exploring', 'sightseeing'],
    });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    const backpacks = itemsFor(plan.items, 'Day Backpack');
    expect(backpacks).toHaveLength(1);
    expect(backpacks[0].assignedTravelerId).toBeUndefined();
  });
});

describe('resolveFootwear — cap resolution', () => {
  it('gives 2 baseline pairs when no competing activity selected', () => {
    const result = resolveFootwear([]);
    expect(result.admittedItemIds).toEqual(['worn_baseline', 'packed_baseline']);
    expect(result.rejectedNotes).toHaveLength(0);
  });

  it('admits hiking boots as the 3rd pair when only hiking selected', () => {
    const result = resolveFootwear(['hiking']);
    expect(result.admittedItemIds).toEqual(['worn_baseline', 'packed_baseline', 'hiking_boots']);
  });

  it('prioritizes formal over hiking when both selected, and records the rejection', () => {
    const result = resolveFootwear(['hiking', 'formal']);
    expect(result.admittedItemIds).toEqual(['worn_baseline', 'packed_baseline', 'formal_shoes']);
    expect(result.rejectedNotes).toHaveLength(1);
    expect(result.rejectedNotes[0]).toMatch(/Hiking Boots/);
  });

  it('resolves a 3-way (formal + hiking + exploring) tie deterministically to formal, rejecting the other two', () => {
    const result = resolveFootwear(['exploring', 'hiking', 'formal']);
    expect(result.admittedItemIds).toEqual(['worn_baseline', 'packed_baseline', 'formal_shoes']);
    expect(result.rejectedNotes).toHaveLength(2);
  });

  it('falls back to sightseeing only when neither formal, hiking, nor exploring are selected', () => {
    const result = resolveFootwear(['sightseeing']);
    expect(result.admittedItemIds).toEqual(['worn_baseline', 'packed_baseline', 'sightseeing_shoes']);
  });
});

describe('generatePackingPlan — multi-traveler aggregation', () => {
  it('assigns per-traveler items correctly and counts shared items once', () => {
    const config = makeConfig({
      travelers: [
        makeTraveler({ id: 'adult-1', ageGroup: 'adult' }),
        makeTraveler({ id: 'child-1', ageGroup: 'child' }),
        makeTraveler({ id: 'infant-1', ageGroup: 'infant' }),
      ],
      activities: ['work'],
    });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });

    const tops = itemsFor(plan.items, 'T-Shirt / Top');
    expect(tops).toHaveLength(3);
    expect(tops.map((t) => t.assignedTravelerId).sort()).toEqual(['adult-1', 'child-1', 'infant-1']);

    const laptop = itemsFor(plan.items, 'Laptop & Charger');
    expect(laptop).toHaveLength(1);
    expect(laptop[0].assignedTravelerId).toBeUndefined();

    const expectedTotalGrams = plan.items.reduce((sum, i) => sum + i.estimatedWeightGrams * i.quantity, 0);
    expect(plan.totalEstimatedWeightKg).toBeCloseTo(expectedTotalGrams / 1000, 5);
  });
});

describe('generatePackingPlan — toiletryStrategy', () => {
  it('excludes packed toiletries and sunscreen weight when buy_on_arrival is selected', () => {
    const config = makeConfig({ toiletryStrategy: 'buy_on_arrival', activities: ['beach'] });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, 'Toothbrush')).toHaveLength(0);
    expect(itemsFor(plan.items, 'Sunscreen')).toHaveLength(0);
    expect(plan.optimizationSuggestions.some((s) => s.includes('buy on arrival'))).toBe(true);
  });

  it('includes packed toiletries and sunscreen when pack is selected', () => {
    const config = makeConfig({ toiletryStrategy: 'pack', activities: ['beach'] });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, 'Toothbrush')).toHaveLength(1);
    expect(itemsFor(plan.items, 'Sunscreen')).toHaveLength(1);
  });

  it('still includes unconditional health/bug items regardless of toiletryStrategy', () => {
    const config = makeConfig({ toiletryStrategy: 'buy_on_arrival', climate: 'warm' });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(plan.items.some((i) => i.name.includes('Insect Repellent'))).toBe(true);
  });
});

describe('generatePackingPlan — overweight detection', () => {
  it('flags isOverWeight and produces suggestions when weight exceeds capacity', () => {
    const config = makeConfig({
      checkedBags: 0,
      cabinBags: 1,
      travelers: [
        makeTraveler({ id: 'a1' }),
        makeTraveler({ id: 'a2' }),
        makeTraveler({ id: 'a3' }),
      ],
      durationDays: 20,
      laundryAvailable: false,
    });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(plan.isOverWeight).toBe(true);
    expect(plan.optimizationSuggestions.length).toBeGreaterThan(0);
  });

  it('does not flag isOverWeight for a light solo trip with ample baggage', () => {
    const plan = generatePackingPlan(makeConfig({ checkedBags: 2, cabinBags: 1 }), {
      idGenerator: makeStubIdGen(),
    });
    expect(plan.isOverWeight).toBe(false);
  });
});

describe('generatePackingPlan — edge cases', () => {
  it('returns a guarded empty plan for 0 travelers without throwing', () => {
    const plan = generatePackingPlan(makeConfig({ travelers: [] }), { idGenerator: makeStubIdGen() });
    expect(plan.items).toHaveLength(0);
    expect(plan.isOverWeight).toBe(false);
    expect(plan.optimizationSuggestions.length).toBeGreaterThan(0);
  });

  it('clamps zero/negative duration to 1 day rather than throwing or producing NaN', () => {
    const zero = generatePackingPlan(makeConfig({ durationDays: 0 }), { idGenerator: makeStubIdGen() });
    const negative = generatePackingPlan(makeConfig({ durationDays: -5 }), { idGenerator: makeStubIdGen() });
    for (const plan of [zero, negative]) {
      expect(plan.totalEstimatedWeightKg).toBeGreaterThan(0);
      expect(Number.isNaN(plan.totalEstimatedWeightKg)).toBe(false);
    }
  });

  it('handles a large duration (30+ days) without NaN/Infinity', () => {
    const plan = generatePackingPlan(makeConfig({ durationDays: 45 }), { idGenerator: makeStubIdGen() });
    expect(Number.isFinite(plan.totalEstimatedWeightKg)).toBe(true);
  });
});

describe('generatePackingPlan — determinism', () => {
  it('produces identical output given the same config and a stubbed idGenerator', () => {
    const config = makeConfig({ activities: ['beach', 'hiking'], climate: 'cold' });
    const planA = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    const planB = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(planA).toEqual(planB);
  });
});
