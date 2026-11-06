import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { PlanStatus } from '../enums/plan-status';
import type { InstallmentPlanListRow } from './installment-plan-list-row';
import {
  InstallmentPlanListSort,
  sortInstallmentPlanListRows,
} from './sort-installment-plan-list-rows';

function row(reference: string, dueDate: string, amount: number, createdAt: string): InstallmentPlanListRow {
  return {
    plan: {
      id: reference,
      type: InstallmentPlanType.Loan,
      reference,
      borrowerName: reference,
      usedAmountCents: amount,
      returnAmountCents: amount,
      issueDate: '2026-01-01',
      firstDueDate: dueDate,
      installmentsCount: 1,
      pixKey: 'a@b.com',
      beneficiary: 'Casa',
      institution: 'Banco',
      createdAt,
    },
    installments: [
      {
        id: `${reference}-1`,
        planId: reference,
        number: 1,
        dueDate,
        amountCents: amount,
        txid: 'txid00000001',
      },
    ],
    paidCount: 0,
    expectedProfitCents: 0,
    planStatus: PlanStatus.OnTrack,
  };
}

describe('sortInstallmentPlanListRows', () => {
  const rows = [
    row('b', '2026-05-01', 2000, '2026-01-02T00:00:00.000Z'),
    row('a', '2026-03-01', 9000, '2026-01-03T00:00:00.000Z'),
  ];

  it('orders by the next open due date', () => {
    const sorted = sortInstallmentPlanListRows(rows, InstallmentPlanListSort.NextDue);
    expect(sorted.map((item) => item.plan.reference)).toEqual(['a', 'b']);
  });

  it('orders by return amount descending', () => {
    const sorted = sortInstallmentPlanListRows(rows, InstallmentPlanListSort.Amount);
    expect(sorted.map((item) => item.plan.reference)).toEqual(['a', 'b']);
  });

  it('orders by creation descending', () => {
    const sorted = sortInstallmentPlanListRows(rows, InstallmentPlanListSort.CreatedAt);
    expect(sorted.map((item) => item.plan.reference)).toEqual(['a', 'b']);
  });
});
