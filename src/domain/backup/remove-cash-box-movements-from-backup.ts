import type { AppDataBackup } from '../models/app-data-backup';
import type { CashBoxMovement } from '../models/cash-box-movement';
import { computeBalanceAfterRemovingCashBoxMovement } from '../cash-boxes/compute-balance-after-removing-cash-box-movement';

export function removeCashBoxMovementsFromBackup(
  backup: AppDataBackup,
  shouldRemove: (movement: CashBoxMovement) => boolean,
): AppDataBackup {
  const cashBoxesById = new Map(backup.cashBoxes.map((cashBox) => [cashBox.id, { ...cashBox }]));
  const keptMovements: CashBoxMovement[] = [];

  for (const movement of backup.cashBoxMovements) {
    if (!shouldRemove(movement)) {
      keptMovements.push(movement);
      continue;
    }

    const cashBox = cashBoxesById.get(movement.cashBoxId);
    if (!cashBox) {
      continue;
    }

    const balanceResult = computeBalanceAfterRemovingCashBoxMovement(cashBox, movement);
    if (balanceResult.ok) {
      cashBox.balanceCents = balanceResult.balanceCents;
      cashBoxesById.set(cashBox.id, cashBox);
    }
  }

  return {
    ...backup,
    cashBoxes: backup.cashBoxes.map((cashBox) => cashBoxesById.get(cashBox.id) ?? cashBox),
    cashBoxMovements: keptMovements,
  };
}
