import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { PlanStatus } from '../enums/plan-status';
import { buildInstallmentPlanListRows } from './build-installment-plan-list-rows';
import {
  filterInstallmentPlanListRows,
  InstallmentPlanListStatusFilter,
} from './installment-plan-list-filter';

const today = '2026-10-16';

const basePlan = {
  id: 'plan-1',
  type: InstallmentPlanType.Purchase,
  reference: 'Notebook',
  borrowerName: 'Maria Silva',
  usedAmountCents: 100_00,
  returnAmountCents: 120_00,
  issueDate: '2026-09-01',
  firstDueDate: '2026-11-01',
  installmentsCount: 2,
  pixKey: '390.533.447-05',
  beneficiary: 'Maria',
  institution: 'Nubank',
  createdAt: '2026-09-01T10:00:00.000Z',
};

describe('filterInstallmentPlanListRows', () => {
  const rows = buildInstallmentPlanListRows(
    [basePlan],
    [
      {
        id: 'i1',
        planId: 'plan-1',
        number: 1,
        dueDate: '2026-10-01',
        amountCents: 60_00,
        txid: 'tx1',
      },
      {
        id: 'i2',
        planId: 'plan-1',
        number: 2,
        dueDate: '2026-11-01',
        amountCents: 60_00,
        txid: 'tx2',
      },
    ],
    today,
  );

  it('filters overdue plans', () => {
    const filtered = filterInstallmentPlanListRows(
      rows,
      { status: InstallmentPlanListStatusFilter.Overdue },
      today,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.planStatus).toBe(PlanStatus.Overdue);
  });

  it('filters by due month', () => {
    const filtered = filterInstallmentPlanListRows(
      rows,
      { status: InstallmentPlanListStatusFilter.All, dueMonth: '2026-11' },
      today,
    );
    expect(filtered).toHaveLength(1);
  });

  it('filters by borrower or reference search', () => {
    const filtered = filterInstallmentPlanListRows(
      rows,
      { status: InstallmentPlanListStatusFilter.All, searchText: 'notebook' },
      today,
    );
    expect(filtered).toHaveLength(1);

    const empty = filterInstallmentPlanListRows(
      rows,
      { status: InstallmentPlanListStatusFilter.All, searchText: 'inexistente' },
      today,
    );
    expect(empty).toHaveLength(0);
  });

  it('filters pending plans with future due dates only', () => {
    const filtered = filterInstallmentPlanListRows(
      rows,
      { status: InstallmentPlanListStatusFilter.Pending },
      today,
    );
    expect(filtered).toHaveLength(1);
  });
});
