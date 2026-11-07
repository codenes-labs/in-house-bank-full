import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import type { CashBoxMovement } from '../models/cash-box-movement';
import { formatCashBoxMonthLabel } from './format-cash-box-month-label';

export interface CashBoxMovementMonthGroup {
  yearMonth: string;
  label: string;
  depositsTotalCents: number;
  movements: CashBoxMovement[];
}

function yearMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function groupCashBoxMovementsByMonth(movements: readonly CashBoxMovement[]): CashBoxMovementMonthGroup[] {
  const sorted = [...movements].sort((left, right) => right.date.localeCompare(left.date));
  const groups = new Map<string, CashBoxMovement[]>();

  for (const movement of sorted) {
    const key = yearMonthFromDate(movement.date);
    const list = groups.get(key) ?? [];
    list.push(movement);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([yearMonth, monthMovements]) => ({
      yearMonth,
      label: formatCashBoxMonthLabel(yearMonth),
      depositsTotalCents: monthMovements
        .filter((movement) => movement.type === CashBoxMovementType.Deposit)
        .reduce((total, movement) => total + movement.amountCents, 0),
      movements: monthMovements,
    }));
}
