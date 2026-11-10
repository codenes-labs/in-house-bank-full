import { describe, expect, it } from 'vitest';
import { ExtratoKind } from '../../domain/ledger/extrato-kind';
import { LedgerDirection } from '../../domain/ledger/ledger-direction';
import { buildFreeBalanceExtratoHtml } from './build-free-balance-extrato-html';

describe('buildFreeBalanceExtratoHtml', () => {
  it('inclui resumo, movimentações e saldo após cada linha', () => {
    const html = buildFreeBalanceExtratoHtml({
      period: { from: '2026-01-08', to: '2026-03-15' },
      periodLines: [
        {
          id: 'free-balance-deposit:1',
          date: '2026-01-08',
          label: 'Entrada manual',
          amountCents: 45_000,
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
      ],
      allLines: [
        {
          id: 'free-balance-deposit:1',
          date: '2026-01-08',
          label: 'Entrada manual',
          amountCents: 45_000,
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
      ],
      currentBalanceCents: 32_500,
      settings: { businessName: 'Demo In House Bank' },
      issuedAt: new Date('2026-03-15T14:30:00'),
    });

    expect(html).toContain('Extrato do saldo livre');
    expect(html).toContain('background:#1E3A8A');
    expect(html).not.toContain('print-footer');
    expect(html).toContain('Total de entradas');
    expect(html).toContain('R$ 325,00');
    expect(html).toContain('R$ 450,00');
    expect(html).toContain('+R$ 450,00');
    expect(html).toContain('-R$ 125,00');
    expect(html).toContain('Resgate do saldo livre');
    expect(html).toContain('Não movimenta dinheiro');
  });
});
