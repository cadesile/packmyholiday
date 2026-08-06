import { OpenMeteoGeocodingAdapter } from './OpenMeteoGeocodingAdapter';
import { OpenMeteoWeatherAdapter } from './OpenMeteoWeatherAdapter';
import { TravelPlannerService } from './TravelPlannerService';

export function createTravelPlannerService(): TravelPlannerService {
  return new TravelPlannerService(new OpenMeteoGeocodingAdapter(), new OpenMeteoWeatherAdapter());
}
