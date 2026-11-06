import { describe, expect, it } from 'vitest';
import { computeExpectedProfitCents } from './compute-expected-profit-cents';

describe('computeExpectedProfitCents', () => {
  it('subtracts used amount from return amount (RN-01)', () => {
    expect(computeExpectedProfitCents({ usedAmountCents: 54_000, returnAmountCents: 59_900 })).toBe(
      5_900,
    );
  });
});
