import { todayCalendarDate } from '../calendar/today-calendar-date';
import type { CalendarDate } from '../models/calendar-date';

/** “Hoje” fictício da demo: alinha filtros de período aos movimentos do snapshot (jan–mar/2026). */
export const DEMO_PRESENTATION_REFERENCE_DATE: CalendarDate = '2026-03-20';

export function effectiveTodayForPresentation(isDemo: boolean): CalendarDate {
  return isDemo ? DEMO_PRESENTATION_REFERENCE_DATE : todayCalendarDate();
}
