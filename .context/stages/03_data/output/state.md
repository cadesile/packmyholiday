# Client state

All in-memory state lives in one zustand store, `useTripStore` (`src/state/useTripStore.ts`). Only `savedTrips` is persisted (see `schema.md`); everything else is lost on app restart.

## State
| Field | Meaning |
|---|---|
| `wizardStep` | 1–5 (`MIN_WIZARD_STEP`/`MAX_WIZARD_STEP`) |
| `draftConfig` | The `TripConfig` being edited. Default: today → today + 6 days, climate `mild`, 1 checked bag, 1 cabin bag, `toiletryStrategy: 'pack'`, no travelers/activities |
| `currentPlan` | `PackingPlan \| null` — set by `computePlan()` or `loadTrip()` |
| `savedTrips` | `SavedTrip[]` mirror of what is in AsyncStorage |
| `loadedTripId` | Id of the saved trip being edited, or `null` for a new trip (not persisted) |
| `hydrated` | Set `true` by `hydrate()`. No consumer of this flag was found in `src/` or `App.tsx` |
| `weatherLookupError` | Message from the last failed weather fetch, or `null` |

## Actions (grouped)
- **Lifecycle:** `hydrate()` loads saved trips (called once from `App.tsx`); `resetWizard()` returns to step 1 with a fresh draft and clears the plan, error and `loadedTripId`.
- **Wizard:** `nextStep()` / `prevStep()`. `nextStep` is a no-op on step 2 until at least one traveler exists.
- **Draft editing:** `updateDraftConfig(partial)`, `addTraveler()` (new traveler defaults to adult/unisex), `removeTraveler(id)`, `updateTraveler(id, partial)`, `selectAirline(id)` (sets `airlineId` only).
- **Dates and weather:** `setTripDates(start, end)` ignores `end < start`, recomputes `durationDays`, and re-fetches weather if a location is set. `selectLocation(location)` sets `location` and `destination` and fetches weather. `fetchWeather()` calls `TravelPlannerService.getTripWeather`, stores the `weatherProfile` and the derived `climate`, and stores an error message on failure. The service is created lazily via `createTravelPlannerService()` so tests can mock the factory.
- **Plan:** `computePlan()` runs `generatePackingPlan(draftConfig)`. `toggleItemPacked`, `toggleItemExcluded`, `removeItem` and `setItemQuantity` (clamped to ≥ 1) edit `currentPlan`; the last three recompute `totalEstimatedWeightKg` (excluded items don't count) and `isOverWeight`.
- **Saved trips:** `saveTrip(name)` updates the trip matching `loadedTripId` in place, otherwise appends a new one, then persists. `loadTrip(id)` copies the trip's config and plan into the draft and plan. `deleteTrip(id)` removes and persists.

## Component-local state
`RootNavigator` holds its own `screen` state (`wizard | output | savedTrips`); it is not in the store. `ErrorBoundary.handleReset` calls `clearSavedTrips()` (AsyncStorage only) and does not touch the in-memory `savedTrips`.

## Tests
`__tests__/useTripStore.test.ts` covers the store, with the weather factory mocked.
