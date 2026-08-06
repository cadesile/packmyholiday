import { buildTravelerLabels } from '../src/utils/travelerLabel';
import type { Traveler } from '../src/types/packing';

function traveler(id: string, ageGroup: Traveler['ageGroup']): Traveler {
  return { id, ageGroup, style: 'unisex' };
}

describe('buildTravelerLabels', () => {
  it('assigns per-age-group ordinals in traveler order', () => {
    const labels = buildTravelerLabels([
      traveler('a1', 'adult'),
      traveler('a2', 'adult'),
      traveler('c1', 'child'),
      traveler('i1', 'infant'),
    ]);
    expect(labels).toEqual({
      a1: 'Adult 1',
      a2: 'Adult 2',
      c1: 'Child 1',
      i1: 'Infant 1',
    });
  });

  it('returns an empty map for no travelers', () => {
    expect(buildTravelerLabels([])).toEqual({});
  });
});
