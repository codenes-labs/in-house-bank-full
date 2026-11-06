import type { Installment } from '../models/installment';

export type InstallmentDeletionError = 'PAID_INSTALLMENT';

export function canDeleteInstallment(installment: Installment): boolean {
  return !installment.paidDate;
}

export function assertInstallmentDeletable(
  installment: Installment,
): { ok: true } | { ok: false; error: InstallmentDeletionError } {
  if (!canDeleteInstallment(installment)) {
    return { ok: false, error: 'PAID_INSTALLMENT' };
  }
  return { ok: true };
}
