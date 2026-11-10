import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import type { InstallmentPlanListRow } from './installment-plan-list-row';
import { nextOpenInstallmentDueDate } from './next-open-installment-due';

export const InstallmentPlanListSort = {
  NextDue: 'NEXT_DUE',
  Amount: 'AMOUNT',
  CreatedAt: 'CREATED_AT',
} as const;

export type InstallmentPlanListSort =
  (typeof InstallmentPlanListSort)[keyof typeof InstallmentPlanListSort];

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
    const leftDue = nextOpenInstallmentDueDate(left.installments);
    const rightDue = nextOpenInstallmentDueDate(right.installments);
    if (leftDue && rightDue) {
      const byDue = compareCalendarDates(leftDue, rightDue);
      if (byDue !== 0) {
        return byDue;
      }
      return left.plan.borrowerName.localeCompare(right.plan.borrowerName, 'pt-BR');
    }
    if (leftDue) {
      return -1;
    }
    if (rightDue) {
      return 1;
    }
    return left.plan.borrowerName.localeCompare(right.plan.borrowerName, 'pt-BR');
  });
}
