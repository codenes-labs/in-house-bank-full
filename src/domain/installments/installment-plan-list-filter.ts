import { InstallmentStatus } from '../enums/installment-status';
import { PlanStatus } from '../enums/plan-status';
import type { CalendarDate } from '../models/calendar-date';
import { deriveInstallmentStatus } from './derive-installment-status';
import type { InstallmentPlanListRow } from './installment-plan-list-row';
import type { InstallmentDueDateRange } from './installment-due-date-range';
import { installmentDueDateInRange } from './installment-due-date-range';

export const InstallmentPlanListStatusFilter = {
  All: 'ALL',
  Pending: 'PENDING',
  Paid: 'PAID',
  Overdue: 'OVERDUE',
} as const;

export type InstallmentPlanListStatusFilter =
  (typeof InstallmentPlanListStatusFilter)[keyof typeof InstallmentPlanListStatusFilter];

export interface InstallmentPlanListFilterCriteria {
  status: InstallmentPlanListStatusFilter;
  dueDateRange?: InstallmentDueDateRange;
  searchText?: string;
}

export function matchesInstallmentPlanListFilter(
  row: InstallmentPlanListRow,
  criteria: InstallmentPlanListFilterCriteria,
  today: CalendarDate,
): boolean {
  const search = criteria.searchText?.trim().toLocaleLowerCase('pt-BR');
  if (search) {
    const haystack = `${row.plan.borrowerName} ${row.plan.reference}`.toLocaleLowerCase('pt-BR');
    if (!haystack.includes(search)) {
      return false;
    }
  }

  if (criteria.dueDateRange) {
    const hasDueInRange = row.installments.some((installment) =>
      installmentDueDateInRange(installment.dueDate, criteria.dueDateRange!),
    );
    if (!hasDueInRange) {
      return false;
    }
  }

  switch (criteria.status) {
    case InstallmentPlanListStatusFilter.All:
      return true;
    case InstallmentPlanListStatusFilter.Paid:
      return row.planStatus === PlanStatus.Settled;
    case InstallmentPlanListStatusFilter.Overdue:
      return row.installments.some(
        (installment) => deriveInstallmentStatus(installment, today) === InstallmentStatus.Overdue,
      );
    case InstallmentPlanListStatusFilter.Pending:
      return row.installments.some(
        (installment) => deriveInstallmentStatus(installment, today) === InstallmentStatus.Pending,
      );
    default:
      return true;
  }
}

export function filterInstallmentPlanListRows(
  rows: InstallmentPlanListRow[],
  criteria: InstallmentPlanListFilterCriteria,
  today: CalendarDate,
): InstallmentPlanListRow[] {
  return rows.filter((row) => matchesInstallmentPlanListFilter(row, criteria, today));
}
