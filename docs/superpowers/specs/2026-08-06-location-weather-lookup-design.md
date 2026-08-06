# Location Lookup & Weather-Driven Climate (Wizard Step 1)

## Context

`Step1LogisticsAirline.tsx` today collects a free-text `destination` string, a manual duration
stepper (`durationDays`), and manually-selected `climate` chips (`warm | mild | cold | rainy`).
This feature adds real location search and date-based weather lookup (via Open-Meteo, no API key)
that auto-derives the climate, while preserving manual override for offline/failure cases.

The app is Expo/React Native (Zustand, react-native-paper) — not web React/Tailwind. All UI work
adapts to those primitives.

## Goals

1. Adapter-driven service layer: UI and store only ever see normalized domain types
   (`LocationResult`, `WeatherProfile`), never raw Open-Meteo response shapes.
2. Free initial provider: Open-Meteo geocoding + weather/archive APIs.
3. Dynamic weather source: forecast endpoint for trips starting <14 days out; archive endpoint
   (same calendar dates, previous year) for trips further out, flagged `isHistoricalEstimate`.
4. Zero regression to the existing packing engine: it keeps consuming a single `ClimateType`.
5. No hard dependency on network access — manual climate chips remain a working fallback.

## Non-goals

- Multi-provider swapping isn't exercised in this pass (only Open-Meteo is implemented), but the
  `IGeocodingProvider`/`IWeatherProvider` interfaces + factory make a second provider a drop-in.
- No persistence of search history or last-used location (in-memory only, per session).
- No redesign of steps 2-5 of the wizard.

## Domain types (`src/services/weather/types.ts`)

```ts
export interface LocationResult {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type ClimateTag =
  | 'freezing' | 'cold' | 'mild' | 'warm' | 'hot' | 'rainy' | 'breezy' | 'high_uv';

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  tempHighC: number;
  tempLowC: number;
  condition: string; // 'sunny' | 'partly_cloudy' | 'rainy' | 'snowy' | 'thunderstorm'
  rainProbabilityPct: number;
  uvIndexMax?: number;
}

export interface WeatherProfile {
  isHistoricalEstimate: boolean;
  summary: {
    avgTempC: number;
    minTempC: number;
    maxTempC: number;
    overallCondition: string;
    totalRainExpectedMm: number;
    maxRainProbabilityPct: number;
    climateTags: ClimateTag[];
  };
  dailyBreakdown: DailyWeather[];
}

export interface FetchWeatherParams {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  timezone: string;
}
```

## Service layer (`src/services/weather/`)

```
types.ts                    # types above
interfaces.ts                # IGeocodingProvider, IWeatherProvider
OpenMeteoGeocodingAdapter.ts # https://geocoding-api.open-meteo.com/v1/search
OpenMeteoWeatherAdapter.ts   # forecast vs archive branch, WMO code mapping, tag derivation
TravelPlannerService.ts      # orchestrator + deriveClimateType()
factory.ts                   # createTravelPlannerService()
```

- `IGeocodingProvider.searchLocations(query: string, limit?: number): Promise<LocationResult[]>`
- `IWeatherProvider.getWeatherProfile(params: FetchWeatherParams): Promise<WeatherProfile>`
- `OpenMeteoWeatherAdapter`: computes `daysUntil(startDate)`. If `<= 14`, calls
  `https://api.open-meteo.com/v1/forecast`. If `> 14`, shifts `startDate`/`endDate` back exactly
  one year and calls `https://archive-api.open-meteo.com/v1/archive`, then returns the mapped
  profile with `isHistoricalEstimate: true` (dates in the returned `dailyBreakdown` remain the
  *original* requested dates, not the shifted lookup dates — the shift is an implementation detail
  of the historical query, not something the caller should see).
- WMO weather code → `condition` string mapping, and `climateTags` derivation from
  temp/rain/UV summary stats, live in the weather adapter (kept out of the orchestrator).
- Both adapters accept an injectable `fetch` function (default `globalThis.fetch`) so tests can
  mock HTTP without a network.
- `TravelPlannerService`:
  - `searchLocations(query)` — thin passthrough to the geocoding adapter.
  - `getTripWeather(location, startDate, endDate)` — thin passthrough to the weather adapter.
  - `deriveClimateType(profile: WeatherProfile): ClimateType` — pure function collapsing
    `climateTags`/summary stats into the existing `ClimateType`. Rule of thumb: `freezing`/`cold`
    tag present → `cold`; `hot`/`warm` present and no `cold` → `warm`; `maxRainProbabilityPct >= 50`
    → `rainy`; otherwise → `mild`. Order of precedence: cold > rainy > warm > mild (checked in
    that order against the tag set / stats).
- `createTravelPlannerService()` in `factory.ts` wires `OpenMeteoGeocodingAdapter` +
  `OpenMeteoWeatherAdapter` into a `TravelPlannerService` instance. This is the only place a
  concrete provider is chosen.
- Error handling: adapters throw on non-2xx / network failure; `TravelPlannerService` methods
  propagate the error (no silent swallowing) so the store/UI can distinguish "no results" from
  "request failed" and show an appropriate message.

