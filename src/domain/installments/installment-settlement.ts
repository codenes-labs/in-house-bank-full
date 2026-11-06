import type { CalendarDate } from '../models/calendar-date';
import type { Installment } from '../models/installment';

export type SettleInstallmentError = 'ALREADY_PAID';
export type ClearInstallmentSettlementError = 'NOT_PAID';

export type SettleInstallmentResult =
  { ok: true; installment: Installment } | { ok: false; error: SettleInstallmentError };

export type ClearInstallmentSettlementResult =
  { ok: true; installment: Installment } | { ok: false; error: ClearInstallmentSettlementError };

export function settleInstallment(
  installment: Installment,
  paidDate: CalendarDate,
): SettleInstallmentResult {
  if (installment.paidDate) {
    return { ok: false, error: 'ALREADY_PAID' };
  }
  return { ok: true, installment: { ...installment, paidDate } };
}

export function clearInstallmentSettlement(
  installment: Installment,
): ClearInstallmentSettlementResult {
  if (!installment.paidDate) {
    return { ok: false, error: 'NOT_PAID' };
  }
  const rest = { ...installment };
  delete rest.paidDate;
  return { ok: true, installment: rest };
}
