import { InstallmentStatus } from '../enums/installment-status';
import { PlanStatus } from '../enums/plan-status';

export function installmentStatusLabel(status: InstallmentStatus): string {
  switch (status) {
    case InstallmentStatus.Paid:
      return 'Paga';
    case InstallmentStatus.Overdue:
      return 'Vencida';
    case InstallmentStatus.Pending:
      return 'Pendente';
  }
}

export function planStatusLabel(status: PlanStatus): string {
  switch (status) {
    case PlanStatus.Settled:
      return 'Quitado';
    case PlanStatus.Overdue:
      return 'Em atraso';
    case PlanStatus.OnTrack:
      return 'Em dia';
  }
}
