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
