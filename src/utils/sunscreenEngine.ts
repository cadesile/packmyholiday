import type { ActivityType, ClimateType, Traveler } from '../types/packing';
import {
  CARRY_ON_LIQUID_LIMIT_ML,
  SUNSCREEN_BOTTLE_SIZE_ML,
  SUNSCREEN_DENSITY_G_PER_ML,
  SUNSCREEN_SINGLE_DOSE_ML,
} from '../data/weightConstants';
import { roundWeight } from './rounding';

export interface SunscreenResult {
  totalVolumeMl: number;
  bottleCount200ml: number;
  totalWeightGrams: number;
  recommendationNote: string;
  mustBuyOnArrival: boolean;
}

function appsPerDayFor(traveler: Traveler, isBeach: boolean, isExploring: boolean): number {
  if (isBeach) {
    return traveler.ageGroup === 'child' ? 4 : 3;
  }
  if (isExploring) {
    return traveler.ageGroup === 'child' ? 2 : 1;
  }
  return 1;
}

export function calculateSunscreenRequirements(
  travelers: Traveler[],
  activities: ActivityType[],
  durationDays: number,
  isCarryOnOnly: boolean,
  climate: ClimateType
): SunscreenResult {
  if (climate !== 'warm') {
    return {
      totalVolumeMl: 0,
      bottleCount200ml: 0,
      totalWeightGrams: 0,
      recommendationNote: '',
      mustBuyOnArrival: false,
    };
  }

  const isBeach = activities.includes('beach');
  const isExploring = activities.includes('exploring');

  let totalVolumeMl = 0;
  let hasSensitiveSkinTraveler = false;

  for (const traveler of travelers) {
    const singleDoseMl = SUNSCREEN_SINGLE_DOSE_ML[traveler.ageGroup];
    const appsPerDay = appsPerDayFor(traveler, isBeach, isExploring);
    totalVolumeMl += singleDoseMl * appsPerDay * durationDays;

    if (traveler.sensitiveSkin || traveler.ageGroup === 'infant') {
      hasSensitiveSkinTraveler = true;
    }
  }

  const bottleCount200ml = Math.ceil(totalVolumeMl / SUNSCREEN_BOTTLE_SIZE_ML);
  const totalWeightGrams = roundWeight(totalVolumeMl * SUNSCREEN_DENSITY_G_PER_ML);

  const mustBuyOnArrival = isCarryOnOnly && totalVolumeMl > CARRY_ON_LIQUID_LIMIT_ML;

  let recommendationNote = `Calculated ${totalVolumeMl}ml (${bottleCount200ml}x ${SUNSCREEN_BOTTLE_SIZE_ML}ml bottles) based on group skin exposure.`;
  if (hasSensitiveSkinTraveler) {
    recommendationNote += ' Use a mineral/sensitive-formula SPF 50+ product for sensitive-skin travelers and infants.';
  }
  if (mustBuyOnArrival) {
    recommendationNote += ' Carry-on liquid limit exceeded — buy sunscreen on arrival at destination.';
  }

  return {
    totalVolumeMl,
    bottleCount200ml,
    totalWeightGrams,
    recommendationNote,
    mustBuyOnArrival,
  };
}
