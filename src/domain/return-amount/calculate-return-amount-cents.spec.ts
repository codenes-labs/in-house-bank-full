import { describe, expect, it } from 'vitest';
import { ReturnRateMode } from './return-rate-mode';
import {
  calculatePriceInstallmentCents,
  calculateReturnAmountCents,
} from './calculate-return-amount-cents';

describe('calculateReturnAmountCents (RN-06)', () => {
  it('applies total percent rate on the principal', () => {
    const result = calculateReturnAmountCents({
      principalCents: 10_000,
      installmentCount: 4,
      mode: ReturnRateMode.TotalPercent,
      ratePercent: 10,
    });

    expect(result).toBe(11_000);
  });

  it('applies monthly simple interest', () => {
    const result = calculateReturnAmountCents({
      principalCents: 54_000,
      installmentCount: 4,
      mode: ReturnRateMode.MonthlySimple,
      ratePercent: 3,
    });

    expect(result).toBe(60_480);
  });

  it('applies monthly compound interest with Price table total', () => {
    const result = calculateReturnAmountCents({
      principalCents: 54_000,
      installmentCount: 4,
      mode: ReturnRateMode.MonthlyCompound,
      ratePercent: 3,
    });

    expect(result).toBe(58_108);
  });

  it('rejects invalid inputs', () => {
    expect(() =>
      calculateReturnAmountCents({
        principalCents: 0,
        installmentCount: 4,
        mode: ReturnRateMode.MonthlySimple,
        ratePercent: 3,
      }),
    ).toThrow();

    expect(() =>
      calculateReturnAmountCents({
        principalCents: 1000,
        installmentCount: 0,
        mode: ReturnRateMode.MonthlySimple,
        ratePercent: 3,
      }),
    ).toThrow();
  });
});

describe('calculatePriceInstallmentCents (RN-06)', () => {
  it('matches the reference PMT for 540,00 at 3% a.m. over 4 months', () => {
    expect(calculatePriceInstallmentCents(54_000, 3, 4)).toBe(14_527);
  });

  it('falls back to equal principal installments when rate is zero', () => {
    expect(calculatePriceInstallmentCents(10_000, 0, 4)).toBe(2500);
  });
});
