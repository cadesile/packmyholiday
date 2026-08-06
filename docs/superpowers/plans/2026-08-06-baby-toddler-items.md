# Baby & Toddler Packing Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `toddler` age group and expand the generated packing items for babies/toddlers (0-3yr) across clothing, diapering, feeding, travel gear, and health/carry-on essentials.

**Architecture:** Extends the existing per-age-group catalog pattern already used for `infant` (`src/data/infantEssentials.ts` → injected in `src/utils/packingEngine.ts`). Adds a sibling `toddlerEssentials.ts` data file, a `babyFamilyGear.ts` shared-item data file, a new `toddler` value in the `AgeGroup` union, and three new injection blocks in `generatePackingPlan`. No changes to `PackingItem`, `itemCatalog.ts`, or `OutputScreen.tsx` — new items ride the existing 5-tab category system.

**Tech Stack:** TypeScript, React Native/Expo, Jest (`jest-expo` preset), `react-native-paper`.

## Global Constraints

- Baby/toddler item weights are **absolute** (unit gram weights), never multiplied by `demographicMultiplier` — this mirrors the existing comment in `infantEssentials.ts`: "Not subject to the demographic clothing multiplier — these are absolute-quantity items."
- `AgeGroup` order in UI: Adult / Child / Toddler / Infant (`TravelerCard.tsx`).
- `DEMOGRAPHIC_WEIGHT_MULTIPLIER.toddler = 0.35` (between infant `0.25` and child `0.5`).
- `SUNSCREEN_SINGLE_DOSE_ML.toddler = 15` (between infant `10` and child `20`).
- Toddler shoe weight = `CHILD_SHOE_WEIGHT_GRAMS * 0.65`; infant shoe weight stays `CHILD_SHOE_WEIGHT_GRAMS * 0.5`.
- No new `PackingItem.category` values — reuse `clothing | toiletries | footwear | electronics | essentials`.
- Family gear items (stroller, carrier, blackout blind, monitor, health kit) generate **once per trip** if any traveler is `infant` or `toddler` — never once per baby traveler.
- Existing infant item ids/names/quantities/weights (`infant_diapers` "Diapers", `infant_wipes` "Baby Wipes (pack)", `infant_changing_mat` "Changing Mat") must not change — existing tests assert on them.
- Run tests with `npx jest __tests__/packingEngine.test.ts`.

---

### Task 1: Add `toddler` age group (types, weight constants, shoe weight, UI)

