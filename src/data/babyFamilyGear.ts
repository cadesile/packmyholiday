import type { PackingItem } from '../types/packing';

export interface BabyFamilyGearSpec {
  id: string;
  name: string;
  category: PackingItem['category'];
  iconName: string;
  quantityFormula: () => number;
  baseWeightGrams: number;
}

// Once-per-trip gear shared across the whole family when any traveler is
// an infant or toddler — not duplicated per baby traveler.
export const BABY_FAMILY_GEAR: BabyFamilyGearSpec[] = [
  {
    id: 'baby_stroller',
    name: 'Travel Stroller / Buggy',
    category: 'essentials',
    iconName: 'baby-carriage',
    quantityFormula: () => 1,
    baseWeightGrams: 6500,
  },
  {
    id: 'baby_carrier',
    name: 'Baby Carrier / Wrap',
    category: 'essentials',
    iconName: 'human-child',
    quantityFormula: () => 1,
    baseWeightGrams: 500,
  },
  {
    id: 'baby_blackout_blind',
    name: 'Blackout Blind',
    category: 'essentials',
    iconName: 'blinds',
    quantityFormula: () => 1,
    baseWeightGrams: 150,
  },
  {
    id: 'baby_monitor',
    name: 'Baby Monitor',
    category: 'electronics',
    iconName: 'monitor-eye',
    quantityFormula: () => 1,
    baseWeightGrams: 300,
  },
  {
    id: 'baby_pain_reliever',
    name: 'Infant/Child Pain Reliever + Syringe',
    category: 'toiletries',
    iconName: 'pill',
    quantityFormula: () => 1,
    baseWeightGrams: 60,
  },
  {
    id: 'baby_thermometer',
    name: 'Digital Thermometer',
    category: 'toiletries',
    iconName: 'thermometer',
    quantityFormula: () => 1,
    baseWeightGrams: 50,
  },
  {
    id: 'baby_first_aid_kit',
    name: 'Baby First Aid Kit (antiseptic, band-aids, nail clippers)',
    category: 'toiletries',
    iconName: 'medical-bag',
    quantityFormula: () => 1,
    baseWeightGrams: 100,
  },
  {
    id: 'baby_rehydration_salts',
    name: 'Rehydration Salts / Nasal Saline Spray',
    category: 'toiletries',
    iconName: 'cup-water',
    quantityFormula: () => 1,
    baseWeightGrams: 80,
  },
];
