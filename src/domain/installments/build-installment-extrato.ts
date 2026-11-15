import { compareCalendarDates } from '../calendar/compare-calendar-dates';
import { InstallmentStatus } from '../enums/installment-status';
import { formatCashBoxMonthLabel } from '../cash-boxes/format-cash-box-month-label';
import { deriveInstallmentStatus } from './derive-installment-status';
import { installmentDueDateInRange, type InstallmentDueDateRange } from './installment-due-date-range';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';

export interface InstallmentExtratoLine {
  id: string;
  dueDate: CalendarDate;
  borrowerName: string;
  planReference: string;
  planId: string;
  installmentNumber: number;
  amountCents: number;
  status: InstallmentStatus;
}

export interface InstallmentExtratoMetrics {
  paidCount: number;
  receivedTotalCents: number;
  overdueCount: number;
}

export interface InstallmentExtratoMonthGroup {
  yearMonth: string;
  label: string;
  lines: InstallmentExtratoLine[];
}

export interface BuildInstallmentExtratoInput {
  plans: readonly InstallmentPlan[];
  installments: readonly Installment[];
  range: InstallmentDueDateRange;
  today: CalendarDate;
}

function planById(plans: readonly InstallmentPlan[]): Map<string, InstallmentPlan> {
  return new Map(plans.map((plan) => [plan.id, plan]));
}

export function installmentMatchesExtratoRange(
  installment: Pick<Installment, 'dueDate' | 'paidDate'>,
  range: InstallmentDueDateRange,
): boolean {
  if (installmentDueDateInRange(installment.dueDate, range)) {
    return true;
  }
  if (installment.paidDate && installmentDueDateInRange(installment.paidDate, range)) {
    return true;
  }
  return false;
}

export function buildInstallmentExtratoLines(input: BuildInstallmentExtratoInput): InstallmentExtratoLine[] {
  const plans = planById(input.plans);
  const lines: InstallmentExtratoLine[] = [];

  for (const installment of input.installments) {
    if (!installmentMatchesExtratoRange(installment, input.range)) {
      continue;
    }
    const plan = plans.get(installment.planId);
    if (!plan) {
      continue;
    }
    lines.push({
      id: installment.id,
      dueDate: installment.dueDate,
      borrowerName: plan.borrowerName,
      planReference: plan.reference,
      planId: plan.id,
      installmentNumber: installment.number,
      amountCents: installment.amountCents,
      status: deriveInstallmentStatus(installment, input.today),
    });
  }

  return lines.sort(compareInstallmentExtratoNewestFirst);
}

export function computeInstallmentExtratoMetrics(
  installments: readonly Installment[],
  range: InstallmentDueDateRange,
  lines: readonly InstallmentExtratoLine[],
): InstallmentExtratoMetrics {
  let paidCount = 0;
  let receivedTotalCents = 0;

  for (const installment of installments) {
    if (!installment.paidDate || !installmentDueDateInRange(installment.paidDate, range)) {
      continue;
    }
    paidCount += 1;
    receivedTotalCents += installment.amountCents;
  }

  const overdueCount = lines.filter((line) => line.status === InstallmentStatus.Overdue).length;

  return { paidCount, receivedTotalCents, overdueCount };
}

function compareInstallmentExtratoNewestFirst(
  left: InstallmentExtratoLine,
  right: InstallmentExtratoLine,
): number {
  const byDue = compareCalendarDates(right.dueDate, left.dueDate);
  if (byDue !== 0) {
    return byDue;
  }
  return right.installmentNumber - left.installmentNumber;
}

function yearMonthFromDate(date: CalendarDate): string {
  return date.slice(0, 7);
}

export function groupInstallmentExtratoByMonth(lines: readonly InstallmentExtratoLine[]): InstallmentExtratoMonthGroup[] {
  const sorted = [...lines].sort(compareInstallmentExtratoNewestFirst);
  const groups = new Map<string, InstallmentExtratoLine[]>();

  for (const line of sorted) {
    const key = yearMonthFromDate(line.dueDate);
    const list = groups.get(key) ?? [];
    list.push(line);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([yearMonth, monthLines]) => ({
      yearMonth,
      label: formatCashBoxMonthLabel(yearMonth),
      lines: monthLines,
    }));
}