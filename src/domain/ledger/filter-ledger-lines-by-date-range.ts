import { installmentDueDateInRange, type InstallmentDueDateRange } from '../installments/installment-due-date-range';
import type { LedgerLine } from './ledger-line';

export function filterLedgerLinesByDateRange(lines: LedgerLine[], range: InstallmentDueDateRange): LedgerLine[] {
  return lines.filter((line) => installmentDueDateInRange(line.date, range));
}