**Files:**
- Modify: `src/types/packing.ts:1`
- Modify: `src/data/weightConstants.ts:8-16,40-44`
- Modify: `src/utils/packingEngine.ts:56-60`
- Modify: `src/components/TravelerCard.tsx:15-19`
- Test: `__tests__/packingEngine.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `AgeGroup = 'adult' | 'child' | 'toddler' | 'infant'`, `DEMOGRAPHIC_WEIGHT_MULTIPLIER.toddler`, `SUNSCREEN_SINGLE_DOSE_ML.toddler`, `shoeWeightForAgeGroup` handling `'toddler'` explicitly. Tasks 2-4 rely on `AgeGroup` including `'toddler'`.

- [ ] **Step 1: Write the failing test for demographic + shoe weight scaling**

Add to `__tests__/packingEngine.test.ts`, inside the existing `describe('generatePackingPlan — demographic multipliers', ...)` block (after the existing `it('scales weight 1.0x / 0.5x / 0.25x ...)` test):

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/packingEngine.test.ts -t "toddler"`
Expected: FAIL — TypeScript error or wrong multiplier, since `'toddler'` is not yet a valid `AgeGroup` and no multiplier/shoe-weight branch exists.

- [ ] **Step 3: Add `toddler` to `AgeGroup`**

In `src/types/packing.ts`, change line 1:

```ts
export type AgeGroup = 'adult' | 'child' | 'toddler' | 'infant';
```

- [ ] **Step 4: Add `toddler` weight constants**

In `src/data/weightConstants.ts`, update `DEMOGRAPHIC_WEIGHT_MULTIPLIER` (lines 8-12):

```ts
export const DEMOGRAPHIC_WEIGHT_MULTIPLIER: Record<AgeGroup, number> = {
  adult: 1.0,
  child: 0.5,
  toddler: 0.35,
  infant: 0.25,
};
```

And update `SUNSCREEN_SINGLE_DOSE_ML` (lines 40-44):

```ts
export const SUNSCREEN_SINGLE_DOSE_ML: Record<AgeGroup, number> = {
  adult: 30,
  child: 20,
  toddler: 15,
  infant: 10,
};
```

- [ ] **Step 5: Add the toddler shoe-weight branch**

In `src/utils/packingEngine.ts`, replace the `shoeWeightForAgeGroup` function (lines 56-60):

```ts
function shoeWeightForAgeGroup(ageGroup: AgeGroup): number {
  if (ageGroup === 'adult') return ADULT_SHOE_WEIGHT_GRAMS;
  if (ageGroup === 'child') return CHILD_SHOE_WEIGHT_GRAMS;
  if (ageGroup === 'toddler') return roundWeight(CHILD_SHOE_WEIGHT_GRAMS * 0.65);
  return roundWeight(CHILD_SHOE_WEIGHT_GRAMS * 0.5);
}
```

- [ ] **Step 6: Add the Toddler option to the traveler UI**

In `src/components/TravelerCard.tsx`, update `AGE_GROUP_OPTIONS` (lines 15-19):

```ts
const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'toddler', label: 'Toddler' },
  { value: 'infant', label: 'Infant' },
];
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx jest __tests__/packingEngine.test.ts`
Expected: PASS (all tests, including the two new ones).

- [ ] **Step 8: Commit**

```bash
git add src/types/packing.ts src/data/weightConstants.ts src/utils/packingEngine.ts src/components/TravelerCard.tsx __tests__/packingEngine.test.ts
git commit -m "feat: add toddler age group with weight and shoe scaling"
```

---

### Task 2: Extend the baby essential spec shape and expand infant items

**Files:**
- Modify: `src/types/packing.ts` (add `BabyEssentialSpec` interface)
- Modify: `src/data/infantEssentials.ts` (rewrite using new shape, add new items)
- Modify: `src/utils/packingEngine.ts` (update the infant injection block to use `category`/`appliesWhen`)
- Test: `__tests__/packingEngine.test.ts`

**Interfaces:**
- Consumes: `AgeGroup`, `PackingItem['category']`, `TripConfig` from `src/types/packing.ts` (Task 1 already lands `AgeGroup`).
- Produces: `BabyEssentialSpec` interface (exported from `src/types/packing.ts`) — `{ id: string; name: string; category: PackingItem['category']; iconName: string; quantityFormula: (effectiveDays: number) => number; baseWeightGrams: number; appliesWhen?: (config: TripConfig) => boolean }`. Task 3 reuses this exact interface for `TODDLER_ESSENTIALS`.

- [ ] **Step 1: Write the failing test for expanded infant items**

Add to `__tests__/packingEngine.test.ts`, inside `describe('generatePackingPlan — demographic multipliers', ...)` (after the existing infant-essentials test):

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/packingEngine.test.ts -t "infant"`
Expected: FAIL — item names like `'Onesies / Bodysuits'`, `'Formula Powder (tin)'` don't exist yet.

- [ ] **Step 3: Add the `BabyEssentialSpec` interface**

In `src/types/packing.ts`, after the `PackingItem` interface (after line 44), add:

```ts

export interface BabyEssentialSpec {
  id: string;
  name: string;
  category: PackingItem['category'];
  iconName: string;
  quantityFormula: (effectiveDays: number) => number;
  baseWeightGrams: number;
  appliesWhen?: (config: TripConfig) => boolean;
}
```

- [ ] **Step 4: Rewrite `infantEssentials.ts` with the expanded item set**

Replace the full contents of `src/data/infantEssentials.ts`:

