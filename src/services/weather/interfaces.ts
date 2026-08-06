import type { FetchWeatherParams, LocationResult, WeatherProfile } from './types';

export interface IGeocodingProvider {
  searchLocations(query: string, limit?: number): Promise<LocationResult[]>;
}

export interface IWeatherProvider {
  getWeatherProfile(params: FetchWeatherParams): Promise<WeatherProfile>;
}
