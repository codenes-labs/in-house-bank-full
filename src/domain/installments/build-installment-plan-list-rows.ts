import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import { computeExpectedProfitCents } from './compute-expected-profit-cents';
import { derivePlanStatus } from './derive-plan-status';
import type { InstallmentPlanListRow } from './installment-plan-list-row';

export function buildInstallmentPlanListRows(
  plans: InstallmentPlan[],
  installments: Installment[],
  today: CalendarDate,
): InstallmentPlanListRow[] {
  const installmentsByPlanId = new Map<string, Installment[]>();
  for (const installment of installments) {
    const bucket = installmentsByPlanId.get(installment.planId) ?? [];
    bucket.push(installment);
    installmentsByPlanId.set(installment.planId, bucket);
  }

  return [...plans]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((plan) => {
      const planInstallments = [...(installmentsByPlanId.get(plan.id) ?? [])].sort(
        (left, right) => left.number - right.number,
      );
      const paidCount = planInstallments.filter((installment) => installment.paidDate).length;

      return {
        plan,
        installments: planInstallments,
        paidCount,
        expectedProfitCents: computeExpectedProfitCents(plan),
        planStatus: derivePlanStatus(planInstallments, today),
      };
    });
}
