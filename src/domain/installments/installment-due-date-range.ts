import type { CalendarDate } from '../models/calendar-date';
import { compareCalendarDates } from '../calendar/compare-calendar-dates';

export interface InstallmentDueDateRange {
  from: CalendarDate;
  to: CalendarDate;
}

export function normalizeInstallmentDueDateRange(from: CalendarDate, to: CalendarDate): InstallmentDueDateRange {
  if (compareCalendarDates(from, to) <= 0) {
    return { from, to };
  }
  return { from: to, to: from };
}

export function installmentDueDateInRange(dueDate: CalendarDate, range: InstallmentDueDateRange): boolean {
  return compareCalendarDates(dueDate, range.from) >= 0 && compareCalendarDates(dueDate, range.to) <= 0;
}

export function formatInstallmentDueDateRangeLabel(range: InstallmentDueDateRange | null): string {
  if (!range) {
    return '';
  }
  const format = (value: CalendarDate) => value.split('-').reverse().join('/');
  if (range.from === range.to) {
    return format(range.from);
  }
  return `${format(range.from)} – ${format(range.to)}`;
}
