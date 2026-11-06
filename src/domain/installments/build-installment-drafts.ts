import type { CalendarDate } from '../models/calendar-date';
import { computeInstallmentDueDates } from './compute-installment-due-dates';
import { splitReturnAmountCents } from './split-return-amount-cents';

export interface InstallmentDraft {
  number: number;
  dueDate: CalendarDate;
  amountCents: number;
}

export function buildInstallmentDrafts(
  returnAmountCents: number,
  installmentCount: number,
  firstDueDate: CalendarDate,
): InstallmentDraft[] {
  const amounts = splitReturnAmountCents(returnAmountCents, installmentCount);
  const dueDates = computeInstallmentDueDates(firstDueDate, installmentCount);

  return amounts.map((amountCents, index) => ({
    number: index + 1,
    dueDate: dueDates[index],
    amountCents,
  }));
}
