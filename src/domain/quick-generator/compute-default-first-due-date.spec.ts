import { describe, expect, it } from 'vitest';
import { computeDefaultFirstDueDate } from './compute-default-first-due-date';

describe('computeDefaultFirstDueDate', () => {
  it('uses the same day on the following month', () => {
    expect(computeDefaultFirstDueDate('2026-10-15')).toBe('2026-11-15');
  });

  it('clamps day 31 when the next month is shorter', () => {
    expect(computeDefaultFirstDueDate('2026-01-31')).toBe('2026-02-28');
  });
});
