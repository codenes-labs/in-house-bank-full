import { describe, expect, it } from 'vitest';
import { formatCalendarMonthKeyBr } from './format-calendar-month-key-br';

describe('formatCalendarMonthKeyBr', () => {
  it('formats YYYY-MM as abbreviated month and year', () => {
    expect(formatCalendarMonthKeyBr('2026-11')).toBe('nov/2026');
  });
});
