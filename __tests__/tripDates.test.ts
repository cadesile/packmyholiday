import {
  computeDurationDays,
  daysUntil,
  formatDateRange,
  formatDisplayDate,
  parseISODate,
  shiftYear,
  toISODateString,
} from '../src/utils/tripDates';

describe('toISODateString', () => {
  it('formats a UTC date as YYYY-MM-DD', () => {
    expect(toISODateString(new Date(Date.UTC(2026, 7, 6)))).toBe('2026-08-06');
  });
});

describe('parseISODate', () => {
  it('parses YYYY-MM-DD as UTC midnight', () => {
    const d = parseISODate('2026-08-06');
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7);
    expect(d.getUTCDate()).toBe(6);
  });
});

describe('computeDurationDays', () => {
  it('counts inclusive days for a same-day trip', () => {
    expect(computeDurationDays('2026-08-06', '2026-08-06')).toBe(1);
  });

  it('counts inclusive days for a week-long trip', () => {
    expect(computeDurationDays('2026-08-06', '2026-08-12')).toBe(7);
  });
});

describe('daysUntil', () => {
  it('returns 0 when the date is today', () => {
    const today = new Date(Date.UTC(2026, 7, 6, 15, 30));
    expect(daysUntil('2026-08-06', today)).toBe(0);
  });

  it('returns a positive count for a future date', () => {
    const today = new Date(Date.UTC(2026, 7, 6));
    expect(daysUntil('2026-08-20', today)).toBe(14);
  });

  it('returns a negative count for a past date', () => {
    const today = new Date(Date.UTC(2026, 7, 6));
    expect(daysUntil('2026-08-01', today)).toBe(-5);
  });
});

describe('shiftYear', () => {
  it('shifts a date back one year', () => {
    expect(shiftYear('2026-08-06', -1)).toBe('2025-08-06');
  });

  it('shifts a leap-day date back one year to Feb 28', () => {
    expect(shiftYear('2028-02-29', -1)).toBe('2027-03-01');
  });
});

describe('formatDisplayDate', () => {
  it('formats a date as "Mon D, YYYY"', () => {
    expect(formatDisplayDate('2026-08-06')).toBe('Aug 6, 2026');
  });
});

describe('formatDateRange', () => {
  it('formats a same-year range without repeating the year, using an en dash', () => {
    expect(formatDateRange('2026-08-06', '2026-08-15')).toBe('Aug 6 – Aug 15');
  });

  it('formats a range spanning two years with both years shown', () => {
    expect(formatDateRange('2026-12-28', '2027-01-03')).toBe('Dec 28, 2026 – Jan 3, 2027');
  });

  it('formats a same-day trip as a single date', () => {
    expect(formatDateRange('2026-08-06', '2026-08-06')).toBe('Aug 6, 2026');
  });
});
