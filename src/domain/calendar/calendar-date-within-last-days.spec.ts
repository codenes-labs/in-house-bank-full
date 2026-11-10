import { describe, expect, it } from 'vitest';
import { calendarDateWithinLastDays } from './calendar-date-within-last-days';

describe('calendarDateWithinLastDays', () => {
  it('includes today and the previous 29 days for a 30-day window', () => {
    expect(calendarDateWithinLastDays('2026-03-20', '2026-03-20', 30)).toBe(true);
    expect(calendarDateWithinLastDays('2026-02-19', '2026-03-20', 30)).toBe(true);
    expect(calendarDateWithinLastDays('2026-02-18', '2026-03-20', 30)).toBe(false);
  });
});
