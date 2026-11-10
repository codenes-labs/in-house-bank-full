import { describe, expect, it } from 'vitest';
import { buildCashBoxTransferDeposit } from './build-cash-box-transfer-deposit';

describe('buildCashBoxTransferDeposit', () => {
  it('creates deposit with note naming the cash box', () => {
    const deposit = buildCashBoxTransferDeposit(
      {
        id: 'box-1',
        name: 'Reserva',
        institution: 'X',
        cdiPercent: 100,
        balanceCents: 12_000,
      },
      'dep-1',
      '2026-03-01',
    );
    expect(deposit).toEqual({
      id: 'dep-1',
      amountCents: 12_000,
      date: '2026-03-01',
      note: 'Resgate da caixinha Reserva',
    });
  });

  it('skips zero balance', () => {
    expect(
      buildCashBoxTransferDeposit(
        { id: 'b', name: 'Vazia', institution: 'X', cdiPercent: 100, balanceCents: 0 },
        'dep',
        '2026-03-01',
      ),
    ).toBeNull();
  });
});
