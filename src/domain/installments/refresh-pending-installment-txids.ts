import { buildInstallmentTxid } from './build-installment-txid';
import type { Installment } from '../models/installment';
import type { InstallmentPlan } from '../models/installment-plan';

export function refreshPendingInstallmentTxids(
  plan: InstallmentPlan,
  installments: Installment[],
): Installment[] {
  return installments.map((installment) => {
    if (installment.paidDate || installment.planId !== plan.id) {
      return installment;
    }
    return { ...installment, txid: buildInstallmentTxid(plan.id, installment.number) };
  });
}
