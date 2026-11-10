import { describe, expect, it } from 'vitest';
import { ExtratoKind } from './extrato-kind';
import { groupLedgerLinesByMonth } from './group-ledger-lines-by-month';
import { LedgerDirection } from './ledger-direction';

describe('groupLedgerLinesByMonth', () => {
  it('groups lines by month and sums inflows', () => {
    const groups = groupLedgerLinesByMonth([
      {
        id: 'a',
        date: '2026-03-01',
        label: 'Aporte',
        amountCents: 350_00,
        direction: LedgerDirection.In,
        kind: ExtratoKind.CashBox,
      },
      {
        id: 'b',
        date: '2026-03-08',
        label: 'Resgate',
        amountCents: 50_00,
        direction: LedgerDirection.Out,
        kind: ExtratoKind.CashBox,
      },
      {
        id: 'c',
        date: '2026-02-05',
        label: 'Aporte',
        amountCents: 100_00,
        direction: LedgerDirection.In,
        kind: ExtratoKind.CashBox,
      },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.yearMonth).toBe('2026-03');
    expect(groups[0]?.depositsTotalCents).toBe(350_00);
    expect(groups[1]?.depositsTotalCents).toBe(100_00);
  });
});
