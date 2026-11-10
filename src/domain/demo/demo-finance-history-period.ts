import { calendarMonthRangeForDate } from '../calendar/calendar-month-range';
import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { InstallmentDueDateRange } from '../installments/installment-due-date-range';
import type { CalendarDate } from '../models/calendar-date';
import { DEMO_PRESENTATION_REFERENCE_DATE } from './demo-presentation-reference-date';

export interface DemoFinanceHistoryInput {
  freeBalanceDeposits: { date: CalendarDate }[];
  freeBalanceWithdrawals: { date: CalendarDate }[];
  cashBoxMovements: { date: CalendarDate }[];
}

export function demoFinanceHistoryPeriod(input: DemoFinanceHistoryInput): InstallmentDueDateRange {
  return demoExtratoDefaultPeriod(
    [
      ...input.freeBalanceDeposits.map((row) => row.date),
      ...input.freeBalanceWithdrawals.map((row) => row.date),
      ...input.cashBoxMovements.map((row) => row.date),
    ],
    DEMO_PRESENTATION_REFERENCE_DATE,
  );
}

/** Período padrão na demo: da primeira à última data de movimento (para o extrato mostrar todos os meses fictícios). */
export function demoExtratoDefaultPeriod(
  movementDates: readonly CalendarDate[],
  reference: CalendarDate = DEMO_PRESENTATION_REFERENCE_DATE,
): InstallmentDueDateRange {
  if (movementDates.length === 0) {
    return calendarMonthRangeForDate(reference);
  }
  const sorted = [...movementDates].sort(compareCalendarDates);
  return { from: sorted[0]!, to: sorted[sorted.length - 1]! };
}
