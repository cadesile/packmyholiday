# Location Lookup & Weather-Driven Climate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real location search + date-range-driven weather lookup (Open-Meteo, no API key) to Wizard Step 1, auto-deriving the existing `ClimateType`, with manual chip fallback on failure/offline.

**Architecture:** A provider-agnostic service layer (`src/services/weather/`) exposes `IGeocodingProvider`/`IWeatherProvider` interfaces implemented by Open-Meteo adapters, orchestrated by `TravelPlannerService`. The Zustand store and UI never see raw Open-Meteo response shapes — only `LocationResult`/`WeatherProfile`/`ClimateType`.

**Tech Stack:** Expo/React Native, TypeScript, Zustand, react-native-paper, Jest (`jest-expo` preset), `@react-native-community/datetimepicker` (new dependency).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-06-location-weather-lookup-design.md` — follow it exactly; this plan implements it.
- No API key required — Open-Meteo free endpoints only.
- Forecast endpoint for trips starting ≤14 days out; archive endpoint (same calendar dates, one year back) for trips starting >14 days out, flagged `isHistoricalEstimate: true`.
- Adapters accept an injectable `fetch` function (default `globalThis.fetch`) so tests never hit the network.
- Manual climate chips must keep working standalone — weather lookup failure must never block the wizard.
- `durationDays` is derived from `startDate`/`endDate`, never manually stepped.
- Tests follow the existing plain-Jest convention in `__tests__/*.test.ts` (see `__tests__/roundingUtils.test.ts` for style): flat `describe`/`it`, import via `'../src/...'`.
- New npm dependency must be installed via `npx expo install <package>` for SDK 54-correct pinning, not plain `npm install`.

---

### Task 1: Domain types & provider interfaces

**Files:**
- Create: `src/services/weather/types.ts`
- Create: `src/services/weather/interfaces.ts`

**Interfaces:**
- Produces: `LocationResult`, `ClimateTag`, `DailyWeather`, `WeatherProfile`, `FetchWeatherParams` (all exported from `types.ts`); `IGeocodingProvider`, `IWeatherProvider` (exported from `interfaces.ts`, importing types from `./types`).

This is a type-only scaffolding task (no runtime logic to test) — write the files and commit.

- [ ] **Step 1: Create the domain types file**

```ts
// src/services/weather/types.ts

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
  | 'freezing'
  | 'cold'
  | 'mild'
  | 'warm'
  | 'hot'
  | 'rainy'
  | 'breezy'
  | 'high_uv';

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
  endDate: string; // YYYY-MM-DD
  timezone: string;
}
```

- [ ] **Step 2: Create the provider interfaces file**

```ts
// src/services/weather/interfaces.ts
import type { FetchWeatherParams, LocationResult, WeatherProfile } from './types';

export interface IGeocodingProvider {
  searchLocations(query: string, limit?: number): Promise<LocationResult[]>;
}

export interface IWeatherProvider {
  getWeatherProfile(params: FetchWeatherParams): Promise<WeatherProfile>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/services/weather/types.ts src/services/weather/interfaces.ts
git commit -m "feat: add weather/location domain types and provider interfaces"
```

---

### Task 2: Trip date utilities

**Files:**
- Create: `src/utils/tripDates.ts`
- Test: `__tests__/tripDates.test.ts`

**Interfaces:**
- Produces: `toISODateString(date: Date): string`, `parseISODate(iso: string): Date`, `computeDurationDays(startDate: string, endDate: string): number`, `daysUntil(dateStr: string, from?: Date): number`, `shiftYear(dateStr: string, years: number): string`. Used by Task 4 (weather adapter), Task 6 (store), Task 9 (date picker component).

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/tripDates.test.ts
import { computeDurationDays, daysUntil, parseISODate, shiftYear, toISODateString } from '../src/utils/tripDates';

describe('toISODateString', () => {
  it('formats a UTC date as YYYY-MM-DD', () => {
    expect(toISODateString(new Date(Date.UTC(2026, 7, 6)))).toBe('2026-08-06');
  });
});

describe('parseISODate', () => {
  it('parses YYYY-MM-DD as UTC midnight', () => {
    const d = parseISODate('2026-08-06');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7);
    expect(d.getUTCDate()).toBe(6);
  });
});

describe('computeDurationDays', () => {
  it('counts inclusive days for a same-day trip', () => {
    expect(computeDurationDays('2026-08-06', '2026-08-06')).toBe(1);
  });

  it('counts inclusive days for a week-long trip', () => {
    expect(computeDurationDays('2026-08-06', '2026-08-12')).toBe(7);
  });
});

describe('daysUntil', () => {
  it('returns 0 when the date is today', () => {
    const today = new Date(Date.UTC(2026, 7, 6, 15, 30));
    expect(daysUntil('2026-08-06', today)).toBe(0);
  });

  it('returns a positive count for a future date', () => {
    const today = new Date(Date.UTC(2026, 7, 6));
    expect(daysUntil('2026-08-20', today)).toBe(14);
  });

  it('returns a negative count for a past date', () => {
    const today = new Date(Date.UTC(2026, 7, 6));
    expect(daysUntil('2026-08-01', today)).toBe(-5);
  });
});

describe('shiftYear', () => {
  it('shifts a date back one year', () => {
    expect(shiftYear('2026-08-06', -1)).toBe('2025-08-06');
  });

  it('shifts a leap-day date back one year to Feb 28', () => {
    expect(shiftYear('2028-02-29', -1)).toBe('2027-03-01');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/tripDates.test.ts`
Expected: FAIL with "Cannot find module '../src/utils/tripDates'"

- [ ] **Step 3: Write the implementation**

```ts
// src/utils/tripDates.ts

export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function computeDurationDays(startDate: string, endDate: string): number {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const target = parseISODate(dateStr);
  const fromMidnight = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  return Math.round((target.getTime() - fromMidnight.getTime()) / 86_400_000);
}

export function shiftYear(dateStr: string, years: number): string {
  const d = parseISODate(dateStr);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return toISODateString(d);
}
```

Note: `shiftYear('2028-02-29', -1)` naturally rolls over to `'2027-03-01'` via `setUTCFullYear` (2027 has no Feb 29) — this is expected JS `Date` overflow behavior, not a bug.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/tripDates.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/tripDates.ts __tests__/tripDates.test.ts
git commit -m "feat: add trip date utilities for weather lookup and date range picking"
```

---

### Task 3: Open-Meteo geocoding adapter

**Files:**
- Create: `src/services/weather/OpenMeteoGeocodingAdapter.ts`
- Test: `__tests__/openMeteoGeocodingAdapter.test.ts`

**Interfaces:**
- Consumes: `IGeocodingProvider`, `LocationResult` from Task 1.
- Produces: `OpenMeteoGeocodingAdapter` class, constructor `(fetchFn?: typeof fetch)`, method `searchLocations(query: string, limit?: number): Promise<LocationResult[]>`. Used by Task 5 (`TravelPlannerService`/factory).

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/openMeteoGeocodingAdapter.test.ts
import { OpenMeteoGeocodingAdapter } from '../src/services/weather/OpenMeteoGeocodingAdapter';

function makeFetchResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response;
}

describe('OpenMeteoGeocodingAdapter', () => {
  it('maps a successful response to LocationResult[]', async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      makeFetchResponse({
        results: [
          {
            id: 2643743,
            name: 'London',
            country: 'United Kingdom',
            country_code: 'GB',
            latitude: 51.50853,
            longitude: -0.12574,
            timezone: 'Europe/London',
          },
        ],
      })
    );
    const adapter = new OpenMeteoGeocodingAdapter(fetchFn);

    const results = await adapter.searchLocations('London');

    expect(results).toEqual([
      {
        id: '2643743',
        name: 'London',
        country: 'United Kingdom',
        countryCode: 'GB',
        latitude: 51.50853,
        longitude: -0.12574,
        timezone: 'Europe/London',
      },
    ]);
  });

  it('calls the geocoding endpoint with query and limit params', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse({ results: [] }));
    const adapter = new OpenMeteoGeocodingAdapter(fetchFn);

    await adapter.searchLocations('Paris', 3);

    const calledUrl = new URL(fetchFn.mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(calledUrl.searchParams.get('name')).toBe('Paris');
    expect(calledUrl.searchParams.get('count')).toBe('3');
  });

  it('returns an empty array for a blank query without calling fetch', async () => {
    const fetchFn = jest.fn();
    const adapter = new OpenMeteoGeocodingAdapter(fetchFn);

    const results = await adapter.searchLocations('   ');

    expect(results).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('returns an empty array when the response has no results field', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse({}));
    const adapter = new OpenMeteoGeocodingAdapter(fetchFn);

    const results = await adapter.searchLocations('Nowhereville');

    expect(results).toEqual([]);
  });

  it('throws on a non-ok response', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse({}, false, 500));
    const adapter = new OpenMeteoGeocodingAdapter(fetchFn);

    await expect(adapter.searchLocations('London')).rejects.toThrow('Geocoding request failed with status 500');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/openMeteoGeocodingAdapter.test.ts`
Expected: FAIL with "Cannot find module '../src/services/weather/OpenMeteoGeocodingAdapter'"

- [ ] **Step 3: Write the implementation**

```ts
// src/services/weather/OpenMeteoGeocodingAdapter.ts
import type { IGeocodingProvider } from './interfaces';
import type { LocationResult } from './types';

interface OpenMeteoGeocodingResult {
  id: number;
  name: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export class OpenMeteoGeocodingAdapter implements IGeocodingProvider {
  constructor(private readonly fetchFn: typeof fetch = globalThis.fetch) {}

  async searchLocations(query: string, limit = 5): Promise<LocationResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', String(limit));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const response = await this.fetchFn(url.toString());
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }

    const data = (await response.json()) as { results?: OpenMeteoGeocodingResult[] };
    const results = data.results ?? [];

    return results.map((r) => ({
      id: String(r.id),
      name: r.name,
      country: r.country ?? '',
      countryCode: r.country_code ?? '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? 'UTC',
    }));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/openMeteoGeocodingAdapter.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/weather/OpenMeteoGeocodingAdapter.ts __tests__/openMeteoGeocodingAdapter.test.ts
git commit -m "feat: add Open-Meteo geocoding adapter"
```

---

### Task 4: Open-Meteo weather adapter

**Files:**
- Create: `src/services/weather/OpenMeteoWeatherAdapter.ts`
- Test: `__tests__/openMeteoWeatherAdapter.test.ts`

**Interfaces:**
- Consumes: `IWeatherProvider`, `FetchWeatherParams`, `WeatherProfile`, `DailyWeather`, `ClimateTag` from Task 1; `daysUntil`, `shiftYear` from Task 2 (`src/utils/tripDates.ts`).
- Produces: `OpenMeteoWeatherAdapter` class, constructor `(fetchFn?: typeof fetch)`, method `getWeatherProfile(params: FetchWeatherParams): Promise<WeatherProfile>`. Used by Task 5.

This is the most logic-heavy adapter: WMO weather-code mapping, forecast-vs-archive branch selection at the 14-day boundary, and `ClimateTag` derivation from summary stats.

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/openMeteoWeatherAdapter.test.ts
import { OpenMeteoWeatherAdapter } from '../src/services/weather/OpenMeteoWeatherAdapter';
import type { FetchWeatherParams } from '../src/services/weather/types';

function makeFetchResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function baseParams(overrides: Partial<FetchWeatherParams> = {}): FetchWeatherParams {
  return {
    latitude: 51.5,
    longitude: -0.13,
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    timezone: 'Europe/London',
    ...overrides,
  };
}

const FORECAST_BODY = {
  daily: {
    time: ['2026-08-10', '2026-08-11', '2026-08-12'],
    weathercode: [0, 61, 95],
    temperature_2m_max: [22, 18, 16],
    temperature_2m_min: [12, 10, 9],
    precipitation_sum: [0, 4, 12],
    precipitation_probability_max: [5, 60, 90],
    uv_index_max: [9, 3, 2],
    windspeed_10m_max: [10, 15, 40],
  },
};

const ARCHIVE_BODY = {
  daily: {
    time: ['2025-08-10', '2025-08-11', '2025-08-12'],
    weathercode: [0, 3, 71],
    temperature_2m_max: [-1, 2, -5],
    temperature_2m_min: [-8, -6, -12],
    precipitation_sum: [0, 0.5, 3],
    uv_index_max: [1, 1, 0],
    windspeed_10m_max: [5, 8, 12],
  },
};

describe('OpenMeteoWeatherAdapter — endpoint selection', () => {
  it('calls the forecast endpoint when the trip starts within 14 days', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(FORECAST_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-08-01T00:00:00Z');

    await adapter.getWeatherProfile(baseParams({ startDate: '2026-08-10' }), today);

    const calledUrl = new URL(fetchFn.mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(calledUrl.searchParams.get('start_date')).toBe('2026-08-10');
  });

  it('calls the archive endpoint one year back when the trip starts more than 14 days out', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(ARCHIVE_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-01-01T00:00:00Z');

    const profile = await adapter.getWeatherProfile(baseParams({ startDate: '2026-08-10', endDate: '2026-08-12' }), today);

    const calledUrl = new URL(fetchFn.mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe('https://archive-api.open-meteo.com/v1/archive');
    expect(calledUrl.searchParams.get('start_date')).toBe('2025-08-10');
    expect(calledUrl.searchParams.get('end_date')).toBe('2025-08-12');
    expect(profile.isHistoricalEstimate).toBe(true);
    // dates in the returned profile stay the originally-requested ones, not the shifted lookup dates
    expect(profile.dailyBreakdown.map((d) => d.date)).toEqual(['2026-08-10', '2026-08-11', '2026-08-12']);
  });

  it('treats exactly 14 days out as forecast, 15 as archive', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(FORECAST_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-08-01T00:00:00Z');

    await adapter.getWeatherProfile(baseParams({ startDate: '2026-08-15' }), today); // 14 days out
    expect(new URL(fetchFn.mock.calls[0][0] as string).hostname).toBe('api.open-meteo.com');

    fetchFn.mockClear().mockResolvedValue(makeFetchResponse(ARCHIVE_BODY));
    await adapter.getWeatherProfile(baseParams({ startDate: '2026-08-16' }), today); // 15 days out
    expect(new URL(fetchFn.mock.calls[0][0] as string).hostname).toBe('archive-api.open-meteo.com');
  });
});

describe('OpenMeteoWeatherAdapter — mapping', () => {
  it('maps WMO codes to condition strings', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(FORECAST_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-08-01T00:00:00Z');

    const profile = await adapter.getWeatherProfile(baseParams(), today);

    expect(profile.dailyBreakdown.map((d) => d.condition)).toEqual(['sunny', 'rainy', 'thunderstorm']);
  });

  it('computes summary stats from the daily breakdown', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(FORECAST_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-08-01T00:00:00Z');

    const profile = await adapter.getWeatherProfile(baseParams(), today);

    expect(profile.summary.minTempC).toBe(9);
    expect(profile.summary.maxTempC).toBe(22);
    expect(profile.summary.maxRainProbabilityPct).toBe(90);
    expect(profile.summary.totalRainExpectedMm).toBe(16);
  });

  it('derives climate tags including high_uv, rainy, and breezy from summary stats', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(FORECAST_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-08-01T00:00:00Z');

    const profile = await adapter.getWeatherProfile(baseParams(), today);

    expect(profile.summary.climateTags).toEqual(expect.arrayContaining(['rainy', 'high_uv', 'breezy']));
  });

  it('estimates rain probability from precipitation_sum for historical (archive) data', async () => {
    const fetchFn = jest.fn().mockResolvedValue(makeFetchResponse(ARCHIVE_BODY));
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-01-01T00:00:00Z');

    const profile = await adapter.getWeatherProfile(baseParams({ startDate: '2026-08-10', endDate: '2026-08-12' }), today);

    // day 0: 0mm -> 0%, day 1: 0.5mm -> 20%, day 2: 3mm -> 50%
    expect(profile.dailyBreakdown.map((d) => d.rainProbabilityPct)).toEqual([0, 20, 50]);
    expect(profile.summary.climateTags).toEqual(expect.arrayContaining(['freezing']));
  });

  it('throws on a non-ok response', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as Response);
    const adapter = new OpenMeteoWeatherAdapter(fetchFn);
    const today = new Date('2026-08-01T00:00:00Z');

    await expect(adapter.getWeatherProfile(baseParams(), today)).rejects.toThrow('Weather request failed with status 503');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/openMeteoWeatherAdapter.test.ts`
Expected: FAIL with "Cannot find module '../src/services/weather/OpenMeteoWeatherAdapter'"

- [ ] **Step 3: Write the implementation**

```ts
// src/services/weather/OpenMeteoWeatherAdapter.ts
import { daysUntil, shiftYear } from '../../utils/tripDates';
import type { IWeatherProvider } from './interfaces';
import type { ClimateTag, DailyWeather, FetchWeatherParams, WeatherProfile } from './types';

const FORECAST_HORIZON_DAYS = 14;

const DAILY_PARAMS = 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,windspeed_10m_max';

interface OpenMeteoDaily {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max?: number[];
  uv_index_max?: number[];
  windspeed_10m_max?: number[];
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'sunny';
  if ([1, 2, 3, 45, 48].includes(code)) return 'partly_cloudy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  return 'partly_cloudy';
}

function estimateRainProbabilityFromSum(mm: number): number {
  if (mm <= 0) return 0;
  if (mm < 1) return 20;
  if (mm < 5) return 50;
  if (mm < 10) return 70;
  return 90;
}

function mostFrequent(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0];
  let bestCount = 0;
  for (const [v, count] of counts) {
    if (count > bestCount) {
      best = v;
      bestCount = count;
    }
  }
  return best;
}

function deriveClimateTags(
  avgTempC: number,
  minTempC: number,
  maxRainProbabilityPct: number,
  maxWindSpeedKmh: number,
  maxUvIndex: number
): ClimateTag[] {
  const tags: ClimateTag[] = [];
  if (minTempC <= 0) tags.push('freezing');
  else if (avgTempC <= 10) tags.push('cold');
  else if (avgTempC <= 20) tags.push('mild');
  else if (avgTempC <= 28) tags.push('warm');
  else tags.push('hot');

  if (maxRainProbabilityPct >= 40) tags.push('rainy');
  if (maxWindSpeedKmh >= 30) tags.push('breezy');
  if (maxUvIndex >= 8) tags.push('high_uv');
  return tags;
}

export class OpenMeteoWeatherAdapter implements IWeatherProvider {
  constructor(private readonly fetchFn: typeof fetch = globalThis.fetch) {}

  async getWeatherProfile(params: FetchWeatherParams, now: Date = new Date()): Promise<WeatherProfile> {
    const offset = daysUntil(params.startDate, now);
    if (offset <= FORECAST_HORIZON_DAYS) {
      return this.fetchAndBuild('https://api.open-meteo.com/v1/forecast', params, params, false);
    }

    const historicalParams: FetchWeatherParams = {
      ...params,
      startDate: shiftYear(params.startDate, -1),
      endDate: shiftYear(params.endDate, -1),
    };
    // The returned profile is stamped with the *originally requested* dates —
    // the one-year shift is purely an implementation detail of the historical lookup.
    return this.fetchAndBuild('https://archive-api.open-meteo.com/v1/archive', historicalParams, params, true);
  }

  private async fetchAndBuild(
    endpoint: string,
    queryParams: FetchWeatherParams,
    displayParams: FetchWeatherParams,
    isHistoricalEstimate: boolean
  ): Promise<WeatherProfile> {
    const url = new URL(endpoint);
    url.searchParams.set('latitude', String(queryParams.latitude));
    url.searchParams.set('longitude', String(queryParams.longitude));
    url.searchParams.set('start_date', queryParams.startDate);
    url.searchParams.set('end_date', queryParams.endDate);
    url.searchParams.set('timezone', queryParams.timezone);
    url.searchParams.set('daily', isHistoricalEstimate ? DAILY_PARAMS : `precipitation_probability_max,${DAILY_PARAMS}`);

    const response = await this.fetchFn(url.toString());
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }

    const data = (await response.json()) as { daily: OpenMeteoDaily };
    const daily = data.daily;
    const displayDates = this.buildDisplayDates(displayParams, daily.time.length);

    const dailyBreakdown: DailyWeather[] = daily.time.map((_, i) => ({
      date: displayDates[i],
      tempHighC: daily.temperature_2m_max[i],
      tempLowC: daily.temperature_2m_min[i],
      condition: mapWeatherCode(daily.weathercode[i]),
      rainProbabilityPct: isHistoricalEstimate
        ? estimateRainProbabilityFromSum(daily.precipitation_sum[i])
        : daily.precipitation_probability_max?.[i] ?? 0,
      uvIndexMax: daily.uv_index_max?.[i],
    }));

    const highs = dailyBreakdown.map((d) => d.tempHighC);
    const lows = dailyBreakdown.map((d) => d.tempLowC);
    const avgTempC = dailyBreakdown.reduce((sum, d) => sum + (d.tempHighC + d.tempLowC) / 2, 0) / dailyBreakdown.length;
    const minTempC = Math.min(...lows);
    const maxTempC = Math.max(...highs);
    const totalRainExpectedMm = daily.precipitation_sum.reduce((sum, mm) => sum + mm, 0);
    const maxRainProbabilityPct = Math.max(...dailyBreakdown.map((d) => d.rainProbabilityPct));
    const maxWindSpeedKmh = Math.max(...(daily.windspeed_10m_max ?? [0]));
    const maxUvIndex = Math.max(...(daily.uv_index_max ?? [0]));

    return {
      isHistoricalEstimate,
      summary: {
        avgTempC,
        minTempC,
        maxTempC,
        overallCondition: mostFrequent(dailyBreakdown.map((d) => d.condition)),
        totalRainExpectedMm,
        maxRainProbabilityPct,
        climateTags: deriveClimateTags(avgTempC, minTempC, maxRainProbabilityPct, maxWindSpeedKmh, maxUvIndex),
      },
      dailyBreakdown,
    };
  }

  private buildDisplayDates(displayParams: FetchWeatherParams, count: number): string[] {
    const dates: string[] = [];
    const start = new Date(`${displayParams.startDate}T00:00:00Z`);
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/openMeteoWeatherAdapter.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/weather/OpenMeteoWeatherAdapter.ts __tests__/openMeteoWeatherAdapter.test.ts
git commit -m "feat: add Open-Meteo weather adapter with forecast/archive branching"
```

---

### Task 5: TravelPlannerService orchestrator & factory

**Files:**
- Create: `src/services/weather/TravelPlannerService.ts`
- Create: `src/services/weather/factory.ts`
- Test: `__tests__/travelPlannerService.test.ts`

**Interfaces:**
- Consumes: `IGeocodingProvider`, `IWeatherProvider`, `LocationResult`, `WeatherProfile` from Task 1; `OpenMeteoGeocodingAdapter` from Task 3; `OpenMeteoWeatherAdapter` from Task 4; `ClimateType` from `src/types/packing.ts`.
- Produces: `TravelPlannerService` class with `searchLocations(query, limit?)`, `getTripWeather(location, startDate, endDate)`, `deriveClimateType(profile)`; `createTravelPlannerService(): TravelPlannerService`. Used by Task 6 (store).

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/travelPlannerService.test.ts
import { TravelPlannerService } from '../src/services/weather/TravelPlannerService';
import type { IGeocodingProvider, IWeatherProvider } from '../src/services/weather/interfaces';
import type { LocationResult, WeatherProfile } from '../src/services/weather/types';

function makeProfile(overrides: Partial<WeatherProfile['summary']> = {}): WeatherProfile {
  return {
    isHistoricalEstimate: false,
    summary: {
      avgTempC: 15,
      minTempC: 10,
      maxTempC: 20,
      overallCondition: 'sunny',
      totalRainExpectedMm: 0,
      maxRainProbabilityPct: 10,
      climateTags: ['mild'],
      ...overrides,
    },
    dailyBreakdown: [],
  };
}

describe('TravelPlannerService — delegation', () => {
  it('delegates searchLocations to the geocoding provider', async () => {
    const location: LocationResult = {
      id: '1',
      name: 'Rome',
      country: 'Italy',
      countryCode: 'IT',
      latitude: 41.9,
      longitude: 12.5,
      timezone: 'Europe/Rome',
    };
    const geocoding: IGeocodingProvider = { searchLocations: jest.fn().mockResolvedValue([location]) };
    const weather: IWeatherProvider = { getWeatherProfile: jest.fn() };
    const service = new TravelPlannerService(geocoding, weather);

    const results = await service.searchLocations('Rome', 3);

    expect(geocoding.searchLocations).toHaveBeenCalledWith('Rome', 3);
    expect(results).toEqual([location]);
  });

  it('delegates getTripWeather to the weather provider with location coordinates', async () => {
    const location: LocationResult = {
      id: '1',
      name: 'Rome',
      country: 'Italy',
      countryCode: 'IT',
      latitude: 41.9,
      longitude: 12.5,
      timezone: 'Europe/Rome',
    };
    const profile = makeProfile();
    const geocoding: IGeocodingProvider = { searchLocations: jest.fn() };
    const weather: IWeatherProvider = { getWeatherProfile: jest.fn().mockResolvedValue(profile) };
    const service = new TravelPlannerService(geocoding, weather);

    const result = await service.getTripWeather(location, '2026-08-10', '2026-08-12');

    expect(weather.getWeatherProfile).toHaveBeenCalledWith({
      latitude: 41.9,
      longitude: 12.5,
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      timezone: 'Europe/Rome',
    });
    expect(result).toBe(profile);
  });
});

describe('TravelPlannerService — deriveClimateType', () => {
  const service = new TravelPlannerService({ searchLocations: jest.fn() }, { getWeatherProfile: jest.fn() });

  it('returns cold when the freezing tag is present', () => {
    expect(service.deriveClimateType(makeProfile({ climateTags: ['freezing'], maxRainProbabilityPct: 80 }))).toBe('cold');
  });

  it('returns cold when the cold tag is present, even with high rain probability', () => {
    expect(service.deriveClimateType(makeProfile({ climateTags: ['cold'], maxRainProbabilityPct: 90 }))).toBe('cold');
  });

  it('returns rainy when rain probability is high and no cold tag', () => {
    expect(service.deriveClimateType(makeProfile({ climateTags: ['mild'], maxRainProbabilityPct: 50 }))).toBe('rainy');
  });

  it('returns warm when the warm/hot tag is present and rain probability is low', () => {
    expect(service.deriveClimateType(makeProfile({ climateTags: ['warm'], maxRainProbabilityPct: 10 }))).toBe('warm');
    expect(service.deriveClimateType(makeProfile({ climateTags: ['hot'], maxRainProbabilityPct: 10 }))).toBe('warm');
  });

  it('returns mild otherwise', () => {
    expect(service.deriveClimateType(makeProfile({ climateTags: ['mild'], maxRainProbabilityPct: 10 }))).toBe('mild');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/travelPlannerService.test.ts`
Expected: FAIL with "Cannot find module '../src/services/weather/TravelPlannerService'"

- [ ] **Step 3: Write the implementation**

```ts
// src/services/weather/TravelPlannerService.ts
import type { ClimateType } from '../../types/packing';
import type { IGeocodingProvider, IWeatherProvider } from './interfaces';
import type { LocationResult, WeatherProfile } from './types';

export class TravelPlannerService {
  constructor(
    private readonly geocodingProvider: IGeocodingProvider,
    private readonly weatherProvider: IWeatherProvider
  ) {}

  searchLocations(query: string, limit?: number): Promise<LocationResult[]> {
    return this.geocodingProvider.searchLocations(query, limit);
  }

  getTripWeather(location: LocationResult, startDate: string, endDate: string): Promise<WeatherProfile> {
    return this.weatherProvider.getWeatherProfile({
      latitude: location.latitude,
      longitude: location.longitude,
      startDate,
      endDate,
      timezone: location.timezone,
    });
  }

  /** Collapses the rich climate tag set into the packing engine's single ClimateType. */
  deriveClimateType(profile: WeatherProfile): ClimateType {
    const tags = profile.summary.climateTags;
    if (tags.includes('freezing') || tags.includes('cold')) return 'cold';
    if (profile.summary.maxRainProbabilityPct >= 50) return 'rainy';
    if (tags.includes('hot') || tags.includes('warm')) return 'warm';
    return 'mild';
  }
}
```

```ts
// src/services/weather/factory.ts
import { OpenMeteoGeocodingAdapter } from './OpenMeteoGeocodingAdapter';
import { OpenMeteoWeatherAdapter } from './OpenMeteoWeatherAdapter';
import { TravelPlannerService } from './TravelPlannerService';

