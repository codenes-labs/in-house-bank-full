import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import type { CashBox } from '../models/cash-box';

export interface CashBoxMovementAmountInput {
  type: CashBoxMovementType;
  amountCents: number;
}

export type ApplyCashBoxMovementError =
  'INVALID_AMOUNT' | 'LIMIT_EXCEEDED' | 'INSUFFICIENT_BALANCE';

export type ApplyCashBoxMovementResult =
  | { ok: true; balanceCents: number }
  | { ok: false; error: ApplyCashBoxMovementError; availableCents?: number };

export function applyCashBoxMovement(
  cashBox: CashBox,
  movement: CashBoxMovementAmountInput,
): ApplyCashBoxMovementResult {
  if (!Number.isInteger(movement.amountCents) || movement.amountCents <= 0) {
    return { ok: false, error: 'INVALID_AMOUNT' };
  }

  if (movement.type === CashBoxMovementType.Deposit) {
    const nextBalance = cashBox.balanceCents + movement.amountCents;
    if (cashBox.limitCents !== undefined && nextBalance > cashBox.limitCents) {
      return {
        ok: false,
        error: 'LIMIT_EXCEEDED',
        availableCents: Math.max(0, cashBox.limitCents - cashBox.balanceCents),
      };
    }
    return { ok: true, balanceCents: nextBalance };
  }

  const nextBalance = cashBox.balanceCents - movement.amountCents;
  if (nextBalance < 0) {
    return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  }
  return { ok: true, balanceCents: nextBalance };
}
