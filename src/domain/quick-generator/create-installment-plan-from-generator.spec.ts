import { describe, expect, it } from 'vitest';
import { InstallmentPlanType } from '../enums/installment-plan-type';
import { createInstallmentPlanBundle } from './create-installment-plan-from-generator';

describe('createInstallmentPlanBundle', () => {
  it('builds plan and installments for the carnê acceptance case', () => {
    const bundle = createInstallmentPlanBundle(
      {
        usedAmountCents: 54_000,
        returnAmountCents: 59_900,
        type: InstallmentPlanType.Purchase,
        reference: 'Notebook',
        borrowerName: 'Maria',
        issueDate: '2026-11-01',
        firstDueDate: '2026-11-09',
        installmentsCount: 4,
        pixKey: '390.533.447-05',
        beneficiary: 'In-House Bank',
        institution: 'Nubank',
      },
      '11111111-1111-4111-8111-111111111111',
      '2026-11-01T12:00:00.000Z',
    );

    expect(bundle.installments).toHaveLength(4);
    expect(bundle.installments.map((item) => item.amountCents)).toEqual([
      14_975, 14_975, 14_975, 14_975,
    ]);
    expect(bundle.installments.map((item) => item.dueDate)).toEqual([
      '2026-11-09',
      '2026-12-09',
      '2027-01-09',
      '2027-02-09',
    ]);
  });
});
