import type { Installment } from '../models/installment';

export function sumInstallmentsAmountCents(installments: Installment[]): number {
  return installments.reduce((total, installment) => total + installment.amountCents, 0);
}
