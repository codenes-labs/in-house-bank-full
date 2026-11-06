import { deriveInstallmentStatus } from '../installments/derive-installment-status';
import {
  filterInstallmentsDueInNextCalendarMonth,
  nextCalendarMonthKey,
} from './filter-installments-due-in-next-calendar-month';
import { computeExpectedProfitCents } from '../installments/compute-expected-profit-cents';
import type { CashBox } from '../models/cash-box';
import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import type { Settings } from '../models/settings';
import { InstallmentStatus } from '../enums/installment-status';

export interface DashboardMetrics {
  totalEmittedCents: number;
  totalUsedCents: number;
  totalReceivedCents: number;
  expectedProfitCents: number;
  realizedProfitCents: number;
  overdueCount: number;
  overdueAmountCents: number;
  upcomingCount: number;
  upcomingAmountCents: number;
  upcomingMonthKey: string;
  patrimonyCents: number;
  nextMilestoneCents: number | null;
  milestoneProgressPercent: number;
}

export function computeDashboardMetrics(input: {
  plans: InstallmentPlan[];
  installments: Installment[];
  settings: Settings;
  cashBoxes: CashBox[];
  today: CalendarDate;
}): DashboardMetrics {
  const installmentsByPlanId = groupInstallmentsByPlanId(input.installments);

  const totalEmittedCents = input.plans.reduce((total, plan) => total + plan.returnAmountCents, 0);
  const totalUsedCents = input.plans.reduce((total, plan) => total + plan.usedAmountCents, 0);
  const totalReceivedCents = input.installments
    .filter((installment) => installment.paidDate)
    .reduce((total, installment) => total + installment.amountCents, 0);

  const expectedProfitCents = input.plans.reduce(
    (total, plan) => total + computeExpectedProfitCents(plan),
    0,
  );

  const realizedProfitCents = input.plans.reduce((total, plan) => {
    const planInstallments = installmentsByPlanId.get(plan.id) ?? [];
    const receivedCents = planInstallments
      .filter((installment) => installment.paidDate)
      .reduce((sum, installment) => sum + installment.amountCents, 0);
    return total + Math.max(0, receivedCents - plan.usedAmountCents);
  }, 0);

  const overdueInstallments = input.installments.filter(
    (installment) =>
      deriveInstallmentStatus(installment, input.today) === InstallmentStatus.Overdue,
  );
  const upcomingMonthKey = nextCalendarMonthKey(input.today);
  const upcomingInstallments = filterInstallmentsDueInNextCalendarMonth(
    input.installments,
    input.today,
  );
  const patrimonyCents =
    input.settings.freeBalanceCents +
    input.cashBoxes.reduce((total, cashBox) => total + cashBox.balanceCents, 0);

  const milestone = resolveNextMilestoneProgress(patrimonyCents, input.settings.milestonesCents);

  return {
    totalEmittedCents,
    totalUsedCents,
    totalReceivedCents,
    expectedProfitCents,
    realizedProfitCents,
    overdueCount: overdueInstallments.length,
    overdueAmountCents: sumAmounts(overdueInstallments),
    upcomingCount: upcomingInstallments.length,
    upcomingAmountCents: sumAmounts(upcomingInstallments),
    upcomingMonthKey,
    patrimonyCents,
    nextMilestoneCents: milestone.nextMilestoneCents,
    milestoneProgressPercent: milestone.progressPercent,
  };
}

export function resolveNextMilestoneProgress(
  patrimonyCents: number,
  milestonesCents: number[],
): { nextMilestoneCents: number | null; progressPercent: number } {
  const sorted = [...milestonesCents].filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { nextMilestoneCents: null, progressPercent: 0 };
  }

  const nextMilestone = sorted.find((milestone) => milestone > patrimonyCents) ?? null;
  if (!nextMilestone) {
    return { nextMilestoneCents: null, progressPercent: 100 };
  }

  const progressPercent = Math.min(100, Math.round((patrimonyCents / nextMilestone) * 100));
  return { nextMilestoneCents: nextMilestone, progressPercent };
}

function groupInstallmentsByPlanId(installments: Installment[]): Map<string, Installment[]> {
  const map = new Map<string, Installment[]>();
  for (const installment of installments) {
    const bucket = map.get(installment.planId) ?? [];
    bucket.push(installment);
    map.set(installment.planId, bucket);
  }
  return map;
}

function sumAmounts(installments: Installment[]): number {
  return installments.reduce((total, installment) => total + installment.amountCents, 0);
}
