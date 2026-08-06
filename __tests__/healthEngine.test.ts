import { generateHealthAndBugItems } from '../src/utils/healthEngine';

const stubIdGen = (() => {
  let n = 0;
  return () => `id-${n++}`;
})();

describe('generateHealthAndBugItems', () => {
  it('adds repellent for warm climate', () => {
    const items = generateHealthAndBugItems('warm', [], 2, stubIdGen);
    expect(items.some((i) => i.name.includes('Insect Repellent'))).toBe(true);
  });

  it('adds repellent for rainy climate', () => {
    const items = generateHealthAndBugItems('rainy', [], 2, stubIdGen);
    expect(items.some((i) => i.name.includes('Insect Repellent'))).toBe(true);
  });

  it('adds repellent when hiking is selected regardless of climate', () => {
    const items = generateHealthAndBugItems('cold', ['hiking'], 1, stubIdGen);
    expect(items.some((i) => i.name.includes('Insect Repellent'))).toBe(true);
  });

  it('omits repellent for mild/cold climate with no hiking', () => {
    const mild = generateHealthAndBugItems('mild', [], 2, stubIdGen);
    const cold = generateHealthAndBugItems('cold', [], 2, stubIdGen);
    expect(mild.some((i) => i.name.includes('Insect Repellent'))).toBe(false);
    expect(cold.some((i) => i.name.includes('Insect Repellent'))).toBe(false);
  });

  it('scales repellent bottle quantity with traveler count', () => {
    const items = generateHealthAndBugItems('warm', [], 5, stubIdGen);
    const repellent = items.find((i) => i.name.includes('Insect Repellent'));
    expect(repellent?.quantity).toBe(Math.ceil(5 / 2));
  });

  it('adds blister plasters for hiking', () => {
    const items = generateHealthAndBugItems('mild', ['hiking'], 1, stubIdGen);
    expect(items.some((i) => i.name.includes('Blister Plasters'))).toBe(true);
  });

  it('adds blister plasters for exploring', () => {
    const items = generateHealthAndBugItems('mild', ['exploring'], 1, stubIdGen);
    expect(items.some((i) => i.name.includes('Blister Plasters'))).toBe(true);
  });

  it('omits blister plasters when neither hiking nor exploring selected', () => {
    const items = generateHealthAndBugItems('mild', ['beach'], 1, stubIdGen);
    expect(items.some((i) => i.name.includes('Blister Plasters'))).toBe(false);
  });

  it('returns no items when traveler count is 0', () => {
    const items = generateHealthAndBugItems('warm', ['hiking'], 0, stubIdGen);
    expect(items).toHaveLength(0);
  });
});
