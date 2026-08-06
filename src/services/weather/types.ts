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
