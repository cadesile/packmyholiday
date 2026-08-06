export function roundQty(value: number): number {
  return Math.max(0, Math.ceil(value));
}

export function roundWeight(grams: number): number {
  return Math.round(grams);
}
