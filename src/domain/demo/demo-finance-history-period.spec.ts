import { describe, expect, it } from 'vitest';
import { demoExtratoDefaultPeriod, demoFinanceHistoryPeriod } from './demo-finance-history-period';

describe('demoFinanceHistoryPeriod', () => {
  it('spans from the earliest to the latest movement date', () => {
    expect(
      demoFinanceHistoryPeriod({
        freeBalanceDeposits: [{ date: '2026-01-08' }],
        freeBalanceWithdrawals: [{ date: '2026-03-15' }],
        cashBoxMovements: [{ date: '2026-02-05' }],
      }),
    ).toEqual({ from: '2026-01-08', to: '2026-03-15' });
  });

  it('demoExtratoDefaultPeriod spans movement dates only', () => {
    expect(demoExtratoDefaultPeriod(['2026-03-01', '2026-01-15'])).toEqual({
      from: '2026-01-15',
      to: '2026-03-01',
    });
  });
});
