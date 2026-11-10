import type { InstallmentDueDateRange } from '../installments/installment-due-date-range';

export function buildCashBoxExtratoPdfFilename(range: InstallmentDueDateRange): string {
  return `extrato-caixinha-${range.from}_${range.to}.pdf`;
}
