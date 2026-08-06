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
