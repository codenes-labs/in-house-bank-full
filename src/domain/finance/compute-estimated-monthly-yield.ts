import { daysInMonth, parseCalendarDate } from '../calendar/calendar-date-parts';
import type { CalendarDate } from '../models/calendar-date';

/** Indicative IR for net estimate on caixinha yield (15% — holdings over 720 days). */
export const ESTIMATED_YIELD_IR_RATE = 0.15;

function annualCashBoxRate(cdiAnnualPercent: number, cashBoxCdiPercent: number): number {
  return (cdiAnnualPercent / 100) * (cashBoxCdiPercent / 100);
}

/** Gross yield projected for the full calendar month (saldo × CDI × %CDI ÷ 12). */
export function computeEstimatedFullMonthYieldCents(
  balanceCents: number,
  cdiAnnualPercent: number,
  cashBoxCdiPercent: number,
): number {
  if (balanceCents <= 0 || cdiAnnualPercent <= 0 || cashBoxCdiPercent <= 0) {
    return 0;
  }
  const annualRate = annualCashBoxRate(cdiAnnualPercent, cashBoxCdiPercent);
  return Math.round((balanceCents * annualRate) / 12);
}

/**
 * Gross yield from the start of the month through `today`: full-month estimate × (dia ÷ dias do mês).
 */
export function computeEstimatedMonthlyYieldCents(
  balanceCents: number,
  cdiAnnualPercent: number,
  cashBoxCdiPercent: number,
  today: CalendarDate,
): number {
  if (balanceCents <= 0 || cdiAnnualPercent <= 0 || cashBoxCdiPercent <= 0) {
    return 0;
  }

  const { year, month, day } = parseCalendarDate(today);
  const daysInCurrentMonth = daysInMonth(year, month);
  if (day <= 0) {
    return 0;
  }

  const fullMonthGrossCents = computeEstimatedFullMonthYieldCents(
    balanceCents,
    cdiAnnualPercent,
    cashBoxCdiPercent,
  );
  return Math.round((fullMonthGrossCents * day) / daysInCurrentMonth);
}

export function computeEstimatedMonthlyYieldNetCents(grossCents: number): number {
  if (grossCents <= 0) {
    return 0;
  }
  return Math.round(grossCents * (1 - ESTIMATED_YIELD_IR_RATE));
}
