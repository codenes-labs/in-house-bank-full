import type { CashBox } from '../models/cash-box';
import type { FreeBalanceDeposit } from '../models/free-balance-deposit';
import type { CalendarDate } from '../models/calendar-date';

export function buildCashBoxTransferDeposit(
  cashBox: CashBox,
  depositId: string,
  date: CalendarDate,
): FreeBalanceDeposit | null {
  if (cashBox.balanceCents <= 0) {
    return null;
  }
  return {
    id: depositId,
    amountCents: cashBox.balanceCents,
    date,
    note: `Resgate da caixinha ${cashBox.name}`,
    recordedAt: new Date().toISOString(),
  };
}
