# Baby & Toddler Packing Items — Design

## Problem

The packing plan generator has a single `infant` age group covering ages 0–3, with a
minimal item set (`src/data/infantEssentials.ts`: diapers, wipes, changing mat). This
doesn't distinguish a newborn (formula, bottles, sleepsuits) from a 2-year-old
(snacks, pyjamas, water shoes), and is missing most of the categories a parent
actually needs to pack: baby grows, nappies, hats, togs, feeding gear, buggy/travel
gear, health kit, and carry-on comfort items.

## Goal

Add a `toddler` age group distinct from `infant`, and expand the generated item set
to cover the full 0–3 range across clothing, diapering, feeding, travel gear, and
health/carry-on essentials — matching the existing catalog architecture
(`src/data/itemCatalog.ts`, `src/utils/packingEngine.ts`).

## 1. Data model: new `toddler` age group

- `AgeGroup` in `src/types/packing.ts` becomes:
  `'adult' | 'child' | 'toddler' | 'infant'`
- `DEMOGRAPHIC_WEIGHT_MULTIPLIER` in `src/data/weightConstants.ts` gets a `toddler`
  entry between `infant` (0.25) and `child` (0.5) — e.g. `0.35`.
- `SUNSCREEN_SINGLE_DOSE_ML` gets a `toddler` entry between `infant` (10) and
  `child` (20) — e.g. `15`. This is the only change needed for sunscreen; the
  existing sunscreen engine already keys off `AgeGroup`.
- `shoeWeightForAgeGroup` in `src/utils/packingEngine.ts` gets an explicit `toddler`
  branch (currently anything non-adult/non-child falls through to
  `CHILD_SHOE_WEIGHT_GRAMS * 0.5`, which would now incorrectly cover toddlers too).
  Use `CHILD_SHOE_WEIGHT_GRAMS * 0.65` for toddler, keep `* 0.5` as the infant case.
- `TravelerCard.tsx`: `AGE_GROUP_OPTIONS` gains
  `{ value: 'toddler', label: 'Toddler' }`, ordered Adult / Child / Toddler / Infant.

This section only affects weight-scaling and footwear weight. It does not change
how items are generated (see §2/§3).

## 2. Item catalog: baby/toddler items

Follow the existing precedent in `infantEssentials.ts`: these are **absolute-weight,
absolute-quantity items**, not scaled by `demographicMultiplier` — a diaper doesn't
get lighter because of an age-group multiplier, unlike adult clothing derivatives.

Extend the shared spec shape to:

```ts
export interface BabyEssentialSpec {
  id: string;
  name: string;
  category: PackingItem['category']; // clothing | toiletries | footwear | electronics | essentials
  iconName: string;
  quantityFormula: (effectiveDays: number) => number;
  baseWeightGrams: number;
  appliesWhen?: (config: TripConfig) => boolean; // e.g. swim diapers only if 'beach' activity
}
```

### Infant (0–12mo) — per traveler, `src/data/infantEssentials.ts`

| Item | Category | Qty formula | Gate |
|---|---|---|---|
| Short/long-sleeve onesies | clothing | `ceil(days*1.5)+1` | — |
| Footed sleepsuits/sleep sacks | clothing | `ceil(days/2)+1` | — |
| Sun hat (wide brim, chin strap) | clothing | `1` | — |
| Stroller blanket | essentials | `1` | — |
| Diapers *(existing)* | essentials | `days*6` | — |
| Swim diapers | essentials | `ceil(days/3)` | `beach` activity |
| Wipes *(existing)* | essentials | `ceil(days/3)` | — |
| Diaper rash cream | toiletries | `1` | — |
| Changing mat *(existing)* | essentials | `1` | — |
| Wet/soiled-clothes bags | essentials | `ceil(days/2)` | — |
| Bottles + nipples + brush | essentials | `3` | — |
| Formula powder (tins) | essentials | `ceil(days/5)+1` | — |
| Sterilizing tablets/bags | toiletries | `ceil(days/5)` | — |
| Muslin/burp cloths | clothing | `6` | — |
| Silicone bibs | essentials | `2` | — |
| Sippy cup | essentials | `1` | — |
| Travel spoon + bowl | essentials | `1` | — |
| Weaning snack pouches | essentials | `ceil(days/2)` | — |
| Pacifiers (clip) | essentials | `4` | — |
| Comfort item / lovey | essentials | `1` | — |

