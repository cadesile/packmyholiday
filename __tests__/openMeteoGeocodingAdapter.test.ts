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
