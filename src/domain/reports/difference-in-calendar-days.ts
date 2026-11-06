import { parseCalendarDate } from '../calendar/calendar-date-parts';
import type { CalendarDate } from '../models/calendar-date';

/** Inclusive day count from `start` to `end` when `end` is on or after `start`. */
export function differenceInCalendarDays(start: CalendarDate, end: CalendarDate): number {
  const from = parseCalendarDate(start);
  const to = parseCalendarDate(end);
  const startMs = Date.UTC(from.year, from.month - 1, from.day);
  const endMs = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((endMs - startMs) / 86_400_000);
}
