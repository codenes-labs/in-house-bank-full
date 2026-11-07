import { describe, expect, it } from 'vitest';
import { applyFreeBalanceDeposit } from './apply-free-balance-deposit';

describe('applyFreeBalanceDeposit', () => {
  it('adds a positive amount to free balance', () => {
    expect(applyFreeBalanceDeposit(20_000, 5_000)).toEqual({ ok: true, freeBalanceCents: 25_000 });
  });

  it('rejects zero or negative amounts', () => {
    expect(applyFreeBalanceDeposit(20_000, 0)).toEqual({ ok: false, error: 'INVALID_AMOUNT' });
    expect(applyFreeBalanceDeposit(20_000, -100)).toEqual({ ok: false, error: 'INVALID_AMOUNT' });
  });
});
