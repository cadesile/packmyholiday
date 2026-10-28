# Services and external APIs

The only service layer is `src/services/weather/`, and the only external dependency is the free Open-Meteo API (no API key, no auth header, no env vars). Domain types are in `../../03_data/output/entities.md`. Pure logic services (`packingEngine`, `healthEngine`, `sunscreenEngine`) are documented there and have no I/O.

## Structure
| File | Role |
|---|---|
| `interfaces.ts` | `IGeocodingProvider.searchLocations(query, limit?)` and `IWeatherProvider.getWeatherProfile(params)` |
| `OpenMeteoGeocodingAdapter.ts` / `OpenMeteoWeatherAdapter.ts` | The two implementations. Each takes an injectable `fetchFn` (default `globalThis.fetch`) so tests can stub the network |
| `TravelPlannerService.ts` | Orchestrator over both providers: `searchLocations`, `getTripWeather(location, start, end)` and `deriveClimateType(profile)` |
| `factory.ts` | `createTravelPlannerService()` builds the service from the two Open-Meteo adapters (the single place to swap providers) |
| `types.ts` | `LocationResult`, `WeatherProfile`, `DailyWeather`, `ClimateTag`, `FetchWeatherParams` |

## Callers
- `state/useTripStore` → `getTripWeather` (via `fetchWeather`, run on location select and on date change when a location is set) and `deriveClimateType`; the instance is created lazily.
- `components/LocationSearchInput` → `searchLocations`, with its own service instance and a 350 ms debounce.

## Geocoding — `GET https://geocoding-api.open-meteo.com/v1/search`
Query params: `name` (trimmed), `count` (default 5), `language=en`, `format=json`. A blank query returns `[]` without a request. A non-OK response throws `Geocoding request failed with status N`. Results map `id/name/country/country_code/latitude/longitude/timezone` to `LocationResult` (missing country/timezone become `''` / `'UTC'`).

## Weather — Open-Meteo forecast or archive
`getWeatherProfile(params, now = new Date())` chooses the endpoint by `daysUntil(startDate) <= 14` (past start dates also take this branch):
- **Forecast** `https://api.open-meteo.com/v1/forecast`, includes `precipitation_probability_max`; `isHistoricalEstimate: false`.
- **Archive** `https://archive-api.open-meteo.com/v1/archive` with both dates shifted back one year; `isHistoricalEstimate: true`. Rain probability is estimated from daily precipitation sums (0 mm → 0%, <1 → 20, <5 → 50, <10 → 70, otherwise 90). The returned profile carries the originally requested dates.

Both request `daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,windspeed_10m_max` plus `latitude`, `longitude`, `start_date`, `end_date`, `timezone`. A non-OK response throws `Weather request failed with status N`.

### Derived values
- Condition from WMO code: 0 sunny; 1, 2, 3, 45, 48 partly_cloudy; the drizzle/rain/shower codes rainy; snow codes snowy; 95, 96, 99 thunderstorm; anything else partly_cloudy.
- Climate tags: min ≤ 0 °C `freezing`; else average ≤ 10 `cold`, ≤ 20 `mild`, ≤ 28 `warm`, otherwise `hot`; plus `rainy` (max rain probability ≥ 40%), `breezy` (wind ≥ 30 km/h) and `high_uv` (UV ≥ 8).
- `deriveClimateType`: freezing or cold → `cold`; else max rain probability ≥ 50% → `rainy`; else hot or warm → `warm`; otherwise `mild`. (The `rainy` tag threshold is 40%, the `rainy` climate threshold 50%.)

## Error handling
Adapters throw on non-OK responses; the store catches in `fetchWeather` and keeps the message in `weatherLookupError` (shown in Step 1; the user then picks a climate manually). No retries, timeouts or caching exist. `LocationSearchInput` swallows its own search errors (it clears the results, so the user sees no matches rather than an error).

## Tests
`__tests__/openMeteoGeocodingAdapter.test.ts`, `openMeteoWeatherAdapter.test.ts`, `travelPlannerService.test.ts`.

## No OpenAPI/Swagger
No OpenAPI or Swagger file exists, so there is no `api-spec.md` for this stage.