### Toddler (1–3yr) — per traveler, `src/data/toddlerEssentials.ts` (new file)

| Item | Category | Qty formula | Gate |
|---|---|---|---|
| Easy-on tops/bottoms | clothing | `days+1` | — |
| Swimwear (UV rash guard) | clothing | `2` | `beach` activity |
| Pyjamas | clothing | `ceil(days/3)` | — |
| Sun hat | clothing | `1` | — |
| Sunglasses | essentials | `1` | — |
| Leak-proof water bottle | essentials | `1` | — |
| Low-mess snack packs | essentials | `ceil(days/2)+1` | — |
| Bento snack box | essentials | `1` | — |
| Comfort item / lovey | essentials | `1` | — |
| Quiet toys/sticker book | essentials | `2` | — |

Toddler footwear (walking shoes/water sandals) rides on the existing generic
footwear system in `packingEngine.ts` (the `worn_baseline`/`packed_baseline`/
activity-based footwear resolution already runs for every traveler regardless of
age group) — it only needed the shoe-weight branch from §1, no new item spec.

### Shared family gear — once per trip, `src/data/babyFamilyGear.ts` (new file)

Generated once if `travelers.some(t => t.ageGroup === 'infant' || t.ageGroup === 'toddler')`,
not per baby traveler (a family doesn't pack two strollers for two kids).

| Item | Category |
|---|---|
| Travel stroller/buggy | essentials |
| Baby carrier/wrap | essentials |
| Blackout blind | essentials |
| Baby monitor | electronics |
| Infant/child pain reliever + syringe | toiletries |
| Digital thermometer | toiletries |
| Antiseptic cream/band-aids/nail clippers | toiletries |
| Rehydration salts/nasal saline spray | toiletries |

All shared gear items have `quantityFormula: () => 1` except health-kit consumables
which can stay at `1` (single kit) since resupply is a local/pharmacy concern like
the rest of the app's health items.

## 3. Wiring

- `src/utils/packingEngine.ts`:
  - The existing `if (traveler.ageGroup === 'infant') { ... }` block (using
    `INFANT_ESSENTIALS`) gets a sibling `if (traveler.ageGroup === 'toddler') { ... }`
    block using `TODDLER_ESSENTIALS`, same shape (map spec → `PackingItem`,
    `roundQty`/`roundWeight`, `assignedTravelerId: traveler.id`).
  - After the per-traveler loop, add a one-time block: if any traveler is
    `infant` or `toddler`, iterate `BABY_FAMILY_GEAR` and push each as a shared item
    (no `assignedTravelerId`), same pattern as the existing shared `CATALOG_ENTRIES`
    loop at the bottom of `generatePackingPlan`.
- `src/components/TravelerCard.tsx`: add the `toddler` option (§1).
- No changes to `PackingItem`, `itemCatalog.ts`, `OutputScreen.tsx`, or wizard step
  screens — new items flow into the existing clothing/toiletries/essentials/
  electronics tabs and existing per-traveler/shared section grouping.

## Out of scope

- No new `PackingItem` category/tab — existing 5 categories are sufficient.
- No carry-on/checked-bag distinction in the data model — `PackingItem` has no such
  field today; carry-on comfort items (pacifiers, lovey, toys) are just modeled as
  small-fixed-quantity per-traveler items like everything else.
- No finer age granularity within infant (0–6mo vs 6–12mo) or toddler (1–2 vs 2–3) —
  the existing `AgeGroup` enum only distinguishes at the infant/toddler boundary.
