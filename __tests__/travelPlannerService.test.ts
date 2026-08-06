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
