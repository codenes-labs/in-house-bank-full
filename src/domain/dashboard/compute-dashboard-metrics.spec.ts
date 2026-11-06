import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { createEmptySettings } from '../models/settings';
import { computeDashboardMetrics } from './compute-dashboard-metrics';

const today = '2026-10-16';

const plan = {
  id: 'plan-1',
  type: InstallmentPlanType.Purchase,
  reference: 'Notebook',
  borrowerName: 'Maria',
  usedAmountCents: 54_000,
  returnAmountCents: 59_900,
  issueDate: '2026-10-01',
  firstDueDate: '2026-11-09',
  installmentsCount: 2,
  pixKey: '390.533.447-05',
  beneficiary: 'Maria',
  institution: 'Nubank',
  createdAt: '2026-10-01T12:00:00.000Z',
};

describe('computeDashboardMetrics', () => {
  it('aggregates RN-12 indicators and RF-10 cards', () => {
    const metrics = computeDashboardMetrics({
      plans: [plan],
      installments: [
        {
          id: 'i1',
          planId: 'plan-1',
          number: 1,
          dueDate: '2026-10-01',
          amountCents: 20_000,
          paidDate: '2026-10-10',
          txid: 't1',
        },
        {
          id: 'i2',
          planId: 'plan-1',
          number: 2,
          dueDate: '2026-10-05',
          amountCents: 19_950,
          txid: 't2',
        },
        {
          id: 'i3',
          planId: 'plan-1',
          number: 3,
          dueDate: '2026-11-01',
          amountCents: 19_950,
          txid: 't3',
        },
      ],
      settings: {
        ...createEmptySettings(),
        freeBalanceCents: 10_000,
        milestonesCents: [50_000, 100_000],
      },
      cashBoxes: [
        { id: 'c1', name: 'Reserva', institution: 'Nubank', cdiPercent: 100, balanceCents: 15_000 },
      ],
      today,
    });

    expect(metrics.totalEmittedCents).toBe(59_900);
    expect(metrics.totalUsedCents).toBe(54_000);
    expect(metrics.totalReceivedCents).toBe(20_000);
    expect(metrics.expectedProfitCents).toBe(5_900);
    expect(metrics.realizedProfitCents).toBe(0);
    expect(metrics.overdueCount).toBe(1);
    expect(metrics.overdueAmountCents).toBe(19_950);
    expect(metrics.upcomingCount).toBe(1);
    expect(metrics.upcomingAmountCents).toBe(19_950);
    expect(metrics.upcomingMonthKey).toBe('2026-11');
    expect(metrics.patrimonyCents).toBe(25_000);
    expect(metrics.nextMilestoneCents).toBe(50_000);
    expect(metrics.milestoneProgressPercent).toBe(50);
  });

  it('counts realized profit after principal is recovered per plan', () => {
    const metrics = computeDashboardMetrics({
      plans: [plan],
      installments: [
        {
          id: 'i1',
          planId: 'plan-1',
          number: 1,
          dueDate: '2026-10-01',
          amountCents: 59_900,
          paidDate: '2026-10-10',
          txid: 't1',
        },
      ],
      settings: createEmptySettings(),
      cashBoxes: [],
      today,
    });

    expect(metrics.realizedProfitCents).toBe(5_900);
  });
});
