import { InstallmentStatus } from '../enums/installment-status';
import { PlanStatus } from '../enums/plan-status';
import type { CalendarDate } from '../models/calendar-date';
import { deriveInstallmentStatus, type InstallmentStatusInput } from './derive-installment-status';

export function derivePlanStatus(
  installments: InstallmentStatusInput[],
  today: CalendarDate,
): PlanStatus {
  if (installments.length === 0) {
    return PlanStatus.OnTrack;
  }

  const statuses = installments.map((installment) => deriveInstallmentStatus(installment, today));
  if (statuses.every((status) => status === InstallmentStatus.Paid)) {
    return PlanStatus.Settled;
  }
  if (statuses.some((status) => status === InstallmentStatus.Overdue)) {
    return PlanStatus.Overdue;
  }
  return PlanStatus.OnTrack;
}