```ts
import type { BabyEssentialSpec } from '../types/packing';

// Fixed-quantity infant (0-12mo) pack. Not subject to the demographic clothing
// multiplier — these are absolute-quantity items, not clothing derivatives.
export const INFANT_ESSENTIALS: BabyEssentialSpec[] = [
  {
    id: 'infant_onesie',
    name: 'Onesies / Bodysuits',
    category: 'clothing',
    iconName: 'tshirt-crew-outline',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays * 1.5) + 1,
    baseWeightGrams: 60,
  },
  {
    id: 'infant_sleepsuit',
    name: 'Footed Sleepsuits',
    category: 'clothing',
    iconName: 'weather-night',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 2) + 1,
    baseWeightGrams: 120,
  },
  {
    id: 'infant_sun_hat',
    name: 'Sun Hat (wide brim)',
    category: 'clothing',
    iconName: 'hat-fedora',
    quantityFormula: () => 1,
    baseWeightGrams: 30,
  },
  {
    id: 'infant_stroller_blanket',
    name: 'Stroller Blanket',
    category: 'essentials',
    iconName: 'blanket',
    quantityFormula: () => 1,
    baseWeightGrams: 250,
  },
  {
    id: 'infant_diapers',
    name: 'Diapers',
    category: 'essentials',
    iconName: 'baby-face-outline',
    quantityFormula: (effectiveDays) => effectiveDays * 6,
    baseWeightGrams: 15,
  },
  {
    id: 'infant_swim_diaper',
    name: 'Swim Diapers',
    category: 'essentials',
    iconName: 'swim',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 3),
    baseWeightGrams: 20,
    appliesWhen: (config) => config.activities.includes('beach'),
  },
  {
    id: 'infant_wipes',
    name: 'Baby Wipes (pack)',
    category: 'essentials',
    iconName: 'water-outline',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 3),
    baseWeightGrams: 350,
  },
  {
    id: 'infant_rash_cream',
    name: 'Diaper Rash Cream',
    category: 'toiletries',
    iconName: 'tube-outline',
    quantityFormula: () => 1,
    baseWeightGrams: 75,
  },
  {
    id: 'infant_changing_mat',
    name: 'Changing Mat',
    category: 'essentials',
    iconName: 'crop-portrait',
    quantityFormula: () => 1,
    baseWeightGrams: 300,
  },
  {
    id: 'infant_wet_bags',
    name: 'Wet/Soiled Clothes Bags',
    category: 'essentials',
    iconName: 'bag-personal-outline',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 2),
    baseWeightGrams: 15,
  },
  {
    id: 'infant_bottles',
    name: 'Bottles, Nipples & Brush',
    category: 'essentials',
    iconName: 'baby-bottle-outline',
    quantityFormula: () => 3,
    baseWeightGrams: 120,
  },
  {
    id: 'infant_formula',
    name: 'Formula Powder (tin)',
    category: 'essentials',
    iconName: 'jar',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 5) + 1,
    baseWeightGrams: 900,
  },
  {
    id: 'infant_sterilizing',
    name: 'Sterilizing Tablets/Bags',
    category: 'toiletries',
    iconName: 'flask-outline',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 5),
    baseWeightGrams: 100,
  },
  {
    id: 'infant_muslins',
    name: 'Muslin / Burp Cloths',
    category: 'clothing',
    iconName: 'square-outline',
    quantityFormula: () => 6,
    baseWeightGrams: 50,
  },
  {
    id: 'infant_bibs',
    name: 'Silicone Bibs',
    category: 'essentials',
    iconName: 'tshirt-crew',
    quantityFormula: () => 2,
    baseWeightGrams: 40,
  },
  {
    id: 'infant_sippy_cup',
    name: 'Sippy Cup',
    category: 'essentials',
    iconName: 'cup-outline',
    quantityFormula: () => 1,
    baseWeightGrams: 80,
  },
  {
    id: 'infant_spoon_bowl',
    name: 'Travel Spoon & Bowl',
    category: 'essentials',
    iconName: 'silverware-spoon',
    quantityFormula: () => 1,
    baseWeightGrams: 60,
  },
  {
    id: 'infant_weaning_snacks',
    name: 'Weaning Snack Pouches',
    category: 'essentials',
    iconName: 'food-apple-outline',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 2),
    baseWeightGrams: 100,
  },
  {
    id: 'infant_pacifiers',
    name: 'Pacifiers (with clip)',
    category: 'essentials',
    iconName: 'circle-outline',
    quantityFormula: () => 4,
    baseWeightGrams: 20,
  },
  {
    id: 'infant_comfort_item',
    name: 'Comfort Item / Lovey',
    category: 'essentials',
    iconName: 'teddy-bear',
    quantityFormula: () => 1,
    baseWeightGrams: 150,
  },
];
```

- [ ] **Step 5: Update the infant injection block in `packingEngine.ts`**

