import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { InstallmentStatus } from '../enums/installment-status';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import {
  buildInstallmentExtratoLines,
  computeInstallmentExtratoMetrics,
  installmentMatchesExtratoRange,
} from './build-installment-extrato';

const planId = '11111111-1111-4111-8111-111111111111';

const plan: InstallmentPlan = {
  id: planId,
  type: InstallmentPlanType.Loan,
  reference: 'REF-A',
  borrowerName: 'Maria',
  usedAmountCents: 100_00,
  returnAmountCents: 120_00,
  issueDate: '2026-01-01',
  firstDueDate: '2026-02-01',
  installmentsCount: 2,
  pixKey: 'maria@example.com',
  beneficiary: 'Maria',
  institution: 'Banco',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function installment(partial: Partial<Installment> & Pick<Installment, 'id' | 'number' | 'dueDate' | 'amountCents'>): Installment {
  return {
    planId,
    txid: `tx-${partial.number}`,
    paidDate: undefined,
    ...partial,
  };
}

describe('installmentMatchesExtratoRange', () => {
  it('matches due date in range', () => {
    expect(
      installmentMatchesExtratoRange({ dueDate: '2026-02-10' }, { from: '2026-02-01', to: '2026-02-28' }),
    ).toBe(true);
  });

  it('matches paid date in range when due is outside', () => {
    expect(
      installmentMatchesExtratoRange(
        { dueDate: '2026-01-10', paidDate: '2026-02-05' },
        { from: '2026-02-01', to: '2026-02-28' },
      ),
    ).toBe(true);
  });
});

describe('buildInstallmentExtratoLines', () => {
  it('builds lines with derived status and filters range', () => {
    const installments = [
      installment({ id: 'a', number: 1, dueDate: '2026-02-01', amountCents: 60_00, paidDate: '2026-02-03' }),
      installment({ id: 'b', number: 2, dueDate: '2026-03-01', amountCents: 60_00 }),
    ];
    const lines = buildInstallmentExtratoLines({
      plans: [plan],
      installments,
      range: { from: '2026-02-01', to: '2026-02-28' },
      today: '2026-02-15',
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.status).toBe(InstallmentStatus.Paid);
    expect(lines[0]?.borrowerName).toBe('Maria');
    expect(lines[0]?.planReference).toBe('REF-A');
  });
});

describe('computeInstallmentExtratoMetrics', () => {
  it('counts paid in period and overdue in filtered lines', () => {
    const installments = [
      installment({ id: 'a', number: 1, dueDate: '2026-02-01', amountCents: 50_00, paidDate: '2026-02-10' }),
      installment({ id: 'b', number: 2, dueDate: '2026-02-05', amountCents: 40_00 }),
    ];
    const range = { from: '2026-02-01', to: '2026-02-28' };
    const lines = buildInstallmentExtratoLines({
      plans: [plan],
      installments,
      range,
      today: '2026-02-20',
    });
    const metrics = computeInstallmentExtratoMetrics(installments, range, lines);
    expect(metrics.paidCount).toBe(1);
    expect(metrics.receivedTotalCents).toBe(50_00);
    expect(metrics.overdueCount).toBe(1);
  });
});