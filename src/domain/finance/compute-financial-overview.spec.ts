import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import { computeEstimatedFullMonthYieldCents } from './compute-estimated-monthly-yield';
import { computeFinancialOverview } from './compute-financial-overview';

describe('computeFinancialOverview', () => {
  it('combines RN-12 cards with cash box totals and yield', () => {
    const overview = computeFinancialOverview({
      plans: [],
      installments: [],
      settings: { ...createEmptySettings(), cdiAnnualPercent: 12, freeBalanceCents: 1_000 },
      cashBoxes: [
        {
          id: 'c1',
          name: 'Turbo',
          institution: 'Nubank',
          cdiPercent: 100,
          balanceCents: 100_000,
        },
      ],
      today: '2026-10-16',
    });

    expect(overview.patrimonyCents).toBe(101_000);
    expect(overview.totalCashBoxesCents).toBe(100_000);
    expect(overview.estimatedMonthlyYieldTotalCents).toBeGreaterThan(0);
  });

  it('uses full-month yield on current balance per cash box (RF-34)', () => {
    const settings = { ...createEmptySettings(), cdiAnnualPercent: 12 };
    const balanceCents = 360_761;
    const overview = computeFinancialOverview({
      plans: [],
      installments: [],
      settings,
      cashBoxes: [
        {
          id: 'c1',
          name: 'Turbo',
          institution: 'Nubank',
          cdiPercent: 115,
          balanceCents,
        },
      ],
      today: '2026-10-17',
    });

    const expectedGross = computeEstimatedFullMonthYieldCents(
      balanceCents,
      settings.cdiAnnualPercent,
      115,
    );
    expect(overview.yieldByCashBox[0]?.yieldCents).toBe(expectedGross);
    expect(overview.estimatedMonthlyYieldTotalCents).toBe(expectedGross);
  });

  it('updates projected yield when balance changes after a deposit', () => {
    const settings = { ...createEmptySettings(), cdiAnnualPercent: 12 };
    const baseInput = {
      plans: [],
      installments: [],
      settings,
      cashBoxes: [
        {
          id: 'c1',
          name: 'Turbo',
          institution: 'Nubank',
          cdiPercent: 115,
          balanceCents: 200_000,
        },
      ],
      today: '2026-10-17',
    };

    const before = computeFinancialOverview(baseInput);
    const after = computeFinancialOverview({
      ...baseInput,
      cashBoxes: [{ ...baseInput.cashBoxes[0], balanceCents: 300_000 }],
    });

    expect(after.yieldByCashBox[0]?.yieldCents).toBeGreaterThan(
      before.yieldByCashBox[0]?.yieldCents ?? 0,
    );
    expect(after.yieldByCashBox[0]?.yieldCents).toBe(
      Math.round((before.yieldByCashBox[0]?.yieldCents ?? 0) * 1.5),
    );
  });
});
