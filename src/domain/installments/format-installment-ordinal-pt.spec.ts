import { describe, expect, it } from 'vitest';
import { formatInstallmentOrdinalPt } from './format-installment-ordinal-pt';

describe('formatInstallmentOrdinalPt', () => {
  it('uses feminine ordinal suffix for parcela labels', () => {
    expect(formatInstallmentOrdinalPt(1)).toBe('1ª');
    expect(formatInstallmentOrdinalPt(2)).toBe('2ª');
    expect(formatInstallmentOrdinalPt(4)).toBe('4ª');
    expect(formatInstallmentOrdinalPt(12)).toBe('12ª');
  });
});
