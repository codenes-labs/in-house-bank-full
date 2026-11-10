import { todayCalendarDate } from '../calendar/today-calendar-date';
import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import { InstallmentStatus } from '../enums/installment-status';
import { deriveInstallmentStatus } from '../installments/derive-installment-status';
import { formatCentsAsBrl } from '../money/brl-input';
import type { AppDataBackup } from '../models/app-data-backup';
import { csvRow } from './csv-cells';

export type SnapshotCsvInput = Omit<AppDataBackup, 'version'>;

const UTF8_BOM = '\uFEFF';

function installmentStatusLabel(status: InstallmentStatus): string {
  switch (status) {
    case InstallmentStatus.Paid:
      return 'Paga';
    case InstallmentStatus.Overdue:
      return 'Vencida';
    default:
      return 'Pendente';
  }
}

function movementTypeLabel(type: string): string {
  return type === CashBoxMovementType.Deposit ? 'Depósito' : 'Resgate';
}

export function serializeSnapshotCsv(snapshot: SnapshotCsvInput, today = todayCalendarDate()): string {
  const planById = new Map(snapshot.installmentPlans.map((plan) => [plan.id, plan]));
  const cashBoxById = new Map(snapshot.cashBoxes.map((box) => [box.id, box]));

  const lines: string[] = [];

  lines.push(csvRow(['Parcelas']));
  lines.push(
    csvRow([
      'Pagador',
      'Referência',
      'Parcela',
      'Vencimento',
      'Valor (R$)',
      'Status',
      'Pago em',
    ]),
  );
  for (const installment of snapshot.installments) {
    const plan = planById.get(installment.planId);
    const status = deriveInstallmentStatus(installment, today);
    lines.push(
      csvRow([
        plan?.borrowerName ?? '',
        plan?.reference ?? '',
        installment.number,
        installment.dueDate,
        formatCentsAsBrl(installment.amountCents),
        installmentStatusLabel(status),
        installment.paidDate ?? '',
      ]),
    );
  }

  lines.push('');
  lines.push(csvRow(['Parcelamentos']));
  lines.push(
    csvRow([
      'Pagador',
      'Referência',
      'Emitido em',
      'Parcelas',
      'Valor usado (R$)',
      'Retorno (R$)',
      'Pix',
    ]),
  );
  for (const plan of snapshot.installmentPlans) {
    lines.push(
      csvRow([
        plan.borrowerName,
        plan.reference,
        plan.issueDate,
        plan.installmentsCount,
        formatCentsAsBrl(plan.usedAmountCents),
        formatCentsAsBrl(plan.returnAmountCents),
        plan.pixKey,
      ]),
    );
  }

  lines.push('');
  lines.push(csvRow(['Caixinhas']));
  lines.push(csvRow(['Nome', 'Instituição', 'CDI (%)', 'Saldo (R$)']));
  for (const box of snapshot.cashBoxes) {
    lines.push(
      csvRow([box.name, box.institution, String(box.cdiPercent).replace('.', ','), formatCentsAsBrl(box.balanceCents)]),
    );
  }

  lines.push('');
  lines.push(csvRow(['Movimentos de caixinha']));
  lines.push(csvRow(['Caixinha', 'Data', 'Tipo', 'Valor (R$)', 'Observação']));
  for (const movement of snapshot.cashBoxMovements) {
    const box = cashBoxById.get(movement.cashBoxId);
    lines.push(
      csvRow([
        box?.name ?? '',
        movement.date,
        movementTypeLabel(movement.type),
        formatCentsAsBrl(movement.amountCents),
        movement.note ?? '',
      ]),
    );
  }

  lines.push('');
  lines.push(csvRow(['Entradas no saldo livre']));
  lines.push(csvRow(['Data', 'Valor (R$)', 'Observação']));
  for (const deposit of snapshot.freeBalanceDeposits ?? []) {
    lines.push(csvRow([deposit.date, formatCentsAsBrl(deposit.amountCents), deposit.note ?? '']));
  }

  lines.push('');
  lines.push(csvRow(['Resgates do saldo livre']));
  lines.push(csvRow(['Data', 'Valor (R$)', 'Observação']));
  for (const withdrawal of snapshot.freeBalanceWithdrawals) {
    lines.push(
      csvRow([withdrawal.date, formatCentsAsBrl(withdrawal.amountCents), withdrawal.note ?? '']),
    );
  }

  return `${UTF8_BOM}${lines.join('\r\n')}`;
}
