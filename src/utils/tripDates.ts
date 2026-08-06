export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function computeDurationDays(startDate: string, endDate: string): number {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const target = parseISODate(dateStr);
  const fromMidnight = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  return Math.round((target.getTime() - fromMidnight.getTime()) / 86_400_000);
}

export function shiftYear(dateStr: string, years: number): string {
  const d = parseISODate(dateStr);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return toISODateString(d);
}
