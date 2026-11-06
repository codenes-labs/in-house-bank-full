import { describe, expect, it } from 'vitest';
import { addCalendarDays } from './add-calendar-days';

describe('addCalendarDays', () => {
  it('adds days within the same month', () => {
    expect(addCalendarDays('2026-10-16', 5)).toBe('2026-10-21');
  });

  it('rolls over month boundaries', () => {
    expect(addCalendarDays('2026-10-30', 3)).toBe('2026-11-02');
  });
});