## Domain model changes (`src/types/packing.ts`)

```ts
export interface TripConfig {
  destination: string;
  location?: LocationResult;       // set once a search result is picked
  startDate: string;               // YYYY-MM-DD, required
  endDate: string;                 // YYYY-MM-DD, required
  airlineId?: string;
  climate: ClimateType;            // manual default, or auto-set from weather
  durationDays: number;            // derived: diff(endDate, startDate) + 1
  weatherProfile?: WeatherProfile; // richer data for display only
  checkedBags: number;
  cabinBags: number;
  laundryAvailable: boolean;
  toiletryStrategy: ToiletryStrategy;
  activities: ActivityType[];
  travelers: Traveler[];
}
```

`durationDays` is no longer a free-standing input — it's recomputed whenever dates change and the
manual +/- stepper UI is removed. The packing engine (`generatePackingPlan`) is unaffected since it
already just reads `durationDays` and `climate` off `TripConfig`.

`defaultDraftConfig()` in `useTripStore.ts` gets sane defaults: `startDate` = today (ISO date),
`endDate` = today + 6 days (keeps the current default `durationDays: 7` behavior), `climate: 'mild'`
unchanged.

## State management (`src/state/useTripStore.ts`)

New store actions:
- `setTripDates(startDate: string, endDate: string)` — rejects (no-op, or clamps `endDate` to
  `startDate`) if `endDate < startDate`; recomputes `durationDays` on the draft config.
- `selectLocation(location: LocationResult)` — sets `location` + `destination` (from
  `location.name`), then calls `fetchWeather()`.
- `fetchWeather()` — async action using `createTravelPlannerService()`; on success sets
  `weatherProfile` and `climate` (via `deriveClimateType`); on failure sets a
  `weatherLookupError: string | null` field in store state (not thrown) so the UI can show an
  inline banner and fall back to the existing manual chips.

Location search itself (`searchLocations(query)` → `LocationResult[]`) is **not** stored in
Zustand — it's transient, per-keystroke UI state owned by the `Step1LogisticsAirline` component
(local `useState` + debounce), calling the service directly. Only the *selected* location goes into
the store.

## UI changes (`src/screens/wizard/Step1LogisticsAirline.tsx`)

- Destination `TextInput` becomes an autocomplete: same `TextInput`, `onChangeText` is debounced
  (~350ms) and calls `travelPlannerService.searchLocations(query)`; results render as a simple
  dropdown (`View` + `Pressable` rows) beneath the input, styled consistently with
  `SelectableChip`/`AirlinePicker` — no new UI library needed. Selecting a row calls
  `selectLocation()` and closes the dropdown.
- Duration stepper is removed. Two `@react-native-community/datetimepicker` fields (Start date /
  End date) replace it, wired to `setTripDates`. Inline validation text appears if the user attempts
  `endDate < startDate` (picker itself also constrains `endDate`'s minimum to `startDate`).
- Climate chips section is unchanged in structure, but:
  - Auto-selects to match `climate` whenever `fetchWeather()` succeeds.
  - Shows a small caption ("Estimated from last year's weather" / "Estimated from forecast") when
    `weatherProfile` is present, driven by `weatherProfile.isHistoricalEstimate`.
  - User tapping any chip still manually overrides `climate` (existing `updateDraftConfig` call),
    which also implicitly "detaches" from the weather auto-pick (no special flag needed — manual
    selection simply wins since it's the same field).
- Loading/error states: a small spinner under the destination field while searching; a spinner near
  the date row while `fetchWeather()` is in flight; an inline error line ("Couldn't fetch weather —
  pick a climate below") when `weatherLookupError` is set, and the chips remain fully usable.

New dependency: `@react-native-community/datetimepicker`, installed via
`npx expo install react-native-datetimepicker` for SDK 54-correct pinning.

## Testing

Following the existing plain-Jest convention in `__tests__/`:
- `__tests__/openMeteoWeatherAdapter.test.ts` — WMO code → condition mapping; forecast-vs-archive
  branch selection at the 14-day boundary (13 vs 14 vs 15 days out); date-shift-by-one-year logic
  for the archive path; climate tag derivation from summary stats. Uses an injected fake `fetch`,
  no real network calls.
- `__tests__/travelPlannerService.test.ts` — `deriveClimateType()` precedence rules (cold > rainy >
  warm > mild) across boundary values.
- `__tests__/openMeteoGeocodingAdapter.test.ts` — response mapping to `LocationResult[]`, empty
  results, and HTTP failure propagation, again via injected fake `fetch`.

UI (`Step1LogisticsAirline.tsx`) is verified manually via the `run` skill / Expo dev server rather
than component tests, consistent with how the rest of the wizard is currently tested.

## Open risks

- Open-Meteo's free archive API has a short latency/rate-limit profile under heavy use; not a
  concern at this app's scale (single lookup per trip-planning session).
- `@react-native-community/datetimepicker` renders natively differently on iOS vs Android; default
  platform behavior is accepted as-is rather than building a custom cross-platform picker.
