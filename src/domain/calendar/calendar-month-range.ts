import type { CalendarDate } from '../models/calendar-date';
import { daysInMonth, formatCalendarDate, parseCalendarDate } from './calendar-date-parts';
import type { InstallmentDueDateRange } from '../installments/installment-due-date-range';

export function calendarMonthRangeForDate(reference: CalendarDate): InstallmentDueDateRange {
  const parts = parseCalendarDate(reference);
  const from = formatCalendarDate({ year: parts.year, month: parts.month, day: 1 });
  const to = formatCalendarDate({
    year: parts.year,
    month: parts.month,
    day: daysInMonth(parts.year, parts.month),
  });
  return { from, to };
}