In `src/utils/packingEngine.ts`, replace the `if (traveler.ageGroup === 'infant') { ... }` block (lines 149-164):

```ts
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
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest __tests__/packingEngine.test.ts`
Expected: PASS (all tests, including the two new ones and the pre-existing infant-essentials test, which is unaffected since ids/names/formulas for diapers/wipes/mat are unchanged).

- [ ] **Step 7: Commit**

```bash
git add src/types/packing.ts src/data/infantEssentials.ts src/utils/packingEngine.ts __tests__/packingEngine.test.ts
git commit -m "feat: expand infant essentials to cover clothing, feeding, and diapering"
```

---

### Task 3: Add toddler essentials

**Files:**
- Create: `src/data/toddlerEssentials.ts`
- Modify: `src/utils/packingEngine.ts` (import + injection block)
- Test: `__tests__/packingEngine.test.ts`

**Interfaces:**
- Consumes: `BabyEssentialSpec` from `src/types/packing.ts` (Task 2).
- Produces: `TODDLER_ESSENTIALS: BabyEssentialSpec[]` exported from `src/data/toddlerEssentials.ts`.

- [ ] **Step 1: Write the failing test for toddler items**

Add to `__tests__/packingEngine.test.ts`, inside `describe('generatePackingPlan — demographic multipliers', ...)`:

```ts
  it('adds toddler clothing/feeding items with correct categories and quantities', () => {
    const config = makeConfig({ travelers: [makeTraveler({ id: 't', ageGroup: 'toddler' })], durationDays: 6 });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });

    const tops = itemsFor(plan.items, 'Easy-On Tops & Bottoms')[0];
    expect(tops.category).toBe('clothing');
    expect(tops.quantity).toBe(6 + 1);

    const pyjamas = itemsFor(plan.items, 'Pyjamas')[0];
    expect(pyjamas.quantity).toBe(Math.ceil(6 / 3));

    const snacks = itemsFor(plan.items, 'Low-Mess Snack Packs')[0];
    expect(snacks.category).toBe('essentials');
    expect(snacks.quantity).toBe(Math.ceil(6 / 2) + 1);

    expect(itemsFor(plan.items, 'Bento Snack Box')).toHaveLength(1);
    expect(itemsFor(plan.items, 'Comfort Item / Lovey')).toHaveLength(1);
  });

  it('only adds toddler swimwear when the beach activity is selected', () => {
    const beachPlan = generatePackingPlan(
      makeConfig({ travelers: [makeTraveler({ id: 't', ageGroup: 'toddler' })], activities: ['beach'] }),
      { idGenerator: makeStubIdGen() }
    );
    const noBeachPlan = generatePackingPlan(
      makeConfig({ travelers: [makeTraveler({ id: 't', ageGroup: 'toddler' })], activities: [] }),
      { idGenerator: makeStubIdGen() }
    );

    expect(itemsFor(beachPlan.items, 'Swimwear (UV Rash Guard)')).toHaveLength(1);
    expect(itemsFor(noBeachPlan.items, 'Swimwear (UV Rash Guard)')).toHaveLength(0);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/packingEngine.test.ts -t "toddler clothing"`
Expected: FAIL — `TODDLER_ESSENTIALS` doesn't exist and no injection block runs for `ageGroup === 'toddler'`.

- [ ] **Step 3: Create `toddlerEssentials.ts`**

