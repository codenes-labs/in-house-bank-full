import { formatCashBoxMonthLabel } from '../cash-boxes/format-cash-box-month-label';
import { LedgerDirection } from './ledger-direction';
import type { LedgerLine } from './ledger-line';

export interface LedgerLineMonthGroup {
  yearMonth: string;
  label: string;
  depositsTotalCents: number;
  lines: LedgerLine[];
}

function yearMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function groupLedgerLinesByMonth(lines: readonly LedgerLine[]): LedgerLineMonthGroup[] {
  const sorted = [...lines].sort((left, right) => right.date.localeCompare(left.date));
  const groups = new Map<string, LedgerLine[]>();

  for (const line of sorted) {
    const key = yearMonthFromDate(line.date);
    const list = groups.get(key) ?? [];
    list.push(line);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([yearMonth, monthLines]) => ({
      yearMonth,
      label: formatCashBoxMonthLabel(yearMonth),
      depositsTotalCents: monthLines
        .filter((line) => line.direction === LedgerDirection.In)
        .reduce((total, line) => total + line.amountCents, 0),
      lines: monthLines,
    }));
}
