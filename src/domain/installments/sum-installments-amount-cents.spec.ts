import { describe, expect, it } from 'vitest';
import { sumInstallmentsAmountCents } from './sum-installments-amount-cents';

describe('sumInstallmentsAmountCents', () => {
  it('sums installment amounts (RN-07)', () => {
    expect(
      sumInstallmentsAmountCents([
        {
          id: '1',
          planId: 'p',
          number: 1,
          dueDate: '2026-11-01',
          amountCents: 10_00,
          txid: 'a',
        },
        {
          id: '2',
          planId: 'p',
          number: 2,
          dueDate: '2026-12-01',
          amountCents: 15_00,
          txid: 'b',
        },
      ]),
    ).toBe(25_00);
  });
});
