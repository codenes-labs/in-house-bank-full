import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { createEmptySettings } from '../models/settings';
import type { InstallmentPlan } from '../models/installment-plan';
import { DEFAULT_CARNE_FOOTER, resolveCarneFooterText } from './resolve-carne-footer-text';

const plan: InstallmentPlan = {
  id: 'p1',
  type: InstallmentPlanType.Loan,
  reference: 'Ref',
  borrowerName: 'Ana',
  usedAmountCents: 100,
  returnAmountCents: 110,
  issueDate: '2026-01-01',
  firstDueDate: '2026-02-01',
  installmentsCount: 1,
  pixKey: 'a@b.com',
  beneficiary: 'Casa',
  institution: 'Banco',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('resolveCarneFooterText', () => {
  it('keeps the fixed default when nothing was customized', () => {
    expect(resolveCarneFooterText(plan, createEmptySettings())).toBe(DEFAULT_CARNE_FOOTER);
  });

  it('lets the plan override settings and appends the responsibility term', () => {
    const text = resolveCarneFooterText(
      { ...plan, paymentInstructions: 'Pague no Pix.', responsibilityTerm: 'Sem multa.' },
      { ...createEmptySettings(), paymentInstructions: 'Ignorar.', responsibilityTerm: 'Termo geral.' },
    );
    expect(text).toBe('Pague no Pix. Sem multa.');
  });
});
