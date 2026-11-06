import {
  addCalendarMonths,
  daysInMonth,
  formatCalendarDate,
  parseCalendarDate,
} from '../calendar/calendar-date-parts';
import type { CalendarDate } from '../models/calendar-date';

export function computeInstallmentDueDates(
  firstDueDate: CalendarDate,
  installmentCount: number,
): CalendarDate[] {
  assertPositiveInstallmentCount(installmentCount);

  const first = parseCalendarDate(firstDueDate);
  const targetDay = first.day;

  return Array.from({ length: installmentCount }, (_, index) => {
    if (index === 0) {
      return firstDueDate;
    }

    const { year, month } = addCalendarMonths(first, index);
    const day = Math.min(targetDay, daysInMonth(year, month));
    return formatCalendarDate({ year, month, day });
  });
}

function assertPositiveInstallmentCount(installmentCount: number): void {
  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new Error('Installment count must be a positive integer');
  }
}
