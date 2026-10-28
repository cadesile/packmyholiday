# Structure

Stack, app directory and excluded dirs: see `../../../shared/stack.md` (not restated here).

A single-app repo: one Expo/React Native client, no backend, no monorepo packages. Line counts below are the working tree at generation time.

## Boot path
`index.ts` → `registerRootComponent(App)` → `App.tsx` → `src/navigation/RootNavigator.tsx`.

`App.tsx` loads the Geist and Fraunces fonts (holds the splash screen until they load), calls `useTripStore.hydrate()` once, picks `lightTheme` / `darkTheme` from `useColorScheme()`, and wraps the tree in `SafeAreaProvider` → `PaperProvider` → `ErrorBoundary`.

`RootNavigator` is **not** react-navigation (no such dependency). It keeps a local `screen` state (`'wizard' | 'output' | 'savedTrips'`) and, for the wizard, renders `Step1…Step5` according to the store's `wizardStep`. It switches to `output` as soon as the store has a `currentPlan`, and a bookmark `Appbar.Action` opens `savedTrips`.

## Modules (`src/`) and their seams
| Module | Files / lines | Responsibility |
|---|---|---|
| `navigation/` | 1 / 92 | Screen switching and the app bar (see above) |
| `screens/wizard/` | 5 / 347 | The 5-step trip wizard: `Step1LogisticsAirline`, `Step2Travelers`, `Step3ActivityMatrix`, `Step4HealthHygiene`, `Step5BaggageReview` |
| `screens/` | 2 / 384 | `OutputScreen` (generated packing list) and `SavedTripsScreen` |
| `components/` | 15 / 1001 | Shared UI pieces used by the screens (chips, pickers, cards, rows, buttons, progress dots, error boundary) |
| `state/` | 2 / 353 | `useTripStore.ts` (zustand store: wizard step, draft config, current plan, saved trips) and `storage.ts` (AsyncStorage persistence of saved trips) |
| `utils/` | 8 / 472 | Pure logic: `packingEngine` (plan generation), `healthEngine`, `sunscreenEngine`, `tripDates`, `tripDiff`, `rounding`, `id`, `travelerLabel` |
| `data/` | 6 / 784 | Static catalogs and constants: item catalog, infant/toddler/baby-family gear, airline presets, weight constants |
| `services/weather/` | 6 / 304 | Location search and weather lookup behind interfaces (`IGeocodingProvider`, `IWeatherProvider`), wired by `factory.ts` into `TravelPlannerService`; the only network code in the repo |
| `types/` | 1 / 70 | Domain types in `packing.ts` (`TripConfig`, `Traveler`, `PackingItem`, `PackingPlan`, …) |
| `theme/` | 5 / 202 | Paper themes, fonts, radii, spacing, touch targets (see `stages/05_ui/output/`) |

## Dependency direction
screens/components → `state/useTripStore` → `utils/packingEngine` (+ `data/`) and `services/weather`. `utils/` and `data/` hold no UI or network code. The weather service has two callers: the store (`getTripWeather`, via a lazily created instance) and `components/LocationSearchInput`, which creates its own instance for `searchLocations`. `types/packing.ts` imports weather types from `services/weather/types.ts`, and `utils/tripDiff.ts` imports `SavedTrip` from `state/storage.ts`.

## Tests
`__tests__/` (11 files, 1,580 lines) mirrors the logic layers: engines, date/rounding/label utils, the store, and the weather/geocoding adapters. There are no component or screen tests.

## Not present in this repo
No backend/API code, database, CI workflow, Docker/Lando or monorepo workspace. `docs/superpowers/` contains a design spec and plan for a future website and backend; none of it is implemented here.
