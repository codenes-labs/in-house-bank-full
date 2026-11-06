import { describe, expect, it } from 'vitest';
import { createEmptySettings } from '../models/settings';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { planCarneTextOverride, planCarneTextsForEdit, settingsCarneTextDefaults } from './plan-carne-texts';

describe('settingsCarneTextDefaults', () => {
  it('falls back from paymentInstructions to pdfFooterText', () => {
    const settings = { ...createEmptySettings(), pdfFooterText: 'Rodapé padrão' };
    expect(settingsCarneTextDefaults(settings).paymentInstructions).toBe('Rodapé padrão');
  });
});

describe('planCarneTextOverride', () => {
  it('returns undefined when equal to settings model', () => {
    expect(planCarneTextOverride('Modelo', 'Modelo')).toBeUndefined();
    expect(planCarneTextOverride('  ', 'Modelo')).toBeUndefined();
  });

  it('returns trimmed text when customized', () => {
    expect(planCarneTextOverride('  Só este carnê  ', 'Modelo')).toBe('Só este carnê');
  });
});

describe('planCarneTextsForEdit', () => {
  it('shows settings defaults when plan has no override', () => {
    const settings = { ...createEmptySettings(), paymentInstructions: 'Pix no app.' };
    const result = planCarneTextsForEdit(
      {
        id: '1',
        type: InstallmentPlanType.Loan,
        reference: 'A',
        borrowerName: 'B',
        usedAmountCents: 100,
        returnAmountCents: 100,
        issueDate: '2026-01-01',
        firstDueDate: '2026-02-01',
        installmentsCount: 1,
        beneficiary: 'C',
        pixKey: '11999999999',
        institution: 'I',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      settings,
    );
    expect(result.paymentInstructions).toBe('Pix no app.');
    expect(result.usesPlanOverride).toBe(false);
  });
});
