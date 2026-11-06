import { formatCalendarDate, parseCalendarDate } from './calendar-date-parts';
import type { CalendarDate } from '../models/calendar-date';

export function addCalendarDays(value: CalendarDate, days: number): CalendarDate {
  const parts = parseCalendarDate(value);
  const date = new Date(parts.year, parts.month - 1, parts.day);
  date.setDate(date.getDate() + days);
  return formatCalendarDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}
