import { describe, expect, it } from 'vitest';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { applyCashBoxMovement } from './apply-cash-box-movement';

const cashBox = {
  id: 'c1',
  name: 'Turbo',
  institution: 'Nubank',
  cdiPercent: 115,
  limitCents: 500_000,
  balanceCents: 400_000,
};

describe('applyCashBoxMovement', () => {
  it('adds deposit amount to balance', () => {
    const result = applyCashBoxMovement(cashBox, {
      type: CashBoxMovementType.Deposit,
      amountCents: 50_000,
    });
    expect(result).toEqual({ ok: true, balanceCents: 450_000 });
  });

  it('rejects deposit above limit', () => {
    const result = applyCashBoxMovement(cashBox, {
      type: CashBoxMovementType.Deposit,
      amountCents: 200_000,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('LIMIT_EXCEEDED');
    }
  });

  it('subtracts withdrawal when balance allows', () => {
    const result = applyCashBoxMovement(cashBox, {
      type: CashBoxMovementType.Withdrawal,
      amountCents: 100_000,
    });
    expect(result).toEqual({ ok: true, balanceCents: 300_000 });
  });

  it('rejects withdrawal above balance', () => {
    const result = applyCashBoxMovement(cashBox, {
      type: CashBoxMovementType.Withdrawal,
      amountCents: 500_000,
    });
    expect(result).toEqual({ ok: false, error: 'INSUFFICIENT_BALANCE' });
  });
});
