import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import { computeFinancialOverview } from './compute-financial-overview';
import { applyFreeBalanceWithdrawal } from './apply-free-balance-withdrawal';

describe('applyFreeBalanceWithdrawal', () => {
  it('subtracts amount from free balance when sufficient', () => {
    const result = applyFreeBalanceWithdrawal(20_000, 5_000);
    expect(result).toEqual({ ok: true, freeBalanceCents: 15_000 });
  });

  it('rejects zero or negative amounts', () => {
    expect(applyFreeBalanceWithdrawal(20_000, 0)).toEqual({ ok: false, error: 'INVALID_AMOUNT' });
    expect(applyFreeBalanceWithdrawal(20_000, -100)).toEqual({ ok: false, error: 'INVALID_AMOUNT' });
  });

  it('rejects withdrawal above free balance', () => {
    expect(applyFreeBalanceWithdrawal(20_000, 20_001)).toEqual({
      ok: false,
      error: 'INSUFFICIENT_BALANCE',
    });
  });

  it('reduces patrimony by the withdrawn amount when cash boxes are unchanged', () => {
    const cashBoxes = [
      {
        id: 'c1',
        name: 'Reserva',
        institution: 'Banco',
        cdiPercent: 100,
        balanceCents: 50_000,
      },
    ];
    const before = computeFinancialOverview({
      plans: [],
      installments: [],
      settings: { ...createEmptySettings(), freeBalanceCents: 200_000 },
      cashBoxes,
      today: '2026-11-07',
    });
    const applied = applyFreeBalanceWithdrawal(200_000, 50_000);
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      return;
    }
    const after = computeFinancialOverview({
      plans: [],
      installments: [],
      settings: { ...createEmptySettings(), freeBalanceCents: applied.freeBalanceCents },
      cashBoxes,
      today: '2026-11-07',
    });
    expect(after.patrimonyCents).toBe(before.patrimonyCents - 50_000);
    expect(after.patrimonyCents).toBe(200_000);
  });
});
