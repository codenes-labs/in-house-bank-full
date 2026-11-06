import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import type { CashBox } from '../models/cash-box';
import type { CashBoxMovement } from '../models/cash-box-movement';
import { applyCashBoxMovement, type ApplyCashBoxMovementResult } from './apply-cash-box-movement';

export function computeBalanceAfterRemovingCashBoxMovement(
  cashBox: CashBox,
  movement: CashBoxMovement,
): ApplyCashBoxMovementResult {
  const reverseType =
    movement.type === CashBoxMovementType.Deposit
      ? CashBoxMovementType.Withdrawal
      : CashBoxMovementType.Deposit;
  return applyCashBoxMovement(cashBox, {
    type: reverseType,
    amountCents: movement.amountCents,
  });
}
