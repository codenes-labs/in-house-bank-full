import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { createEmptySettings } from '../models/settings';
import { buildWhatsappChargeMessage, renderWhatsappTemplate } from './build-whatsapp-charge';

describe('renderWhatsappTemplate', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(renderWhatsappTemplate('Oi {pagador} {inexistente}', { pagador: 'Ana' })).toBe(
      'Oi Ana {inexistente}',
    );
  });
});

describe('buildWhatsappChargeMessage', () => {
  it('includes payer, amount, due date and the pix payload', () => {
    const message = buildWhatsappChargeMessage({
      plan: {
        id: '11111111-1111-4111-8111-111111111111',
        type: InstallmentPlanType.Loan,
        reference: 'Notebook',
        borrowerName: 'Maria',
        usedAmountCents: 54000,
        returnAmountCents: 59900,
        issueDate: '2026-11-01',
        firstDueDate: '2026-12-01',
        installmentsCount: 4,
        pixKey: '390.533.447-05',
        beneficiary: 'In House Bank',
        institution: 'Nubank',
        createdAt: '2026-11-01T12:00:00.000Z',
      },
      installment: {
        id: '22222222-2222-4222-8222-222222222222',
        planId: '11111111-1111-4111-8111-111111111111',
        number: 2,
        dueDate: '2027-01-01',
        amountCents: 14975,
        txid: '11111111111102',
      },
      settings: { ...createEmptySettings(), city: 'SAO PAULO' },
      template: '{pagador} {parcela} {referencia} {valor} {vencimento} {pix}',
    });

    expect(message).toContain('Maria');
    expect(message).toContain('2');
    expect(message).toContain('Notebook');
    expect(message).toContain('149,75');
    expect(message).toContain('01/01/2027');
    expect(message).toContain('000201');
  });
});
