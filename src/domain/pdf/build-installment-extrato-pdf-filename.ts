import type { InstallmentDueDateRange } from '../installments/installment-due-date-range';

export function buildInstallmentExtratoPdfFilename(range: InstallmentDueDateRange): string {
  return `extrato-parcelamento-${range.from}_${range.to}.pdf`;
}