import type { CalendarDate } from '../models/calendar-date';
import { addCalendarDays } from './add-calendar-days';
import { formatCalendarDate, parseCalendarDate } from './calendar-date-parts';

export interface CalendarMonthCell {
  date: CalendarDate;
  inCurrentMonth: boolean;
}

export function buildCalendarMonthGrid(year: number, month: number): CalendarMonthCell[] {
  const firstOfMonth = formatCalendarDate({ year, month, day: 1 });
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const gridStart = addCalendarDays(firstOfMonth, -firstWeekday);
  const cells: CalendarMonthCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = addCalendarDays(gridStart, index);
    const parts = parseCalendarDate(date);
    cells.push({
      date,
      inCurrentMonth: parts.year === year && parts.month === month,
    });
  }

  return cells;
}

export function calendarMonthTitle(year: number, month: number): string {
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
