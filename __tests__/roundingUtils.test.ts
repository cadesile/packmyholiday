import { roundQty, roundWeight } from '../src/utils/rounding';

describe('roundQty', () => {
  it('ceils fractional values', () => {
    expect(roundQty(2.1)).toBe(3);
    expect(roundQty(2.9)).toBe(3);
  });

  it('leaves whole numbers unchanged', () => {
    expect(roundQty(4)).toBe(4);
  });

  it('never returns a negative quantity', () => {
    expect(roundQty(-3)).toBe(0);
  });

  it('matches the ED=5 bottoms formula: ceil(5/2)+1 = 4', () => {
    const ed = 5;
    expect(roundQty(Math.ceil(ed / 2) + 1)).toBe(4);
  });
});

describe('roundWeight', () => {
  it('rounds to the nearest gram', () => {
    expect(roundWeight(180.4)).toBe(180);
    expect(roundWeight(180.6)).toBe(181);
  });
});
