import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';

export function nextOpenInstallmentDueDate(installments: Installment[]): CalendarDate | null {
  const dates = installments
    .filter((installment) => !installment.paidDate)
    .map((installment) => installment.dueDate)
    .sort((left, right) => compareCalendarDates(left, right));
  return dates[0] ?? null;
}

export function formatCalendarDateBr(date: CalendarDate): string {
  return date.split('-').reverse().join('/');
}
