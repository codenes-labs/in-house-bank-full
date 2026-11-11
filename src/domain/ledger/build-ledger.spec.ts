import { describe, expect, it } from 'vitest';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { ExtratoKind } from './extrato-kind';
import { LedgerDirection } from './ledger-direction';
import { buildLedger, filterLedgerByExtratoKind } from './build-ledger';

describe('buildLedger', () => {
  it('includes free balance withdrawals as outgoing lines with stable ids', () => {
    const lines = buildLedger({
      cashBoxes: [],
      cashBoxMovements: [],
      freeBalanceDeposits: [],
      freeBalanceWithdrawals: [
        { id: 'w1', amountCents: 5_000, date: '2026-11-01' },
        { id: 'w2', amountCents: 2_000, date: '2026-11-05' },
      ],
    });
    expect(lines).toEqual([
      {
        id: 'free-balance-withdrawal:w2',
        date: '2026-11-05',
        label: 'Resgate do saldo livre',
        amountCents: 2_000,
        direction: LedgerDirection.Out,
        kind: ExtratoKind.FreeBalance,
      },
      {
        id: 'free-balance-withdrawal:w1',
        date: '2026-11-01',
        label: 'Resgate do saldo livre',
        amountCents: 5_000,
        direction: LedgerDirection.Out,
        kind: ExtratoKind.FreeBalance,
      },
    ]);
  });

  it('includes cash box deposits and withdrawals with distinct labels', () => {
    const lines = buildLedger({
      cashBoxes: [{ id: 'c1', name: 'Reserva', institution: 'Banco', cdiPercent: 100, balanceCents: 0 }],
      cashBoxMovements: [
        {
          id: 'm1',
          cashBoxId: 'c1',
          type: CashBoxMovementType.Deposit,
          amountCents: 1_000,
          date: '2026-11-03',
        },
        {
          id: 'm2',
          cashBoxId: 'c1',
          type: CashBoxMovementType.Withdrawal,
          amountCents: 400,
          date: '2026-11-04',
        },
      ],
      freeBalanceDeposits: [],
      freeBalanceWithdrawals: [],
    });
    expect(lines.map((line) => line.label)).toEqual(['Resgate de Reserva', 'Aporte em Reserva']);
  });

  it('includes free balance deposits with note as label', () => {
    const lines = buildLedger({
      cashBoxes: [],
      cashBoxMovements: [],
      freeBalanceDeposits: [
        {
          id: 'd1',
          amountCents: 50_000,
          date: '2026-11-02',
          note: 'Resgate da caixinha Reserva',
        },
      ],
      freeBalanceWithdrawals: [],
    });
    expect(lines).toEqual([
      {
        id: 'free-balance-deposit:d1',
        date: '2026-11-02',
        label: 'Resgate da caixinha Reserva',
        amountCents: 50_000,
        direction: LedgerDirection.In,
        kind: ExtratoKind.FreeBalance,
      },
    ]);
  });

  it('keeps entrada and saída on the same day in registration order', () => {
    const lines = buildLedger({
      cashBoxes: [],
      cashBoxMovements: [],
      freeBalanceDeposits: [
        {
          id: 'd1',
          amountCents: 333,
          date: '2026-03-20',
          recordedAt: '2026-03-20T10:00:00.000Z',
        },
      ],
      freeBalanceWithdrawals: [
        {
          id: 'w1',
          amountCents: 321,
          date: '2026-03-20',
          recordedAt: '2026-03-20T10:01:00.000Z',
        },
        {
          id: 'w2',
          amountCents: 131,
          date: '2026-03-20',
          recordedAt: '2026-03-20T10:02:00.000Z',
        },
      ],
    });
    expect(lines.map((line) => line.id)).toEqual([
      'free-balance-withdrawal:w2',
      'free-balance-withdrawal:w1',
      'free-balance-deposit:d1',
    ]);
  });

  it('drops a line when the underlying withdrawal is removed', () => {
    const full = buildLedger({
      cashBoxes: [],
      cashBoxMovements: [],
      freeBalanceDeposits: [],
      freeBalanceWithdrawals: [{ id: 'w1', amountCents: 1_000, date: '2026-11-01' }],
    });
    const empty = buildLedger({
      cashBoxes: [],
      cashBoxMovements: [],
      freeBalanceDeposits: [],
      freeBalanceWithdrawals: [],
    });
    expect(full).toHaveLength(1);
    expect(empty).toHaveLength(0);
  });
});

describe('filterLedgerByExtratoKind', () => {
  const lines = buildLedger({
    cashBoxes: [{ id: 'c1', name: 'X', institution: 'Y', cdiPercent: 100, balanceCents: 0 }],
    cashBoxMovements: [
      {
        id: 'm1',
        cashBoxId: 'c1',
        type: CashBoxMovementType.Deposit,
        amountCents: 100,
        date: '2026-11-01',
      },
    ],
    freeBalanceDeposits: [],
    freeBalanceWithdrawals: [{ id: 'w1', amountCents: 50, date: '2026-11-02' }],
  });

  it('filters free balance withdrawals', () => {
    const filtered = filterLedgerByExtratoKind(lines, ExtratoKind.FreeBalance);
    expect(filtered.every((line) => line.kind === ExtratoKind.FreeBalance)).toBe(true);
    expect(filtered).toHaveLength(1);
  });

  it('filters cash box movements', () => {
    const filtered = filterLedgerByExtratoKind(lines, ExtratoKind.CashBox);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.kind).toBe(ExtratoKind.CashBox);
  });
});
