import { describe, expect, it } from 'vitest';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { computeBalanceAfterRemovingCashBoxMovement } from './compute-balance-after-removing-cash-box-movement';

const cashBox = {
  id: 'c1',
  name: 'Caixinha Turbo',
  institution: 'Nubank',
  cdiPercent: 115,
  limitCents: 500_000,
  balanceCents: 360_761,
};

describe('computeBalanceAfterRemovingCashBoxMovement', () => {
  it('subtracts a removed deposit from balance', () => {
    const result = computeBalanceAfterRemovingCashBoxMovement(cashBox, {
      id: 'm1',
      cashBoxId: cashBox.id,
      type: CashBoxMovementType.Deposit,
      amountCents: 90_000,
      date: '2026-11-06',
      note: '30% Salario Teste',
    });
    expect(result).toEqual({ ok: true, balanceCents: 270_761 });
  });

  it('adds back a removed withdrawal', () => {
    const result = computeBalanceAfterRemovingCashBoxMovement(
      { ...cashBox, balanceCents: 200_000 },
      {
        id: 'm2',
        cashBoxId: cashBox.id,
        type: CashBoxMovementType.Withdrawal,
        amountCents: 50_000,
        date: '2026-11-06',
      },
    );
    expect(result).toEqual({ ok: true, balanceCents: 250_000 });
  });
});
