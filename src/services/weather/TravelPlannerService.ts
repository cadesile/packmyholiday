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