```ts
import type { BabyEssentialSpec } from '../types/packing';

// Fixed-quantity toddler (1-3yr) pack. Not subject to the demographic
// clothing multiplier — these are absolute-quantity items.
export const TODDLER_ESSENTIALS: BabyEssentialSpec[] = [
  {
    id: 'toddler_tops_bottoms',
    name: 'Easy-On Tops & Bottoms',
    category: 'clothing',
    iconName: 'tshirt-crew-outline',
    quantityFormula: (effectiveDays) => effectiveDays + 1,
    baseWeightGrams: 150,
  },
  {
    id: 'toddler_swimwear',
    name: 'Swimwear (UV Rash Guard)',
    category: 'clothing',
    iconName: 'swim',
    quantityFormula: () => 2,
    baseWeightGrams: 120,
    appliesWhen: (config) => config.activities.includes('beach'),
  },
  {
    id: 'toddler_pyjamas',
    name: 'Pyjamas',
    category: 'clothing',
    iconName: 'weather-night',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 3),
    baseWeightGrams: 180,
  },
  {
    id: 'toddler_sun_hat',
    name: 'Sun Hat',
    category: 'clothing',
    iconName: 'hat-fedora',
    quantityFormula: () => 1,
    baseWeightGrams: 40,
  },
  {
    id: 'toddler_sunglasses',
    name: 'Sunglasses',
    category: 'essentials',
    iconName: 'sunglasses',
    quantityFormula: () => 1,
    baseWeightGrams: 30,
  },
  {
    id: 'toddler_water_bottle',
    name: 'Leak-Proof Water Bottle',
    category: 'essentials',
    iconName: 'bottle-water-outline',
    quantityFormula: () => 1,
    baseWeightGrams: 150,
  },
  {
    id: 'toddler_snacks',
    name: 'Low-Mess Snack Packs',
    category: 'essentials',
    iconName: 'food-apple-outline',
    quantityFormula: (effectiveDays) => Math.ceil(effectiveDays / 2) + 1,
    baseWeightGrams: 300,
  },
  {
    id: 'toddler_bento_box',
    name: 'Bento Snack Box',
    category: 'essentials',
    iconName: 'food-variant',
    quantityFormula: () => 1,
    baseWeightGrams: 120,
  },
  {
    id: 'toddler_comfort_item',
    name: 'Comfort Item / Lovey',
    category: 'essentials',
    iconName: 'teddy-bear',
    quantityFormula: () => 1,
    baseWeightGrams: 150,
  },
  {
    id: 'toddler_quiet_toys',
    name: 'Quiet Toys / Sticker Book',
    category: 'essentials',
    iconName: 'toy-brick-outline',
    quantityFormula: () => 2,
    baseWeightGrams: 80,
  },
];
```

- [ ] **Step 4: Add the toddler injection block in `packingEngine.ts`**

In `src/utils/packingEngine.ts`:
1. Add the import near the existing `INFANT_ESSENTIALS` import (line 3):

```ts
import { INFANT_ESSENTIALS } from '../data/infantEssentials';
import { TODDLER_ESSENTIALS } from '../data/toddlerEssentials';
```

