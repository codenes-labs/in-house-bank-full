import { describe, expect, it } from 'vitest';
import { ExtratoKind } from '../domain/ledger/extrato-kind';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import { generateCashBoxExtratoPdf } from './generate-cash-box-extrato-pdf';

describe('generateCashBoxExtratoPdf', () => {
  it('gera PDF com lançamentos no período', async () => {
    const bytes = await generateCashBoxExtratoPdf({
      title: 'Caixinha',
      period: { from: '2026-01-10', to: '2026-03-08' },
      lines: [
        {
          id: 'demo:1',
          date: '2026-03-08',
          label: 'Resgate de Metas do ano',
          amountCents: 5000,
          direction: LedgerDirection.Out,
          kind: ExtratoKind.CashBox,
        },
        {
          id: 'demo:2',
          date: '2026-03-01',
          label: 'Aporte em Viagem 2026',
          amountCents: 35000,
          direction: LedgerDirection.In,
          kind: ExtratoKind.CashBox,
        },
      ],
      settings: { businessName: 'Demo In House Bank' },
    });

    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
  });
});
