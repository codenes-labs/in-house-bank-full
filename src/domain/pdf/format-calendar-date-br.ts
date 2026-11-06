import type { CalendarDate } from '../models/calendar-date';

export function formatCalendarDateBr(value: CalendarDate): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
