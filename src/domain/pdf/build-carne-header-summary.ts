import { INSTALLMENT_PLAN_TYPE_LABELS } from '../quick-generator/installment-plan-type-labels';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';
import { formatCentsAsBrl } from '../money/brl-input';
import { formatCalendarDateBr } from './format-calendar-date-br';

export function buildCarneHeaderSummary(
  plan: InstallmentPlan,
  installments: Installment[],
): string {
  const installmentAmountCents = installments[0]?.amountCents ?? 0;
  const typeLabel = INSTALLMENT_PLAN_TYPE_LABELS[plan.type].toLowerCase();
  return `${plan.reference} | ${typeLabel} em ${formatCalendarDateBr(plan.issueDate)} | ${plan.installmentsCount} parcelas de R$ ${formatCentsAsBrl(installmentAmountCents)} | Total R$ ${formatCentsAsBrl(plan.returnAmountCents)}`;
}
