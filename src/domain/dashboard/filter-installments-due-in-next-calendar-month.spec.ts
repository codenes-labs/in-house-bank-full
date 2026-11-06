import { describe, expect, it } from 'vitest';
import type { Installment } from '../models/installment';
import { filterInstallmentsDueInNextCalendarMonth } from './filter-installments-due-in-next-calendar-month';

function installment(
  partial: Pick<Installment, 'id' | 'planId' | 'dueDate' | 'paidDate'>,
): Installment {
  return {
    number: 1,
    amountCents: 10_000,
    txid: 'tx',
    ...partial,
  };
}

describe('filterInstallmentsDueInNextCalendarMonth', () => {
  it('keeps pending installments due in the month after today', () => {
    const installments = [
      installment({ id: 'a', planId: 'p1', dueDate: '2026-10-20' }),
      installment({ id: 'b', planId: 'p1', dueDate: '2026-11-09' }),
      installment({ id: 'c', planId: 'p2', dueDate: '2026-12-01' }),
    ];

    const result = filterInstallmentsDueInNextCalendarMonth(installments, '2026-10-17');
    expect(result.map((item) => item.id)).toEqual(['b']);
  });
});
