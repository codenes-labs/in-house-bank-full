import { describe, expect, it } from 'vitest';
import { compareCalendarDates } from './compare-calendar-dates';

describe('compareCalendarDates', () => {
  it('orders YYYY-MM-DD lexicographically', () => {
    expect(compareCalendarDates('2026-01-01', '2026-02-01')).toBeLessThan(0);
    expect(compareCalendarDates('2026-02-01', '2026-01-01')).toBeGreaterThan(0);
    expect(compareCalendarDates('2026-01-15', '2026-01-15')).toBe(0);
  });
});
