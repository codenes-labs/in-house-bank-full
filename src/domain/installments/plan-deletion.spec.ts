import { describe, expect, it } from 'vitest';
import { PlanDeleteConfirmationLevel, resolvePlanDeleteConfirmationLevel } from './plan-deletion';

describe('resolvePlanDeleteConfirmationLevel', () => {
  const base = {
    id: 'i1',
    planId: 'p1',
    number: 1,
    dueDate: '2026-11-09',
    amountCents: 1000,
    txid: 'tx1',
  };

  it('uses standard confirmation when no paid installments', () => {
    expect(resolvePlanDeleteConfirmationLevel([base])).toBe(PlanDeleteConfirmationLevel.Standard);
  });

  it('uses reinforced confirmation when any installment is paid', () => {
    expect(resolvePlanDeleteConfirmationLevel([{ ...base, paidDate: '2026-10-01' }])).toBe(
      PlanDeleteConfirmationLevel.Reinforced,
    );
  });
});
