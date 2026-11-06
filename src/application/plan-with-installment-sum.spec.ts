import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../domain/enums/installment-plan-type';
import { planWithInstallmentSum } from './plan-with-installment-sum';

describe('planWithInstallmentSum', () => {
  it('replaces the plan return with the sum of its installments', () => {
    const plan = planWithInstallmentSum(
      {
        id: 'p1',
        type: InstallmentPlanType.Loan,
        reference: 'Ref',
        borrowerName: 'Ana',
        usedAmountCents: 100,
        returnAmountCents: 999,
        issueDate: '2026-01-01',
        firstDueDate: '2026-02-01',
        installmentsCount: 1,
        pixKey: 'a@b.com',
        beneficiary: 'Casa',
        institution: 'Banco',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      [
        { id: 'a', planId: 'p1', number: 1, dueDate: '2026-02-01', amountCents: 40, txid: 't1' },
        { id: 'b', planId: 'p1', number: 2, dueDate: '2026-03-01', amountCents: 60, txid: 't2' },
      ],
    );
    expect(plan.returnAmountCents).toBe(100);
    expect(plan.installmentsCount).toBe(2);
  });
});
