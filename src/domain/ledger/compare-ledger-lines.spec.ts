import { describe, expect, it } from 'vitest';
import { ExtratoKind } from './extrato-kind';
import { compareLedgerLinesNewestFirst, compareLedgerLinesOldestFirst } from './compare-ledger-lines';
import { LedgerDirection } from './ledger-direction';
import type { LedgerLine } from './ledger-line';

function line(partial: Partial<LedgerLine> & Pick<LedgerLine, 'id' | 'date'>): LedgerLine {
  return {
    label: 'x',
    amountCents: 100,
    direction: LedgerDirection.In,
    kind: ExtratoKind.FreeBalance,
    ...partial,
  };
}

describe('compareLedgerLines', () => {
  it('orders same-day entrada and saída by recordedAt, not by line prefix', () => {
    const entrada = line({
      id: 'free-balance-deposit:d1',
      date: '2026-03-20',
      direction: LedgerDirection.In,
      recordedAt: '2026-03-20T10:00:00.000Z',
    });
    const saida = line({
      id: 'free-balance-withdrawal:w1',
      date: '2026-03-20',
      direction: LedgerDirection.Out,
      recordedAt: '2026-03-20T10:05:00.000Z',
    });
    expect(compareLedgerLinesNewestFirst(saida, entrada)).toBeLessThan(0);
    expect(compareLedgerLinesOldestFirst(entrada, saida)).toBeLessThan(0);
  });

});
