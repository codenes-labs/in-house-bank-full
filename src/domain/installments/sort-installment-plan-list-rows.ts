import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { CalendarDate } from '../models/calendar-date';
import type { InstallmentPlanListRow } from './installment-plan-list-row';

export const InstallmentPlanListSort = {
  NextDue: 'NEXT_DUE',
  Amount: 'AMOUNT',
  CreatedAt: 'CREATED_AT',
} as const;

export type InstallmentPlanListSort =
  (typeof InstallmentPlanListSort)[keyof typeof InstallmentPlanListSort];

function nextOpenDueDate(row: InstallmentPlanListRow): CalendarDate | null {
  const dates = row.installments
    .filter((installment) => !installment.paidDate)
    .map((installment) => installment.dueDate)
    .sort((left, right) => compareCalendarDates(left, right));
  return dates[0] ?? null;
}

export function sortInstallmentPlanListRows(
  rows: InstallmentPlanListRow[],
  sort: InstallmentPlanListSort,
): InstallmentPlanListRow[] {
  const copy = [...rows];
  if (sort === InstallmentPlanListSort.Amount) {
    return copy.sort((left, right) => right.plan.returnAmountCents - left.plan.returnAmountCents);
  }
  if (sort === InstallmentPlanListSort.CreatedAt) {
    return copy.sort((left, right) => right.plan.createdAt.localeCompare(left.plan.createdAt));
  }
  return copy.sort((left, right) => {
    const leftDue = nextOpenDueDate(left);
    const rightDue = nextOpenDueDate(right);
    if (leftDue && rightDue) {
      return compareCalendarDates(leftDue, rightDue);
    }
    if (leftDue) {
      return -1;
    }
    if (rightDue) {
      return 1;
    }
    return right.plan.createdAt.localeCompare(left.plan.createdAt);
  });
}
