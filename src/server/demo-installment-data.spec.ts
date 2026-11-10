import { describe, expect, it } from 'vitest';
import { DEMO_PLAN_COUNT, buildDemoInstallmentPlansAndInstallments } from './demo-installment-data';

describe('buildDemoInstallmentPlansAndInstallments', () => {
  it('creates fifteen plans with vencimento always on day 10', () => {
    const { installmentPlans, installments } = buildDemoInstallmentPlansAndInstallments();
    expect(installmentPlans).toHaveLength(DEMO_PLAN_COUNT);
    expect(installmentPlans.length).toBe(15);
    expect(installments.length).toBeGreaterThan(15);
    for (const plan of installmentPlans) {
      expect(plan.firstDueDate.endsWith('-10')).toBe(true);
    }
    for (const installment of installments) {
      expect(installment.dueDate.endsWith('-10')).toBe(true);
    }
  });
});
