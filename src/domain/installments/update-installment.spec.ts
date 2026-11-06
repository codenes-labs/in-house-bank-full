import { describe, expect, it } from 'vitest';
import { applyInstallmentUpdate } from './update-installment';

const installment = {
  id: 'i1',
  planId: 'p1',
  number: 1,
  dueDate: '2026-11-09',
  amountCents: 14_975,
  txid: 'tx1',
};

describe('applyInstallmentUpdate', () => {
  it('updates due date and amount', () => {
    const result = applyInstallmentUpdate(installment, {
      dueDate: '2026-12-09',
      amountCents: 15_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.installment.dueDate).toBe('2026-12-09');
      expect(result.installment.amountCents).toBe(15_000);
    }
  });

  it('rejects invalid amount', () => {
    expect(applyInstallmentUpdate(installment, { dueDate: '2026-12-09', amountCents: 0 })).toEqual({
      ok: false,
      error: 'INVALID_AMOUNT',
    });
  });
});
