import { describe, expect, it } from 'vitest';
import { ExtratoKind } from './extrato-kind';
import { computeFreeBalanceExtratoMetrics } from './compute-free-balance-extrato-metrics';
import { LedgerDirection } from './ledger-direction';

const demoLines = [
  {
    id: 'free-balance-deposit:1',
    date: '2026-01-08',
    label: 'Entrada manual',
    amountCents: 45_000,
    direction: LedgerDirection.In,
    kind: ExtratoKind.FreeBalance,
  },
  {
    id: 'free-balance-withdrawal:1',
    date: '2026-02-12',
    label: 'Resgate do saldo livre',
    amountCents: 28_000,
    direction: LedgerDirection.Out,
    kind: ExtratoKind.FreeBalance,
  },
  {
    id: 'free-balance-deposit:2',
    date: '2026-03-05',
    label: 'Resgate da caixinha Antiga poupança',
    amountCents: 15_240,
    direction: LedgerDirection.In,
    kind: ExtratoKind.FreeBalance,
  },
  {
    id: 'free-balance-withdrawal:2',
    date: '2026-03-15',
    label: 'Resgate do saldo livre',
    amountCents: 12_500,
    direction: LedgerDirection.Out,
    kind: ExtratoKind.FreeBalance,
  },
] as const;

describe('computeFreeBalanceExtratoMetrics', () => {
  it('totais do período e saldo cronológico com saldo atual', () => {
    const period = { from: '2026-01-08' as const, to: '2026-03-15' as const };
    const metrics = computeFreeBalanceExtratoMetrics({
      period,
      periodLines: demoLines,
      allLines: demoLines,
      currentBalanceCents: 217_760,
    });

    expect(metrics.totalInCents).toBe(60_240);
    expect(metrics.totalOutCents).toBe(40_500);
    expect(metrics.movementCount).toBe(4);
    expect(metrics.openingBalanceCents).toBe(198_020);
    expect(metrics.closingBalanceCents).toBe(217_760);
    expect(metrics.rowsByLineId.get('free-balance-deposit:1')?.balanceAfterCents).toBe(243_020);
    expect(metrics.rowsByLineId.get('free-balance-withdrawal:2')?.balanceAfterCents).toBe(217_760);
  });

  it('sem saldo atual usa abertura zero e saldo final como variação líquida', () => {
    const metrics = computeFreeBalanceExtratoMetrics({
      period: { from: '2026-01-08', to: '2026-03-15' },
      periodLines: demoLines,
    });

    expect(metrics.openingBalanceCents).toBe(0);
    expect(metrics.closingBalanceCents).toBe(19_740);
    expect(metrics.rowsByLineId.get('free-balance-deposit:1')?.balanceAfterCents).toBe(45_000);
  });

  it('período vazio zera os totais', () => {
    const metrics = computeFreeBalanceExtratoMetrics({
      period: { from: '2026-01-01', to: '2026-01-31' },
      periodLines: [],
      currentBalanceCents: 10_000,
      allLines: [],
    });

    expect(metrics.movementCount).toBe(0);
    expect(metrics.totalInCents).toBe(0);
    expect(metrics.totalOutCents).toBe(0);
    expect(metrics.openingBalanceCents).toBe(0);
    expect(metrics.closingBalanceCents).toBe(0);
  });
});
