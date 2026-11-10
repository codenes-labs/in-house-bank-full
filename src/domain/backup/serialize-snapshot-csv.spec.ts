import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { InstallmentStatus } from '../enums/installment-status';
import { serializeSnapshotCsv } from './serialize-snapshot-csv';
import { createEmptySettings } from '../models/settings';

describe('serializeSnapshotCsv', () => {
  it('exports installments with Brazilian separators and status', () => {
    const csv = serializeSnapshotCsv(
      {
        settings: createEmptySettings(),
        installmentPlans: [
          {
            id: 'plan-1',
            type: InstallmentPlanType.Loan,
            reference: 'REF-1',
            borrowerName: 'Maria',
            usedAmountCents: 10_000,
            returnAmountCents: 12_000,
            issueDate: '2026-01-01',
            firstDueDate: '2026-02-01',
            installmentsCount: 2,
            pixKey: 'maria@mail.com',
            beneficiary: 'João',
            institution: 'Banco',
            createdAt: '2026-01-01T12:00:00.000Z',
          },
        ],
        installments: [
          {
            id: 'i-1',
            planId: 'plan-1',
            number: 1,
            dueDate: '2026-02-01',
            amountCents: 6_000,
            paidDate: '2026-02-05',
            txid: 'tx',
          },
        ],
        cashBoxes: [],
        cashBoxMovements: [],
        freeBalanceWithdrawals: [],
      },
      '2026-03-01',
    );

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Maria;REF-1;1;2026-02-01;60,00;Paga;2026-02-05');
    expect(csv).not.toContain(InstallmentStatus.Paid);
  });
});
