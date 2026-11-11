import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { LedgerLine } from './ledger-line';

export function ledgerLineEntityId(lineId: string): string {
  const colon = lineId.indexOf(':');
  return colon >= 0 ? lineId.slice(colon + 1) : lineId;
}

/** Mais recente primeiro (histórico na tela). */
export function compareLedgerLinesNewestFirst(left: LedgerLine, right: LedgerLine): number {
  return -compareLedgerLinesOldestFirst(left, right);
}

/** Mais antiga primeiro (saldo corrido no extrato). */
export function compareLedgerLinesOldestFirst(left: LedgerLine, right: LedgerLine): number {
  const byDate = compareCalendarDates(left.date, right.date);
  if (byDate !== 0) {
    return byDate;
  }
  const leftRecorded = left.recordedAt ?? '';
  const rightRecorded = right.recordedAt ?? '';
  if (leftRecorded !== rightRecorded) {
    return leftRecorded.localeCompare(rightRecorded);
  }
  return ledgerLineEntityId(left.id).localeCompare(ledgerLineEntityId(right.id));
}
