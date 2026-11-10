import type { InstallmentDueDateRange } from '../installments/installment-due-date-range';

export function buildFreeBalanceExtratoPdfFilename(range: InstallmentDueDateRange): string {
  return `extrato-saldo-livre-${range.from}_${range.to}.pdf`;
}
