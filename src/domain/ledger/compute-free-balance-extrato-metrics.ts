import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import { compareLedgerLinesNewestFirst, compareLedgerLinesOldestFirst } from './compare-ledger-lines';
import type { InstallmentDueDateRange } from '../installments/installment-due-date-range';
import { LedgerDirection } from './ledger-direction';
import type { LedgerLine } from './ledger-line';

export interface FreeBalanceExtratoRow {
  line: LedgerLine;
  balanceAfterCents: number;
  movementType: string | null;
}

export interface FreeBalanceExtratoMetrics {
  openingBalanceCents: number;
  closingBalanceCents: number;
  totalInCents: number;
  totalOutCents: number;
  movementCount: number;
  rowsByLineId: ReadonlyMap<string, FreeBalanceExtratoRow>;
}

function undoLine(balance: number, line: LedgerLine): number {
  return line.direction === LedgerDirection.In ? balance - line.amountCents : balance + line.amountCents;
}

function applyLine(balance: number, line: LedgerLine): number {
  return line.direction === LedgerDirection.In ? balance + line.amountCents : balance - line.amountCents;
}

export function deriveFreeBalanceMovementType(line: LedgerLine): string | null {
  const label = line.label.trim();
  if (line.direction === LedgerDirection.In) {
    if (/caixinha/i.test(label)) {
      return 'Resgate de caixinha';
    }
    if (/^entrada\b/i.test(label)) {
      return 'Entrada manual';
    }
    return 'Entrada no saldo livre';
  }
  return 'Resgate do saldo livre';
}

export function computeFreeBalanceExtratoMetrics(input: {
  period: InstallmentDueDateRange;
  periodLines: readonly LedgerLine[];
  allLines?: readonly LedgerLine[];
  currentBalanceCents?: number;
}): FreeBalanceExtratoMetrics {
  const periodLines = [...input.periodLines];
  const totalInCents = periodLines
    .filter((line) => line.direction === LedgerDirection.In)
    .reduce((total, line) => total + line.amountCents, 0);
  const totalOutCents = periodLines
    .filter((line) => line.direction === LedgerDirection.Out)
    .reduce((total, line) => total + line.amountCents, 0);
  const movementCount = periodLines.length;

  if (movementCount === 0) {
    return {
      openingBalanceCents: 0,
      closingBalanceCents: 0,
      totalInCents: 0,
      totalOutCents: 0,
      movementCount: 0,
      rowsByLineId: new Map(),
    };
  }

  let openingBalanceCents = 0;
  let closingBalanceCents = totalInCents - totalOutCents;

  if (input.currentBalanceCents !== undefined && input.allLines !== undefined) {
    let balance = input.currentBalanceCents;
    const allSortedNewestFirst = [...input.allLines].sort(compareLedgerLinesNewestFirst);

    for (const line of allSortedNewestFirst) {
      if (compareCalendarDates(line.date, input.period.to) > 0) {
        balance = undoLine(balance, line);
      }
    }
    closingBalanceCents = balance;

    const periodNewestFirst = [...periodLines].sort(compareLedgerLinesNewestFirst);
    for (const line of periodNewestFirst) {
      balance = undoLine(balance, line);
    }
    openingBalanceCents = balance;
  }

  const periodAsc = [...periodLines].sort(compareLedgerLinesOldestFirst);
  let running = openingBalanceCents;
  const rowsByLineId = new Map<string, FreeBalanceExtratoRow>();
  for (const line of periodAsc) {
    running = applyLine(running, line);
    const movementType = deriveFreeBalanceMovementType(line);
    rowsByLineId.set(line.id, {
      line,
      balanceAfterCents: running,
      movementType: movementType === line.label.trim() ? null : movementType,
    });
  }

  return {
    openingBalanceCents,
    closingBalanceCents,
    totalInCents,
    totalOutCents,
    movementCount,
    rowsByLineId,
  };
}
