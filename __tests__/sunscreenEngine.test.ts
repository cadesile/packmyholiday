import { calculateSunscreenRequirements } from '../src/utils/sunscreenEngine';
import type { Traveler } from '../src/types/packing';

const adult = (overrides: Partial<Traveler> = {}): Traveler => ({
  id: 'a1',
  ageGroup: 'adult',
  style: 'unisex',
  ...overrides,
});
const child = (overrides: Partial<Traveler> = {}): Traveler => ({
  id: 'c1',
  ageGroup: 'child',
  style: 'unisex',
  ...overrides,
});
const infant = (overrides: Partial<Traveler> = {}): Traveler => ({
  id: 'i1',
  ageGroup: 'infant',
  style: 'unisex',
  ...overrides,
});

describe('calculateSunscreenRequirements', () => {
  it('computes baseline (non-beach, non-exploring) volume: 1 app/day', () => {
    const result = calculateSunscreenRequirements([adult()], [], 5, false, 'warm');
    expect(result.totalVolumeMl).toBe(30 * 1 * 5);
  });

  it('applies beach frequency multipliers per age group', () => {
    const result = calculateSunscreenRequirements([adult(), child()], ['beach'], 4, false, 'warm');
    // adult: 30ml * 3apps * 4days = 360; child: 20ml * 4apps * 4days = 320
    expect(result.totalVolumeMl).toBe(360 + 320);
  });

  it('applies exploring frequency multipliers per age group', () => {
    const result = calculateSunscreenRequirements([adult(), child()], ['exploring'], 3, false, 'warm');
    // adult: 30*1*3 = 90; child: 20*2*3 = 120
    expect(result.totalVolumeMl).toBe(90 + 120);
  });

  it('handles a mixed family group on a beach trip', () => {
    const result = calculateSunscreenRequirements(
      [adult(), adult({ id: 'a2' }), child(), infant()],
      ['beach'],
      7,
      false,
      'warm'
    );
    // adults: 2 * (30*3*7)=1260; child: 20*4*7=560; infant: 10*3*7=210 (infant uses adult-tier apps/day, matching child-only branch check)
    expect(result.totalVolumeMl).toBe(1260 + 560 + 210);
  });

  it('flags mustBuyOnArrival only when carry-on only and volume exceeds 100ml', () => {
    const small = calculateSunscreenRequirements([adult()], [], 1, true, 'warm');
    expect(small.totalVolumeMl).toBeLessThanOrEqual(100);
    expect(small.mustBuyOnArrival).toBe(false);

    const large = calculateSunscreenRequirements([adult()], ['beach'], 5, true, 'warm');
    expect(large.totalVolumeMl).toBeGreaterThan(100);
    expect(large.mustBuyOnArrival).toBe(true);
  });

  it('does not flag mustBuyOnArrival when checked bags are available (isCarryOnOnly=false)', () => {
    const result = calculateSunscreenRequirements([adult()], ['beach'], 10, false, 'warm');
    expect(result.totalVolumeMl).toBeGreaterThan(100);
    expect(result.mustBuyOnArrival).toBe(false);
  });

  it('rounds bottleCount200ml up', () => {
    const result = calculateSunscreenRequirements([adult()], [], 7, false, 'warm'); // 30*1*7=210ml
    expect(result.totalVolumeMl).toBe(210);
    expect(result.bottleCount200ml).toBe(2);
  });

  it('adds a sensitive-skin note without changing dose volume', () => {
    const base = calculateSunscreenRequirements([adult()], [], 5, false, 'warm');
    const sensitive = calculateSunscreenRequirements([adult({ sensitiveSkin: true })], [], 5, false, 'warm');
    expect(sensitive.totalVolumeMl).toBe(base.totalVolumeMl);
    expect(sensitive.recommendationNote).toMatch(/mineral\/sensitive-formula/i);
    expect(base.recommendationNote).not.toMatch(/mineral\/sensitive-formula/i);
  });

  it('always includes the sensitive-formula note for infants', () => {
    const result = calculateSunscreenRequirements([infant()], [], 5, false, 'warm');
    expect(result.recommendationNote).toMatch(/mineral\/sensitive-formula/i);
  });
});

describe('calculateSunscreenRequirements — climate gating', () => {
  it('requires no sunscreen for a cold climate', () => {
    const result = calculateSunscreenRequirements([adult()], ['beach'], 5, false, 'cold');
    expect(result.totalVolumeMl).toBe(0);
    expect(result.bottleCount200ml).toBe(0);
    expect(result.totalWeightGrams).toBe(0);
    expect(result.mustBuyOnArrival).toBe(false);
  });

  it('requires no sunscreen for a rainy climate', () => {
    const result = calculateSunscreenRequirements([adult()], ['beach'], 5, false, 'rainy');
    expect(result.totalVolumeMl).toBe(0);
  });

  it('requires no sunscreen for a mild climate', () => {
    const result = calculateSunscreenRequirements([adult()], ['beach'], 5, false, 'mild');
    expect(result.totalVolumeMl).toBe(0);
  });

  it('computes sunscreen normally for a warm climate', () => {
    const result = calculateSunscreenRequirements([adult()], [], 5, false, 'warm');
    expect(result.totalVolumeMl).toBe(30 * 1 * 5);
  });
});
