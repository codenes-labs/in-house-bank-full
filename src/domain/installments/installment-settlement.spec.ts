import { describe, expect, it } from 'vitest';
import { clearInstallmentSettlement, settleInstallment } from './installment-settlement';

const installment = {
  id: 'i1',
  planId: 'p1',
  number: 1,
  dueDate: '2026-11-09',
  amountCents: 14_975,
  txid: 'tx1',
};

describe('installment settlement', () => {
  it('settleInstallment sets paidDate (RN-05)', () => {
    const result = settleInstallment(installment, '2026-10-16');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.installment.paidDate).toBe('2026-10-16');
    }
  });

  it('rejects settling an already paid installment', () => {
    const paid = { ...installment, paidDate: '2026-10-01' as const };
    expect(settleInstallment(paid, '2026-10-16')).toEqual({ ok: false, error: 'ALREADY_PAID' });
  });

  it('clearInstallmentSettlement removes paidDate (RF-24)', () => {
    const paid = { ...installment, paidDate: '2026-10-01' as const };
    const result = clearInstallmentSettlement(paid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.installment.paidDate).toBeUndefined();
    }
  });

  it('rejects clearing settlement when installment is not paid', () => {
    expect(clearInstallmentSettlement(installment)).toEqual({ ok: false, error: 'NOT_PAID' });
  });
});