export function createTravelPlannerService(): TravelPlannerService {
  return new TravelPlannerService(new OpenMeteoGeocodingAdapter(), new OpenMeteoWeatherAdapter());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/travelPlannerService.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/weather/TravelPlannerService.ts src/services/weather/factory.ts __tests__/travelPlannerService.test.ts
git commit -m "feat: add TravelPlannerService orchestrator and provider factory"
```

---

### Task 6: TripConfig fields, store actions, and default config

**Files:**
- Modify: `src/types/packing.ts`
- Modify: `src/state/useTripStore.ts`
- Modify: `__tests__/packingEngine.test.ts` (its `makeConfig` helper builds a full `TripConfig` literal and will fail to type-check once `startDate`/`endDate` become required)
- Test: `__tests__/useTripStore.test.ts`

**Interfaces:**
- Consumes: `LocationResult`, `WeatherProfile` from Task 1; `TravelPlannerService`/`createTravelPlannerService` from Task 5; `computeDurationDays`, `toISODateString` from Task 2.
- Produces: `TripConfig.location?`, `TripConfig.startDate`, `TripConfig.endDate`, `TripConfig.weatherProfile?`; store actions `setTripDates(startDate, endDate)`, `selectLocation(location)`, `fetchWeather()`; store field `weatherLookupError: string | null`. Used by Task 8/9/10 (UI components).

- [ ] **Step 1: Update `TripConfig`**

```ts
// src/types/packing.ts — add near the top, after existing imports (there are none currently, so add):
import type { LocationResult, WeatherProfile } from '../services/weather/types';
```

Then update the interface:

```ts
export interface TripConfig {
  destination: string;
  location?: LocationResult;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  airlineId?: string;
  climate: ClimateType;
  durationDays: number;
  weatherProfile?: WeatherProfile;
  travelers: Traveler[];
  checkedBags: number; // ~23kg capacity each
  cabinBags: number; // ~10kg capacity each
  laundryAvailable: boolean;
  toiletryStrategy: ToiletryStrategy;
  activities: ActivityType[];
}
```

- [ ] **Step 2: Fix `makeConfig` in the existing packing engine test so it still type-checks**

In `__tests__/packingEngine.test.ts`, update `makeConfig`:

```ts
function makeConfig(overrides: Partial<TripConfig> = {}): TripConfig {
  return {
    destination: 'Test City',
    startDate: '2026-08-06',
    endDate: '2026-08-10',
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
```

(Only the two new required fields are added; `durationDays` stays independently overridable since these tests intentionally set it directly rather than deriving it from dates.)

- [ ] **Step 3: Run the existing packing engine tests to confirm nothing broke**

Run: `npx jest __tests__/packingEngine.test.ts`
Expected: PASS (all pre-existing tests, unchanged behavior)

- [ ] **Step 4: Write the failing store tests**

```ts
// __tests__/useTripStore.test.ts
const mockSearchLocations = jest.fn();
const mockGetTripWeather = jest.fn();
const mockDeriveClimateType = jest.fn();

jest.mock('../src/services/weather/factory', () => ({
  createTravelPlannerService: () => ({
    searchLocations: mockSearchLocations,
    getTripWeather: mockGetTripWeather,
    deriveClimateType: mockDeriveClimateType,
  }),
}));

import { useTripStore } from '../src/state/useTripStore';
import type { LocationResult } from '../src/services/weather/types';

const LONDON: LocationResult = {
  id: '1',
  name: 'London',
  country: 'United Kingdom',
  countryCode: 'GB',
  latitude: 51.5,
  longitude: -0.13,
  timezone: 'Europe/London',
};

beforeEach(() => {
  useTripStore.getState().resetWizard();
  mockSearchLocations.mockReset();
  mockGetTripWeather.mockReset();
  mockDeriveClimateType.mockReset();
});

describe('setTripDates', () => {
  it('updates dates and recomputes durationDays', () => {
    useTripStore.getState().setTripDates('2026-08-10', '2026-08-16');
    const { draftConfig } = useTripStore.getState();
    expect(draftConfig.startDate).toBe('2026-08-10');
    expect(draftConfig.endDate).toBe('2026-08-16');
    expect(draftConfig.durationDays).toBe(7);
  });

  it('is a no-op when endDate is before startDate', () => {
    const before = useTripStore.getState().draftConfig;
    useTripStore.getState().setTripDates('2026-08-16', '2026-08-10');
    expect(useTripStore.getState().draftConfig).toEqual(before);
  });
});

describe('selectLocation', () => {
  it('sets location and destination, then triggers a weather fetch', async () => {
    mockGetTripWeather.mockResolvedValue({
      isHistoricalEstimate: false,
      summary: {
        avgTempC: 20,
        minTempC: 15,
        maxTempC: 25,
        overallCondition: 'sunny',
        totalRainExpectedMm: 0,
        maxRainProbabilityPct: 5,
        climateTags: ['warm'],
      },
      dailyBreakdown: [],
    });
    mockDeriveClimateType.mockReturnValue('warm');

    useTripStore.getState().selectLocation(LONDON);
    await Promise.resolve();
    await Promise.resolve();

    const { draftConfig } = useTripStore.getState();
    expect(draftConfig.location).toEqual(LONDON);
    expect(draftConfig.destination).toBe('London');
    expect(draftConfig.climate).toBe('warm');
    expect(mockGetTripWeather).toHaveBeenCalled();
  });
});

describe('fetchWeather', () => {
  it('does nothing when no location is selected', async () => {
    await useTripStore.getState().fetchWeather();
    expect(mockGetTripWeather).not.toHaveBeenCalled();
  });

  it('sets weatherProfile and climate on success', async () => {
    useTripStore.setState((state) => ({ draftConfig: { ...state.draftConfig, location: LONDON } }));
    const profile = {
      isHistoricalEstimate: true,
      summary: {
        avgTempC: 2,
        minTempC: -3,
        maxTempC: 5,
        overallCondition: 'snowy',
        totalRainExpectedMm: 0,
        maxRainProbabilityPct: 10,
        climateTags: ['cold' as const],
      },
      dailyBreakdown: [],
    };
    mockGetTripWeather.mockResolvedValue(profile);
    mockDeriveClimateType.mockReturnValue('cold');

    await useTripStore.getState().fetchWeather();

    const { draftConfig, weatherLookupError } = useTripStore.getState();
    expect(draftConfig.weatherProfile).toEqual(profile);
    expect(draftConfig.climate).toBe('cold');
    expect(weatherLookupError).toBeNull();
  });

  it('sets weatherLookupError and leaves climate unchanged on failure', async () => {
    useTripStore.setState((state) => ({ draftConfig: { ...state.draftConfig, location: LONDON, climate: 'mild' } }));
    mockGetTripWeather.mockRejectedValue(new Error('network down'));

    await useTripStore.getState().fetchWeather();

    const { draftConfig, weatherLookupError } = useTripStore.getState();
    expect(draftConfig.climate).toBe('mild');
    expect(weatherLookupError).toBe('network down');
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npx jest __tests__/useTripStore.test.ts`
Expected: FAIL — `setTripDates`/`selectLocation`/`fetchWeather`/`weatherLookupError` don't exist yet

- [ ] **Step 6: Update `useTripStore.ts`**

```ts
// src/state/useTripStore.ts — add imports at top:
import { computeDurationDays, toISODateString } from '../utils/tripDates';
import { createTravelPlannerService } from '../services/weather/factory';
import type { LocationResult } from '../services/weather/types';

const travelPlannerService = createTravelPlannerService();
```

Update `defaultDraftConfig`:

```ts
function defaultDraftConfig(): TripConfig {
  const start = new Date();
  const startDate = toISODateString(start);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endDate = toISODateString(end);

  return {
    destination: '',
    location: undefined,
    startDate,
    endDate,
    airlineId: undefined,
    climate: 'mild',
    durationDays: computeDurationDays(startDate, endDate),
    weatherProfile: undefined,
    travelers: [],
    checkedBags: 1,
    cabinBags: 1,
    laundryAvailable: false,
    toiletryStrategy: 'pack',
    activities: [],
  };
}
```

Add `weatherLookupError: string | null` to `TripStoreState` and its initial value:

```ts
interface TripStoreState {
  wizardStep: number;
  draftConfig: TripConfig;
  currentPlan: PackingPlan | null;
  savedTrips: SavedTrip[];
  hydrated: boolean;
  weatherLookupError: string | null;

  hydrate: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  updateDraftConfig: (partial: Partial<TripConfig>) => void;
  setTripDates: (startDate: string, endDate: string) => void;
  selectLocation: (location: LocationResult) => void;
  fetchWeather: () => Promise<void>;
  addTraveler: () => void;
  removeTraveler: (id: string) => void;
  updateTraveler: (id: string, partial: Partial<Traveler>) => void;
  selectAirline: (airlineId: string | undefined) => void;
  computePlan: () => void;
  toggleItemPacked: (itemId: string) => void;
  saveTrip: (name: string) => Promise<void>;
  loadTrip: (id: string) => void;
  deleteTrip: (id: string) => Promise<void>;
  resetWizard: () => void;
}
```

Add to the store body (near `updateDraftConfig`):

```ts
  weatherLookupError: null,

  setTripDates: (startDate, endDate) => {
    if (endDate < startDate) return;
    const durationDays = computeDurationDays(startDate, endDate);
    set((state) => ({ draftConfig: { ...state.draftConfig, startDate, endDate, durationDays } }));
  },

  selectLocation: (location) => {
    set((state) => ({ draftConfig: { ...state.draftConfig, location, destination: location.name } }));
    void get().fetchWeather();
  },

  fetchWeather: async () => {
    const { draftConfig } = get();
    if (!draftConfig.location) return;
    set({ weatherLookupError: null });
    try {
      const profile = await travelPlannerService.getTripWeather(draftConfig.location, draftConfig.startDate, draftConfig.endDate);
      const climate = travelPlannerService.deriveClimateType(profile);
      set((state) => ({ draftConfig: { ...state.draftConfig, weatherProfile: profile, climate } }));
    } catch (error) {
      set({ weatherLookupError: error instanceof Error ? error.message : 'Failed to fetch weather.' });
    }
  },
```

And update `resetWizard` to also clear `weatherLookupError`:

```ts
  resetWizard: () => {
    set({ wizardStep: MIN_WIZARD_STEP, draftConfig: defaultDraftConfig(), currentPlan: null, weatherLookupError: null });
  },
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx jest __tests__/useTripStore.test.ts __tests__/packingEngine.test.ts`
Expected: PASS (all tests, including the untouched packing engine suite)

- [ ] **Step 8: Run the full suite and typecheck**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS with no type errors

- [ ] **Step 9: Commit**

```bash
git add src/types/packing.ts src/state/useTripStore.ts __tests__/packingEngine.test.ts __tests__/useTripStore.test.ts
git commit -m "feat: add trip dates, location, and weather fetch to trip store"
```

---

### Task 7: Install the date picker dependency

**Files:**
- Modify: `package.json`, `package-lock.json` (via `expo install`)

- [ ] **Step 1: Install via Expo's version-pinned installer**

Run: `npx expo install @react-native-community/datetimepicker`
Expected: adds `@react-native-community/datetimepicker` to `package.json` dependencies at the SDK-54-compatible version

- [ ] **Step 2: Verify install**

Run: `grep datetimepicker package.json`
Expected: shows the new dependency line

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @react-native-community/datetimepicker dependency"
```

---

### Task 8: LocationSearchInput component

**Files:**
- Create: `src/components/LocationSearchInput.tsx`

**Interfaces:**
- Consumes: `LocationResult` from Task 1; `createTravelPlannerService` from Task 5.
- Produces: `LocationSearchInput` component, props `{ initialQuery: string; onSelect: (location: LocationResult) => void }`. Used by Task 10.

No unit test — this is a leaf UI component verified manually in Task 11 (matches how `AirlinePicker`/`SelectableChip` are tested in this codebase: no dedicated component tests, verified through the running app).

- [ ] **Step 1: Write the component**

```tsx
// src/components/LocationSearchInput.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { List, Text, TextInput, useTheme } from 'react-native-paper';
import { createTravelPlannerService } from '../services/weather/factory';
import type { LocationResult } from '../services/weather/types';

const DEBOUNCE_MS = 350;

interface LocationSearchInputProps {
  initialQuery: string;
  onSelect: (location: LocationResult) => void;
}

export function LocationSearchInput({ initialQuery, onSelect }: LocationSearchInputProps) {
  const theme = useTheme();
  const service = useMemo(() => createTravelPlannerService(), []);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChangeText(text: string) {
    setQuery(text);
    setDropdownOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await service.searchLocations(text);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(location: LocationResult) {
    setQuery(location.name);
    setResults([]);
    setDropdownOpen(false);
    onSelect(location);
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Destination"
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => setDropdownOpen(true)}
        mode="outlined"
        right={loading ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> : undefined}
      />
      {dropdownOpen && results.length > 0 ? (
        <View style={[styles.dropdown, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
          {results.map((location) => (
            <Pressable key={location.id} onPress={() => handleSelect(location)}>
              <List.Item
                title={location.name}
                description={location.country}
                left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
      {dropdownOpen && !loading && query.trim() && results.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptyHint}>
          No matching locations — try a different spelling.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  dropdown: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyHint: {
    paddingHorizontal: 4,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/LocationSearchInput.tsx
git commit -m "feat: add debounced location search input with dropdown results"
```

---

### Task 9: TripDateRangePicker component

**Files:**
- Create: `src/components/TripDateRangePicker.tsx`

**Interfaces:**
- Consumes: `parseISODate`, `toISODateString` from Task 2.
- Produces: `TripDateRangePicker` component, props `{ startDate: string; endDate: string; onChange: (startDate: string, endDate: string) => void }`. Used by Task 10.

No unit test — native picker UI, verified manually in Task 11.

- [ ] **Step 1: Write the component**

```tsx
// src/components/TripDateRangePicker.tsx
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { parseISODate, toISODateString } from '../utils/tripDates';

interface TripDateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

type ActivePicker = 'start' | 'end' | null;

function formatDisplayDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function TripDateRangePicker({ startDate, endDate, onChange }: TripDateRangePickerProps) {
  const theme = useTheme();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const isInvalidRange = endDate < startDate;

  function handleChange(event: DateTimePickerEvent, selected: Date | undefined) {
    if (Platform.OS === 'android') {
      setActivePicker(null);
      if (event.type !== 'set' || !selected) return;
    }
    if (!selected) return;

    const iso = toISODateString(selected);
    if (activePicker === 'start') {
      onChange(iso, endDate < iso ? iso : endDate);
    } else if (activePicker === 'end') {
      onChange(startDate, iso);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable style={[styles.dateBox, { borderColor: theme.colors.outline }]} onPress={() => setActivePicker('start')}>
          <Text variant="labelMedium">Start date</Text>
          <Text variant="titleMedium">{formatDisplayDate(startDate)}</Text>
        </Pressable>
        <Pressable style={[styles.dateBox, { borderColor: theme.colors.outline }]} onPress={() => setActivePicker('end')}>
          <Text variant="labelMedium">End date</Text>
          <Text variant="titleMedium">{formatDisplayDate(endDate)}</Text>
        </Pressable>
      </View>

      {isInvalidRange ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          End date must be on or after the start date.
        </Text>
      ) : null}

      {activePicker ? (
        <DateTimePicker
          value={parseISODate(activePicker === 'start' ? startDate : endDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={activePicker === 'end' ? parseISODate(startDate) : undefined}
          onChange={handleChange}
        />
      ) : null}

      {activePicker && Platform.OS === 'ios' ? (
        <Button mode="text" onPress={() => setActivePicker(null)}>
          Done
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 12,
    gap: 2,
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS with no type errors

- [ ] **Step 3: Commit**

```bash
git add src/components/TripDateRangePicker.tsx
git commit -m "feat: add trip date range picker component"
```

---

### Task 10: Rewrite Step1LogisticsAirline to use location search, dates, and weather

**Files:**
- Modify: `src/screens/wizard/Step1LogisticsAirline.tsx`

**Interfaces:**
- Consumes: `LocationSearchInput` (Task 8), `TripDateRangePicker` (Task 9), `useTripStore` fields/actions `selectLocation`, `setTripDates`, `weatherLookupError` (Task 6).

- [ ] **Step 1: Rewrite the screen**

```tsx
// src/screens/wizard/Step1LogisticsAirline.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { WizardStepLayout } from '../../components/WizardStepLayout';
import { AirlinePicker } from '../../components/AirlinePicker';
import { LocationSearchInput } from '../../components/LocationSearchInput';
import { TripDateRangePicker } from '../../components/TripDateRangePicker';
import { SelectableChip } from '../../components/SelectableChip';
import { useTripStore } from '../../state/useTripStore';
import type { ClimateType } from '../../types/packing';

const CLIMATE_OPTIONS: { value: ClimateType; label: string; icon: string }[] = [
  { value: 'warm', label: 'Warm/Sunny', icon: 'weather-sunny' },
  { value: 'mild', label: 'Mild/Temperate', icon: 'weather-partly-cloudy' },
  { value: 'cold', label: 'Cold/Snow', icon: 'snowflake' },
  { value: 'rainy', label: 'Rainy', icon: 'weather-rainy' },
];

export function Step1LogisticsAirline() {
  const draftConfig = useTripStore((s) => s.draftConfig);
  const updateDraftConfig = useTripStore((s) => s.updateDraftConfig);
  const selectAirline = useTripStore((s) => s.selectAirline);
  const selectLocation = useTripStore((s) => s.selectLocation);
  const setTripDates = useTripStore((s) => s.setTripDates);
  const weatherLookupError = useTripStore((s) => s.weatherLookupError);
  const nextStep = useTripStore((s) => s.nextStep);

  return (
    <WizardStepLayout title="Logistics & Airline" stepNumber={1} totalSteps={5} onNext={nextStep}>
      <LocationSearchInput initialQuery={draftConfig.destination} onSelect={selectLocation} />

      <Text variant="titleMedium">Trip Dates</Text>
      <TripDateRangePicker startDate={draftConfig.startDate} endDate={draftConfig.endDate} onChange={setTripDates} />

      <Text variant="titleMedium">Climate</Text>
      {draftConfig.weatherProfile ? (
        <Text variant="bodySmall" style={styles.weatherHint}>
          {draftConfig.weatherProfile.isHistoricalEstimate
            ? 'Estimated from last year’s weather for these dates.'
            : 'Estimated from the current forecast.'}
        </Text>
      ) : null}
      {weatherLookupError ? (
        <Text variant="bodySmall" style={styles.errorHint}>
          Couldn&apos;t fetch weather ({weatherLookupError}) — pick a climate below.
        </Text>
      ) : null}
      <View style={styles.chipRow}>
        {CLIMATE_OPTIONS.map((option) => (
          <SelectableChip
            key={option.value}
            label={option.label}
            icon={option.icon}
            selected={draftConfig.climate === option.value}
            onPress={() => updateDraftConfig({ climate: option.value })}
          />
        ))}
      </View>

      <Text variant="titleMedium">Airline</Text>
      <AirlinePicker selectedAirlineId={draftConfig.airlineId} onSelect={selectAirline} />
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weatherHint: {
    fontStyle: 'italic',
  },
  errorHint: {
    color: '#B3261E',
  },
});
```

- [ ] **Step 2: Typecheck and run the full test suite**

Run: `npx tsc --noEmit && npx jest`
Expected: PASS with no type errors, all tests green

- [ ] **Step 3: Commit**

```bash
git add src/screens/wizard/Step1LogisticsAirline.tsx
git commit -m "feat: wire location search and weather-driven climate into Step 1"
```

---

### Task 11: Manual verification in the running app

**Files:** none (verification only)

- [ ] **Step 1: Start the Expo dev server**

Use the `run` skill (or `npx expo start`) to launch the app and open Step 1 of the wizard.

- [ ] **Step 2: Verify location search**

Type a city name (e.g. "London") into the destination field. Confirm a dropdown of matching results appears within ~1 second of pausing typing, and selecting one fills the field and closes the dropdown.

- [ ] **Step 3: Verify short-term forecast path**

With a location selected and trip dates within the next 14 days, confirm a climate chip auto-selects shortly after picking the location, with the "Estimated from the current forecast." caption shown.

- [ ] **Step 4: Verify long-term historical path**

Set the start date more than 14 days out. Confirm the climate chip still auto-selects, now with the "Estimated from last year's weather for these dates." caption.

- [ ] **Step 5: Verify manual override still works**

Tap a different climate chip after an auto-selection. Confirm it switches immediately and stays selected (not overwritten back).

- [ ] **Step 6: Verify offline/failure fallback**

Disable network (airplane mode or dev-server network throttling) and select a new location. Confirm the inline "Couldn't fetch weather" message appears and the climate chips remain fully tappable — the wizard is not blocked.

- [ ] **Step 7: Verify date validation**

Try setting an end date before the start date. Confirm the picker's `minimumDate` constraint prevents it, or the inline validation message appears and `Next` still functions correctly with valid dates.

- [ ] **Step 8: Report results**

No commit for this task — if any issue is found, fix it as a follow-up commit referencing which step of verification caught it.
