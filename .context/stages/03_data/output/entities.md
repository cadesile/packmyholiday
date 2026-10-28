# Entities and relationships

Field-level shapes are in `schema.md`; this file is the domain model and the rules that connect it. The model is small and mostly derived: a **Trip config** goes in, a **Packing plan** comes out.

## Relationships
```
TripConfig ──┬─ travelers: Traveler[]            (age group + style drive quantities and weights)
             ├─ activities: ActivityType[]        (gate catalog entries, footwear, sunscreen, health items)
             ├─ location? → LocationResult        (Open-Meteo geocoding result)
             ├─ weatherProfile? → WeatherProfile  (Open-Meteo forecast or last-year archive)
             ├─ climate: ClimateType              (derived from weatherProfile, editable in the wizard)
             └─ airlineId? → AirlinePreset        (display/convenience only — see below)

generatePackingPlan(TripConfig) → PackingPlan → PackingItem[]
SavedTrip = { id, name, config, plan, savedAt }   (the only persisted entity)
```

## Plan generation rules (`utils/packingEngine.ts`, constants in `data/weightConstants.ts`)
- **No travelers → empty plan** with the suggestion "Add at least one traveler…".
- **Capacity:** `maxAllowedWeightKg = checkedBags × 23 + cabinBags × 10`. `isOverWeight` is `total > max`.
- **Effective days:** with `laundryAvailable`, days are capped at 5. With `reuseClothing`, clothing days are `ceil(effectiveDays × 0.7)`.
- **Per-traveler catalog entries** (`perTraveler: true`): quantity from each entry's `quantityFormula`, skipped when `appliesWhen` is false or the quantity is 0. Unit weight is the entry's adult baseline × demographic multiplier (adult 1.0, child 0.5, toddler 0.35, infant 0.25). Quantities are rounded up (`roundQty`).
- **Footwear:** two baseline pairs (worn, packed) for everyone plus at most one competitive pair, chosen by priority `formal > hiking > exploring > sightseeing` among the selected activities (hard cap 3 pairs). Omitted pairs add a note to `optimizationSuggestions`. Shoe weight: adult 900 g, child 400 g, toddler 65% and infant 50% of the child weight.
- **Infant / toddler:** infant travelers get the 20 `INFANT_ESSENTIALS`, toddlers the 10 `TODDLER_ESSENTIALS` (each with a `quantityFormula(effectiveDays)` and optional `appliesWhen(config)`). If any infant or toddler is present, the 8 `BABY_FAMILY_GEAR` items are added once for the whole group (no assigned traveler).
- **Shared catalog entries** (`perTraveler: false`) are added once per trip.
- **Sunscreen** (`utils/sunscreenEngine.ts`): only when `toiletryStrategy === 'pack'` **and** climate is `warm`. Volume = per-traveler single dose (adult 30 ml, child 20, toddler 15, infant 10) × applications per day (beach 3, or 4 for children; exploring 1, or 2 for children; otherwise 1) × days. Bottles are 200 ml; density 1.05 g/ml. If carry-on only and volume exceeds 100 ml, the note says to buy on arrival. Sensitive-skin travelers and infants add a mineral SPF 50+ note.
- **Toiletries strategy `buy_on_arrival`:** adds the note "Toiletries: buy on arrival — not included in packed weight."
- **Health items** (`utils/healthEngine.ts`): insect repellent (bottles = `ceil(travelers / 2)`, 150 g each) when climate is warm or rainy or hiking is selected; blister plasters and antiseptic wipes (100 g) when hiking or exploring is selected.
- **Overweight suggestions** (only when over the limit): enable laundry for trips over 5 days; buy liquid toiletries at destination if packed toiletries exceed 0.5 kg; consider more checked bags when `checkedBags < travelers`.

## Static catalogs (`src/data/`)
| Catalog | Contents |
|---|---|
| `CATALOG_ENTRIES` (`itemCatalog.ts`) | 29 entries — clothing 14, toiletries 6, electronics 4, essentials 5. Each is `{id, name, category, iconName, baseWeightGrams, quantityFormula, appliesWhen?, perTraveler}`. Gates reference activities (beach, exploring, formal, gym, hiking, nightlife, sightseeing, work) and the toiletry strategy |
| `FOOTWEAR_ITEMS` (`itemCatalog.ts`) | `worn_baseline`, `packed_baseline`, `formal_shoes`, `hiking_boots`, `exploring_shoes`, `sightseeing_shoes` |
| `INFANT_ESSENTIALS`, `TODDLER_ESSENTIALS`, `BABY_FAMILY_GEAR` | 20 / 10 / 8 specs (`BabyEssentialSpec` / `BabyFamilyGearSpec`) |
| `AIRLINE_PRESETS` (`airlineCatalog.ts`) | Ryanair, easyJet, British Airways, Jet2, TUI Airways: `underseatMaxCm`, `overheadMaxCm?`, `defaultCheckedWeightKg`, `defaultCabinWeightKg`, `allowsFreeOverhead` |
| `weightConstants.ts` | Bag capacities, laundry cap (5 days), reuse factor (0.7), demographic multipliers, footwear cap/priority, base garment weights, sunscreen constants |

The airline presets are read only by `AirlinePicker` and `Step5BaggageReview` for display. The engine ignores them and always uses the fixed 23 kg / 10 kg bag capacities, and `selectAirline` does not change bag counts.

## Weather entities (`services/weather/types.ts`)
`LocationResult`, `DailyWeather`, `WeatherProfile`, `ClimateTag` (`freezing, cold, mild, warm, hot, rainy, breezy, high_uv`). `TravelPlannerService.deriveClimateType` collapses tags to a `ClimateType`: freezing/cold → `cold`; else max rain probability ≥ 50% → `rainy`; else hot/warm → `warm`; otherwise `mild`.
