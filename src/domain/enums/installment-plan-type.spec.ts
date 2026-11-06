import { describe, expect, it } from 'vitest';
import { INSTALLMENT_PLAN_TYPE_VALUES, InstallmentPlanType } from './installment-plan-type';

describe('InstallmentPlanType', () => {
  it('lists RF-11 plan kinds', () => {
    expect(INSTALLMENT_PLAN_TYPE_VALUES).toEqual([
      InstallmentPlanType.Purchase,
      InstallmentPlanType.Loan,
      InstallmentPlanType.Withdrawal,
      InstallmentPlanType.Other,
    ]);
  });
});
