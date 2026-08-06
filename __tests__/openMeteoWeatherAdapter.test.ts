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
