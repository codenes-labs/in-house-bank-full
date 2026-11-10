import type { CalendarDate } from '../models/calendar-date';
import { addCalendarDays } from './add-calendar-days';
import { compareCalendarDates } from './compare-calendar-dates';

export function calendarDateWithinLastDays(date: CalendarDate, today: CalendarDate, days: number): boolean {
  if (days < 1) {
    return false;
  }
  const from = addCalendarDays(today, -(days - 1));
  return compareCalendarDates(date, from) >= 0 && compareCalendarDates(date, today) <= 0;
}
