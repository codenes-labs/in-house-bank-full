import type { CashBox } from '../models/cash-box';

export function availableDepositCents(cashBox: CashBox): number {
  if (cashBox.limitCents === undefined) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Math.max(0, cashBox.limitCents - cashBox.balanceCents);
}

export function suggestCashBoxForDeposit(
  cashBoxes: CashBox[],
  excludedCashBoxId: string,
  depositAmountCents: number,
): CashBox | null {
  return (
    [...cashBoxes]
      .filter((cashBox) => cashBox.id !== excludedCashBoxId)
      .filter((cashBox) => availableDepositCents(cashBox) >= depositAmountCents)
      .sort((left, right) => right.cdiPercent - left.cdiPercent)[0] ?? null
  );
}
