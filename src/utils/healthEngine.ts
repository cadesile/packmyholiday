import type { ActivityType, ClimateType, PackingItem } from '../types/packing';
import type { IdGenerator } from './id';

export function generateHealthAndBugItems(
  climate: ClimateType,
  activities: ActivityType[],
  travelerCount: number,
  idGen: IdGenerator
): PackingItem[] {
  const items: PackingItem[] = [];

  const requiresBugSpray = climate === 'warm' || climate === 'rainy' || activities.includes('hiking');

  if (requiresBugSpray && travelerCount > 0) {
    const bottleQty = Math.ceil(travelerCount / 2);
    items.push({
      id: idGen(),
      name: 'Insect Repellent Spray (50% DEET or Picaridin)',
      category: 'toiletries',
      quantity: bottleQty,
      estimatedWeightGrams: bottleQty * 150,
      packed: false,
      iconName: 'bug',
    });
  }

  if ((activities.includes('hiking') || activities.includes('exploring')) && travelerCount > 0) {
    items.push({
      id: idGen(),
      name: 'Blister Plasters & Antiseptic Wipes',
      category: 'essentials',
      quantity: 1,
      estimatedWeightGrams: 100,
      packed: false,
      iconName: 'bandage',
    });
  }

  return items;
}
