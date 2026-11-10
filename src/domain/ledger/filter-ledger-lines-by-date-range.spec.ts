import { describe, expect, it } from 'vitest';
import { ExtratoKind } from './extrato-kind';
import { LedgerDirection } from './ledger-direction';
import { filterLedgerLinesByDateRange } from './filter-ledger-lines-by-date-range';

describe('filterLedgerLinesByDateRange', () => {
  it('keeps only lines whose date falls inside the range', () => {
    const lines = [
      {
        id: 'a',
        date: '2026-03-05',
        label: 'A',
        amountCents: 100,
        direction: LedgerDirection.In,
        kind: ExtratoKind.CashBox,
      },
      {
        id: 'b',
        date: '2026-02-28',
        label: 'B',
        amountCents: 200,
        direction: LedgerDirection.Out,
        kind: ExtratoKind.CashBox,
      },
    ];
    expect(filterLedgerLinesByDateRange(lines, { from: '2026-03-01', to: '2026-03-31' })).toHaveLength(1);
  });
});
