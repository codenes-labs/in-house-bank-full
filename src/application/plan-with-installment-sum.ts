import { sumInstallmentsAmountCents } from '../domain/installments/sum-installments-amount-cents';
import type { Installment } from '../domain/models/installment';
import type { InstallmentPlan } from '../domain/models/installment-plan';

export function planWithInstallmentSum(
  plan: InstallmentPlan,
  installments: Installment[],
): InstallmentPlan {
  const own = installments.filter((installment) => installment.planId === plan.id);
  return {
    ...plan,
    installmentsCount: own.length,
    returnAmountCents: sumInstallmentsAmountCents(own),
  };
}
