import type { CalendarDate } from '../models/calendar-date';

/** `YYYY-MM` from a calendar date. */
export function calendarMonthKey(date: CalendarDate): string {
  return date.slice(0, 7);
}
