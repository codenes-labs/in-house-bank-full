import type { CalendarDate } from '../models/calendar-date';

export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: CalendarDate): CalendarDateParts {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
}

export function formatCalendarDate(parts: CalendarDateParts): CalendarDate {
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

export function addCalendarMonths(
  parts: CalendarDateParts,
  monthsToAdd: number,
): Pick<CalendarDateParts, 'year' | 'month'> {
  const absoluteMonth = parts.year * 12 + (parts.month - 1) + monthsToAdd;
  const year = Math.floor(absoluteMonth / 12);
  const month = (absoluteMonth % 12) + 1;
  return { year, month };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
