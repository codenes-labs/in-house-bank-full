import type { CalendarDate } from '../models/calendar-date';

export function compareCalendarDates(left: CalendarDate, right: CalendarDate): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}
