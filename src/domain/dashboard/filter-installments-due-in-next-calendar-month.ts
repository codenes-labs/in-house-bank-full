import { addCalendarMonths, parseCalendarDate } from '../calendar/calendar-date-parts';
import { calendarMonthKey } from '../reports/calendar-month-key';
import { deriveInstallmentStatus } from '../installments/derive-installment-status';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';
import { InstallmentStatus } from '../enums/installment-status';

export function nextCalendarMonthKey(today: CalendarDate): string {
  const next = addCalendarMonths(parseCalendarDate(today), 1);
  const month = String(next.month).padStart(2, '0');
  return `${next.year}-${month}`;
}

export function filterInstallmentsDueInNextCalendarMonth(
  installments: Installment[],
  today: CalendarDate,
): Installment[] {
  const targetMonthKey = nextCalendarMonthKey(today);
  return installments.filter((installment) => {
    if (deriveInstallmentStatus(installment, today) !== InstallmentStatus.Pending) {
      return false;
    }
    return calendarMonthKey(installment.dueDate) === targetMonthKey;
  });
}
