import { describe, expect, it } from 'vitest';
import { simulateReturnAmounts } from './simulate-return-amounts';

describe('simulateReturnAmounts (RF-13 / RN-06)', () => {
  it('compares simple and compound totals for the RN-06 test case', () => {
    expect(simulateReturnAmounts(54_000, 3, 4)).toEqual({
      simpleReturnAmountCents: 60_480,
      compoundReturnAmountCents: 58_108,
      compoundInstallmentAmountCents: 14_527,
    });
  });
});
