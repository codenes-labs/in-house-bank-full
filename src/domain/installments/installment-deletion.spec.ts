import { describe, expect, it } from 'vitest';
import { assertInstallmentDeletable, canDeleteInstallment } from './installment-deletion';

const installment = {
  id: 'i1',
  planId: 'p1',
  number: 1,
  dueDate: '2026-11-09',
  amountCents: 1000,
  txid: 'tx1',
};

describe('installment deletion (RN-10)', () => {
  it('allows deleting unpaid installments', () => {
    expect(canDeleteInstallment(installment)).toBe(true);
    expect(assertInstallmentDeletable(installment)).toEqual({ ok: true });
  });

  it('blocks deleting paid installments', () => {
    const paid = { ...installment, paidDate: '2026-10-01' as const };
    expect(canDeleteInstallment(paid)).toBe(false);
    expect(assertInstallmentDeletable(paid)).toEqual({ ok: false, error: 'PAID_INSTALLMENT' });
  });
});
