import { describe, expect, it } from 'vitest';
import {
  formatInstallmentDueDateRangeLabel,
  installmentDueDateInRange,
  normalizeInstallmentDueDateRange,
} from './installment-due-date-range';

describe('normalizeInstallmentDueDateRange', () => {
  it('orders endpoints', () => {
    expect(normalizeInstallmentDueDateRange('2026-12-10', '2026-12-01')).toEqual({
      from: '2026-12-01',
      to: '2026-12-10',
    });
  });
});

describe('installmentDueDateInRange', () => {
  it('includes boundaries', () => {
    const range = { from: '2026-12-01', to: '2026-12-10' };
    expect(installmentDueDateInRange('2026-12-01', range)).toBe(true);
    expect(installmentDueDateInRange('2026-12-10', range)).toBe(true);
    expect(installmentDueDateInRange('2026-11-30', range)).toBe(false);
  });
});

describe('formatInstallmentDueDateRangeLabel', () => {
  it('formats single day without dash', () => {
    expect(formatInstallmentDueDateRangeLabel({ from: '2026-12-06', to: '2026-12-06' })).toBe('06/12/2026');
  });
});
