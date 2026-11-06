import {
  addCalendarMonths,
  daysInMonth,
  formatCalendarDate,
  parseCalendarDate,
} from '../calendar/calendar-date-parts';
import type { CalendarDate } from '../models/calendar-date';

export function computeDefaultFirstDueDate(issueDate: CalendarDate): CalendarDate {
  const issue = parseCalendarDate(issueDate);
  const nextMonth = addCalendarMonths(issue, 1);
  const day = Math.min(issue.day, daysInMonth(nextMonth.year, nextMonth.month));
  return formatCalendarDate({ year: nextMonth.year, month: nextMonth.month, day });
}
