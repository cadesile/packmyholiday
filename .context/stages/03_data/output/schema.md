# Schema

There is no database. The only persisted data is one AsyncStorage key written by `src/state/storage.ts`. Domain meaning and relationships are in `entities.md`; the in-memory store is in `state.md`.

## Persisted payload
- **Key:** `@packmyholiday/savedTrips` (AsyncStorage)
- **Value (JSON string):** `{ "schemaVersion": 1, "trips": SavedTrip[] }`

### `SavedTrip` (`state/storage.ts`)
| Field | Type | Notes |
|---|---|---|
| `id` | string | Generated with `expo-crypto` `randomUUID()` |
| `name` | string | User-entered trip name |
| `config` | `TripConfig` | Snapshot of the draft config at save time |
| `plan` | `PackingPlan` | Snapshot of the generated plan, including packed/excluded flags and edited quantities |
| `savedAt` | string | ISO timestamp (`new Date().toISOString()`) |

### `TripConfig` (`types/packing.ts`)
| Field | Type |
|---|---|
| `destination` | string |
| `location?` | `LocationResult` (`id`, `name`, `country`, `countryCode`, `latitude`, `longitude`, `timezone`) |
| `startDate`, `endDate` | string, `YYYY-MM-DD` |
| `airlineId?` | string (id from the airline presets) |
| `climate` | `'warm' \| 'mild' \| 'cold' \| 'rainy'` |
| `durationDays` | number |
| `weatherProfile?` | `WeatherProfile` (`isHistoricalEstimate`, `summary{avgTempC, minTempC, maxTempC, overallCondition, totalRainExpectedMm, maxRainProbabilityPct, climateTags[]}`, `dailyBreakdown[]` of `{date, tempHighC, tempLowC, condition, rainProbabilityPct, uvIndexMax?}`) |
| `travelers` | `Traveler[]` |
| `checkedBags` | number (~23 kg capacity each) |
| `cabinBags` | number (~10 kg capacity each) |
| `laundryAvailable` | boolean |
| `reuseClothing` | boolean |
| `toiletryStrategy` | `'pack' \| 'buy_on_arrival'` |
| `activities` | `ActivityType[]` — `beach, hiking, formal, gym, sightseeing, work, exploring, nightlife` |

### `Traveler`
`id` string · `ageGroup` `'adult' | 'child' | 'toddler' | 'infant'` · `style` `'masculine' | 'feminine' | 'unisex'` · `sensitiveSkin?` boolean.

### `PackingPlan`
`items: PackingItem[]` · `totalEstimatedWeightKg` · `maxAllowedWeightKg` · `isOverWeight` · `optimizationSuggestions: string[]`.

### `PackingItem`
`id` · `name` · `category` (`clothing | toiletries | footwear | electronics | essentials`) · `quantity` · `estimatedWeightGrams` (per unit) · `packed` · `excluded?` · `assignedTravelerId?` (absent for shared/family items) · `iconName?`.

## Reading and writing
- `loadSavedTrips()` returns `[]` for a missing key, unparsable JSON, or any error. `migrate()` returns `payload.trips` if it is an array, otherwise `[]`; it does not branch on `schemaVersion`.
- `persistSavedTrips(trips)` always writes `schemaVersion: 1`. `clearSavedTrips()` removes the key.

## Open questions
- `schemaVersion` is written but never read, so nothing yet distinguishes old from new payloads.
