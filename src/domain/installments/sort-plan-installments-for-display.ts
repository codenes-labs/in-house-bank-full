import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { Installment } from '../models/installment';

/** Pending first (by due date), paid at the bottom — detail screen list on web and mobile. */
export function sortPlanInstallmentsForDisplay(installments: readonly Installment[]): Installment[] {
  return [...installments].sort((left, right) => {
    const leftPaid = Boolean(left.paidDate);
    const rightPaid = Boolean(right.paidDate);
    if (leftPaid !== rightPaid) {
      return leftPaid ? 1 : -1;
    }
    const byDue = compareCalendarDates(left.dueDate, right.dueDate);
    if (byDue !== 0) {
      return byDue;
    }
    return left.number - right.number;
  });
}