2. Add a sibling block directly after the infant block from Task 2 (still inside the `for (const traveler of travelers)` loop):

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest __tests__/packingEngine.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/toddlerEssentials.ts src/utils/packingEngine.ts __tests__/packingEngine.test.ts
git commit -m "feat: add toddler essentials (clothing, feeding, comfort items)"
```

---

### Task 4: Add shared baby/toddler family gear

**Files:**
- Create: `src/data/babyFamilyGear.ts`
- Modify: `src/utils/packingEngine.ts` (import + one-time injection block)
- Test: `__tests__/packingEngine.test.ts`

**Interfaces:**
- Consumes: `PackingItem['category']` from `src/types/packing.ts`.
- Produces: `BABY_FAMILY_GEAR: BabyFamilyGearSpec[]` exported from `src/data/babyFamilyGear.ts`, where `BabyFamilyGearSpec = { id: string; name: string; category: PackingItem['category']; iconName: string; quantityFormula: () => number; baseWeightGrams: number }`.

- [ ] **Step 1: Write the failing test for shared family gear**

Add to `__tests__/packingEngine.test.ts`, inside `describe('generatePackingPlan — demographic multipliers', ...)`:

```ts
  it('adds shared baby/toddler family gear once per trip, not per baby traveler', () => {
    const config = makeConfig({
      travelers: [
        makeTraveler({ id: 'i1', ageGroup: 'infant' }),
        makeTraveler({ id: 't1', ageGroup: 'toddler' }),
      ],
    });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });

    const stroller = itemsFor(plan.items, 'Travel Stroller / Buggy');
    expect(stroller).toHaveLength(1);
    expect(stroller[0].assignedTravelerId).toBeUndefined();

    const monitor = itemsFor(plan.items, 'Baby Monitor');
    expect(monitor).toHaveLength(1);
    expect(monitor[0].category).toBe('electronics');

    expect(itemsFor(plan.items, 'Baby Carrier / Wrap')).toHaveLength(1);
    expect(itemsFor(plan.items, 'Blackout Blind')).toHaveLength(1);
    expect(itemsFor(plan.items, 'Digital Thermometer')).toHaveLength(1);
  });

  it('does not add baby family gear when no traveler is infant or toddler', () => {
    const config = makeConfig({ travelers: [makeTraveler({ id: 'a', ageGroup: 'adult' })] });
    const plan = generatePackingPlan(config, { idGenerator: makeStubIdGen() });
    expect(itemsFor(plan.items, 'Travel Stroller / Buggy')).toHaveLength(0);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/packingEngine.test.ts -t "family gear"`
Expected: FAIL — `'Travel Stroller / Buggy'` and related items don't exist yet.

- [ ] **Step 3: Create `babyFamilyGear.ts`**

```ts
import type { PackingItem } from '../types/packing';

export interface BabyFamilyGearSpec {
  id: string;
  name: string;
  category: PackingItem['category'];
  iconName: string;
  quantityFormula: () => number;
  baseWeightGrams: number;
}

// Once-per-trip gear shared across the whole family when any traveler is
// an infant or toddler — not duplicated per baby traveler.
export const BABY_FAMILY_GEAR: BabyFamilyGearSpec[] = [
  {
    id: 'baby_stroller',
    name: 'Travel Stroller / Buggy',
    category: 'essentials',
    iconName: 'baby-carriage',
    quantityFormula: () => 1,
    baseWeightGrams: 6500,
  },
  {
    id: 'baby_carrier',
    name: 'Baby Carrier / Wrap',
    category: 'essentials',
    iconName: 'human-child',
    quantityFormula: () => 1,
    baseWeightGrams: 500,
  },
  {
    id: 'baby_blackout_blind',
    name: 'Blackout Blind',
    category: 'essentials',
    iconName: 'blinds',
    quantityFormula: () => 1,
    baseWeightGrams: 150,
  },
  {
    id: 'baby_monitor',
    name: 'Baby Monitor',
    category: 'electronics',
    iconName: 'monitor-eye',
    quantityFormula: () => 1,
    baseWeightGrams: 300,
  },
  {
    id: 'baby_pain_reliever',
    name: 'Infant/Child Pain Reliever + Syringe',
    category: 'toiletries',
    iconName: 'pill',
    quantityFormula: () => 1,
    baseWeightGrams: 60,
  },
  {
    id: 'baby_thermometer',
    name: 'Digital Thermometer',
    category: 'toiletries',
    iconName: 'thermometer',
    quantityFormula: () => 1,
    baseWeightGrams: 50,
  },
  {
    id: 'baby_first_aid_kit',
    name: 'Baby First Aid Kit (antiseptic, band-aids, nail clippers)',
    category: 'toiletries',
    iconName: 'medical-bag',
    quantityFormula: () => 1,
    baseWeightGrams: 100,
  },
  {
    id: 'baby_rehydration_salts',
    name: 'Rehydration Salts / Nasal Saline Spray',
    category: 'toiletries',
    iconName: 'cup-water',
    quantityFormula: () => 1,
    baseWeightGrams: 80,
  },
];
```

- [ ] **Step 4: Add the one-time injection block in `packingEngine.ts`**

In `src/utils/packingEngine.ts`:
1. Add the import next to the `TODDLER_ESSENTIALS` import:

```ts
import { BABY_FAMILY_GEAR } from '../data/babyFamilyGear';
```

2. After the closing brace of the `for (const traveler of travelers)` loop (right before the `const sharedCtx: EngineContext = { config };` line), add:

```ts
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

```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest __tests__/packingEngine.test.ts`
Expected: PASS.

- [ ] **Step 6: Run the full test suite**

Run: `npx jest`
Expected: PASS — no regressions in `healthEngine.test.ts`, `roundingUtils.test.ts`, `sunscreenEngine.test.ts`, `travelerLabel.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/data/babyFamilyGear.ts src/utils/packingEngine.ts __tests__/packingEngine.test.ts
git commit -m "feat: add shared baby/toddler family gear (stroller, monitor, health kit)"
```

---

## Post-plan manual check

After all four tasks land, run the app (`npm start` / `expo start`) and walk through the wizard: add a traveler, set Age Group to **Toddler**, confirm the segmented button renders correctly and the generated plan (Step 5 → Output) shows toddler clothing/essentials items grouped under that traveler, plus shared family gear under "Shared" in the Essentials/Electronics tabs.
