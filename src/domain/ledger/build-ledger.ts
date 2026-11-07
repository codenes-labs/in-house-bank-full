import { CashBoxMovementType } from '../enums/cash-box-movement-type';
import type { CashBox } from '../models/cash-box';
import type { CashBoxMovement } from '../models/cash-box-movement';
import type { FreeBalanceWithdrawal } from '../models/free-balance-withdrawal';
import { ExtratoKind } from './extrato-kind';
import { LedgerDirection } from './ledger-direction';
import type { LedgerLine } from './ledger-line';

export interface BuildLedgerInput {
  cashBoxes: CashBox[];
  cashBoxMovements: CashBoxMovement[];
  freeBalanceWithdrawals: FreeBalanceWithdrawal[];
}

export function buildLedger(input: BuildLedgerInput): LedgerLine[] {
  const cashBoxById = new Map(input.cashBoxes.map((cashBox) => [cashBox.id, cashBox]));
  const lines: LedgerLine[] = [];

  for (const withdrawal of input.freeBalanceWithdrawals) {
    lines.push({
      id: `free-balance-withdrawal:${withdrawal.id}`,
      date: withdrawal.date,
      label: 'Resgate do saldo livre',
      amountCents: withdrawal.amountCents,
      direction: LedgerDirection.Out,
      kind: ExtratoKind.FreeBalance,
    });
  }

  for (const movement of input.cashBoxMovements) {
    const cashBox = cashBoxById.get(movement.cashBoxId);
    const cashBoxName = cashBox?.name ?? 'Caixinha';
    const isDeposit = movement.type === CashBoxMovementType.Deposit;
    lines.push({
      id: `cash-box-movement:${movement.id}`,
      date: movement.date,
      label: isDeposit ? `Aporte em ${cashBoxName}` : `Resgate de ${cashBoxName}`,
      amountCents: movement.amountCents,
      direction: isDeposit ? LedgerDirection.In : LedgerDirection.Out,
      kind: ExtratoKind.CashBox,
    });
  }

  return lines.sort(compareLedgerLines);
}

export function filterLedgerByExtratoKind(lines: LedgerLine[], kind: ExtratoKind): LedgerLine[] {
  if (kind === ExtratoKind.FreeBalance || kind === ExtratoKind.CashBox) {
    return lines.filter((line) => line.kind === kind);
  }
  return [];
}

function compareLedgerLines(left: LedgerLine, right: LedgerLine): number {
  if (left.date !== right.date) {
    return left.date < right.date ? 1 : -1;
  }
  return left.id < right.id ? 1 : left.id > right.id ? -1 : 0;
}
