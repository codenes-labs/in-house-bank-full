import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { createEmptySettings } from '../models/settings';
import { computeReports } from './compute-reports';

const planA = {
  id: 'plan-a',
  type: InstallmentPlanType.Purchase,
  reference: 'TV',
  borrowerName: 'Maria',
  usedAmountCents: 100_000,
  returnAmountCents: 120_000,
  issueDate: '2026-01-15',
  firstDueDate: '2026-02-10',
  installmentsCount: 2,
  pixKey: 'email@test.com',
  beneficiary: 'Loja',
  institution: 'Banco',
  createdAt: '2026-01-15T12:00:00.000Z',
};

describe('computeReports', () => {
  it('R1: monthly cash flow compares due amounts vs paid in month', () => {
    const reports = computeReports({
      plans: [planA],
      installments: [
        {
          id: 'i1',
          planId: 'plan-a',
          number: 1,
          dueDate: '2026-02-10',
          amountCents: 60_000,
          paidDate: '2026-02-12',
          txid: 'tx1',
        },
        {
          id: 'i2',
          planId: 'plan-a',
          number: 2,
          dueDate: '2026-03-10',
          amountCents: 60_000,
          txid: 'tx2',
        },
      ],
      settings: createEmptySettings(),
      cashBoxes: [],
      cashBoxMovements: [],
      today: '2026-02-20',
    });

    const feb = reports.monthlyCashFlow.find((row) => row.month === '2026-02');
    expect(feb).toEqual({
      month: '2026-02',
      expectedInCents: 60_000,
      realizedInCents: 60_000,
    });

    const mar = reports.monthlyCashFlow.find((row) => row.month === '2026-03');
    expect(mar?.expectedInCents).toBe(60_000);
    expect(mar?.realizedInCents).toBe(0);
  });

  it('R2: buckets overdue installments by borrower', () => {
    const reports = computeReports({
      plans: [planA],
      installments: [
        {
          id: 'i1',
          planId: 'plan-a',
          number: 1,
          dueDate: '2026-01-01',
          amountCents: 40_000,
          txid: 'tx1',
        },
        {
          id: 'i2',
          planId: 'plan-a',
          number: 2,
          dueDate: '2026-01-20',
          amountCents: 30_000,
          txid: 'tx2',
        },
      ],
      settings: createEmptySettings(),
      cashBoxes: [],
      cashBoxMovements: [],
      today: '2026-02-05',
    });

    const row = reports.delinquencyByBorrower.find((item) => item.borrowerName === 'Maria');
    expect(row?.days16To30Cents).toBe(30_000);
    expect(row?.days31PlusCents).toBe(40_000);
  });

  it('R10: sums savings when card price is above return', () => {
    const reports = computeReports({
      plans: [{ ...planA, cardPriceCents: 150_000 }],
      installments: [],
      settings: createEmptySettings(),
      cashBoxes: [],
      cashBoxMovements: [],
      today: '2026-02-01',
    });

    expect(reports.cardSavings.totalSavingsCents).toBe(30_000);
    expect(reports.cardSavings.rows[0]?.savingsCents).toBe(30_000);
  });
});
