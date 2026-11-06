import { describe, expect, it } from 'vitest';
import { splitReturnAmountCents } from './split-return-amount-cents';

describe('splitReturnAmountCents (RN-02)', () => {
  it('splits 100,00 into 33,33 / 33,33 / 33,34', () => {
    expect(splitReturnAmountCents(10_000, 3)).toEqual([3333, 3333, 3334]);
  });

  it('splits 599,00 into four equal installments of 149,75', () => {
    expect(splitReturnAmountCents(59_900, 4)).toEqual([14_975, 14_975, 14_975, 14_975]);
  });

  it('puts the full amount on a single installment', () => {
    expect(splitReturnAmountCents(54_000, 1)).toEqual([54_000]);
  });

  it('keeps the sum equal to the return amount', () => {
    const amounts = splitReturnAmountCents(12_345, 7);
    expect(amounts.reduce((sum, value) => sum + value, 0)).toBe(12_345);
    expect(amounts).toHaveLength(7);
  });

  it('rejects invalid installment counts', () => {
    expect(() => splitReturnAmountCents(100, 0)).toThrow();
    expect(() => splitReturnAmountCents(100, -2)).toThrow();
  });
});
