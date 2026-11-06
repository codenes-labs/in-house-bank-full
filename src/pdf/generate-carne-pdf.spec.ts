import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../domain/enums/installment-plan-type';
import { createEmptySettings } from '../domain/models/settings';
import { generateCarnePdf } from './generate-carne-pdf';

describe('generateCarnePdf', () => {
  it('creates a PDF document with at least one page', async () => {
    const bytes = await generateCarnePdf({
      plan: {
        id: '11111111-1111-4111-8111-111111111111',
        type: InstallmentPlanType.Purchase,
        reference: 'Notebook',
        borrowerName: 'Maria',
        usedAmountCents: 54_000,
        returnAmountCents: 59_900,
        issueDate: '2026-11-01',
        firstDueDate: '2026-11-09',
        installmentsCount: 4,
        pixKey: '390.533.447-05',
        beneficiary: 'In-House Bank LTDA',
        institution: 'Nubank',
        createdAt: '2026-11-01T12:00:00.000Z',
      },
      installments: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          planId: '11111111-1111-4111-8111-111111111111',
          number: 1,
          dueDate: '2026-11-09',
          amountCents: 14_975,
          txid: '11111111111101',
        },
      ],
      settings: {
        ...createEmptySettings(),
        city: 'SAO PAULO',
        businessName: 'In-House Bank LTDA',
      },
    });

    expect(bytes.length).toBeGreaterThan(1000);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('%PDF');
  });
});
