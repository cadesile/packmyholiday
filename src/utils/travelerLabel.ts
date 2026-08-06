import type { AgeGroup, Traveler } from '../types/packing';

function capitalize(ageGroup: AgeGroup): string {
  return ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1);
}

// Builds a per-traveler display label ordinal within their age group, e.g.
// two adults + one child => { adultId1: 'Adult 1', adultId2: 'Adult 2', childId: 'Child 1' }.
export function buildTravelerLabels(travelers: Traveler[]): Record<string, string> {
  const counts: Partial<Record<AgeGroup, number>> = {};
  const labels: Record<string, string> = {};

  for (const traveler of travelers) {
    const nextCount = (counts[traveler.ageGroup] ?? 0) + 1;
    counts[traveler.ageGroup] = nextCount;
    labels[traveler.id] = `${capitalize(traveler.ageGroup)} ${nextCount}`;
  }

  return labels;
}
