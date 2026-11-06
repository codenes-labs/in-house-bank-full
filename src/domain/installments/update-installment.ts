import { parseCalendarDate } from '../calendar/calendar-date-parts';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';

export interface InstallmentUpdateInput {
  dueDate: CalendarDate;
  amountCents: number;
}

export type InstallmentUpdateError = 'INVALID_DUE_DATE' | 'INVALID_AMOUNT';

export type InstallmentUpdateResult =
  { ok: true; installment: Installment } | { ok: false; error: InstallmentUpdateError };

export function applyInstallmentUpdate(
  installment: Installment,
  input: InstallmentUpdateInput,
): InstallmentUpdateResult {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, error: 'INVALID_AMOUNT' };
  }

  try {
    parseCalendarDate(input.dueDate);
  } catch {
    return { ok: false, error: 'INVALID_DUE_DATE' };
  }

  return {
    ok: true,
    installment: {
      ...installment,
      dueDate: input.dueDate,
      amountCents: input.amountCents,
    },
  };
}
