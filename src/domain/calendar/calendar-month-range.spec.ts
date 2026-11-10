import { describe, expect, it } from 'vitest';
import { calendarMonthRangeForDate } from './calendar-month-range';

describe('calendarMonthRangeForDate', () => {
  it('returns first and last day of the month', () => {
    expect(calendarMonthRangeForDate('2026-03-15')).toEqual({ from: '2026-03-01', to: '2026-03-31' });
    expect(calendarMonthRangeForDate('2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});
