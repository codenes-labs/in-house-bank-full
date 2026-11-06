import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import { InstallmentStatus } from '../enums/installment-status';
import type { CalendarDate } from '../models/calendar-date';

export interface InstallmentStatusInput {
  dueDate: CalendarDate;
  paidDate?: CalendarDate;
}

export function deriveInstallmentStatus(
  installment: InstallmentStatusInput,
  today: CalendarDate,
): InstallmentStatus {
  if (installment.paidDate) {
    return InstallmentStatus.Paid;
  }
  if (compareCalendarDates(installment.dueDate, today) < 0) {
    return InstallmentStatus.Overdue;
  }
  return InstallmentStatus.Pending;
}
