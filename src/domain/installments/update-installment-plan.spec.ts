import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { applyInstallmentPlanUpdate } from './update-installment-plan';

const plan = {
  id: 'plan-1',
  type: InstallmentPlanType.Purchase,
  reference: 'Notebook',
  borrowerName: 'Maria',
  usedAmountCents: 54_000,
  returnAmountCents: 59_900,
  issueDate: '2026-11-01',
  firstDueDate: '2026-11-09',
  installmentsCount: 4,
  pixKey: '390.533.447-05',
  beneficiary: 'Maria LTDA',
  institution: 'Nubank',
  createdAt: '2026-11-01T12:00:00.000Z',
};

describe('applyInstallmentPlanUpdate', () => {
  it('updates editable plan fields', () => {
    const result = applyInstallmentPlanUpdate(plan, {
      reference: 'Cadeira',
      borrowerName: 'João',
      beneficiary: 'João Silva',
      pixKey: '390.533.447-05',
      institution: 'Inter',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.reference).toBe('Cadeira');
      expect(result.plan.institution).toBe('Inter');
      expect(result.pixFieldsChanged).toBe(true);
    }
  });

  it('rejects invalid pix key', () => {
    const result = applyInstallmentPlanUpdate(plan, {
      reference: 'Notebook',
      borrowerName: 'Maria',
      beneficiary: 'Maria LTDA',
      pixKey: 'invalida',
      institution: 'Nubank',
    });
    expect(result.ok).toBe(false);
  });
});
