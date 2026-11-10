import { describe, expect, it } from 'vitest';
import type { Installment } from '../models/installment';
import { sortPlanInstallmentsForDisplay } from './sort-plan-installments-for-display';

function installment(partial: Pick<Installment, 'id' | 'number' | 'dueDate' | 'paidDate'>): Installment {
  return {
    id: partial.id,
    planId: 'plan-1',
    number: partial.number,
    dueDate: partial.dueDate,
    amountCents: 1000,
    txid: 'txid00000001',
    ...(partial.paidDate ? { paidDate: partial.paidDate } : {}),
  };
}

describe('sortPlanInstallmentsForDisplay', () => {
  it('keeps pending installments first ordered by due date', () => {
    const sorted = sortPlanInstallmentsForDisplay([
      installment({ id: '3', number: 3, dueDate: '2026-03-01' }),
      installment({ id: '1', number: 1, dueDate: '2026-01-01' }),
      installment({ id: '2', number: 2, dueDate: '2026-02-01' }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('moves paid installments to the bottom', () => {
    const sorted = sortPlanInstallmentsForDisplay([
      installment({ id: '1', number: 1, dueDate: '2026-01-01', paidDate: '2026-01-05' }),
      installment({ id: '2', number: 2, dueDate: '2026-02-01' }),
      installment({ id: '3', number: 3, dueDate: '2026-03-01' }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['2', '3', '1']);
  });
});
