import { describe, expect, it } from 'vitest';
import { computeInstallmentDueDates } from './compute-installment-due-dates';

describe('computeInstallmentDueDates (RN-03)', () => {
  it('matches carnê acceptance dates for four monthly installments', () => {
    expect(computeInstallmentDueDates('2026-11-09', 4)).toEqual([
      '2026-11-09',
      '2026-12-09',
      '2027-01-09',
      '2027-02-09',
    ]);
  });

  it('clamps day 31 to month end and restores on the next month', () => {
    expect(computeInstallmentDueDates('2025-01-31', 4)).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
    ]);
  });

  it('uses the informed first due date as-is', () => {
    expect(computeInstallmentDueDates('2024-02-29', 2)).toEqual(['2024-02-29', '2024-03-29']);
  });

  it('rejects invalid installment counts', () => {
    expect(() => computeInstallmentDueDates('2026-11-09', 0)).toThrow();
  });
});
