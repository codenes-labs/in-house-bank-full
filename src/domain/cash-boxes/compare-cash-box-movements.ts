import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { CashBoxMovement } from '../models/cash-box-movement';

/** Mais recente primeiro (histórico na tela). */
export function compareCashBoxMovementsNewestFirst(left: CashBoxMovement, right: CashBoxMovement): number {
  return -compareCashBoxMovementsOldestFirst(left, right);
}

/** Mais antiga primeiro (extrato / saldo corrido). */
export function compareCashBoxMovementsOldestFirst(left: CashBoxMovement, right: CashBoxMovement): number {
  const byDate = compareCalendarDates(left.date, right.date);
  if (byDate !== 0) {
    return byDate;
  }
  const leftRecorded = left.recordedAt ?? '';
  const rightRecorded = right.recordedAt ?? '';
  if (leftRecorded !== rightRecorded) {
    return leftRecorded.localeCompare(rightRecorded);
  }
  return left.id.localeCompare(right.id);
}
