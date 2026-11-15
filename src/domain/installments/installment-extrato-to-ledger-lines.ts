import { ExtratoKind } from '../ledger/extrato-kind';
import { LedgerDirection } from '../ledger/ledger-direction';
import type { LedgerLine } from '../ledger/ledger-line';
import { formatInstallmentOrdinalPt } from './format-installment-ordinal-pt';
import type { InstallmentExtratoLine } from './build-installment-extrato';
import { installmentStatusLabel } from './status-labels';

export function installmentExtratoToLedgerLines(lines: readonly InstallmentExtratoLine[]): LedgerLine[] {
  return lines.map((line) => ({
    id: `installment-extrato:${line.id}`,
    date: line.dueDate,
    label: `${formatInstallmentOrdinalPt(line.installmentNumber)} · ${line.borrowerName} · Ref. ${line.planReference} — ${installmentStatusLabel(line.status)}`,
    amountCents: line.amountCents,
    direction: LedgerDirection.In,
    kind: ExtratoKind.Installments,
  }));
}