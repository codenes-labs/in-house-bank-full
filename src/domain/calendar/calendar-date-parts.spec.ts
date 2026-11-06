import { describe, expect, it } from 'vitest';
import { parseCalendarDate } from './calendar-date-parts';

describe('parseCalendarDate', () => {
  it('rejects invalid calendar strings', () => {
    expect(() => parseCalendarDate('09/11/2026')).toThrow();
    expect(() => parseCalendarDate('2026-02-30')).toThrow();
  });
});
