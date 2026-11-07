export type ApplyFreeBalanceDepositError = 'INVALID_AMOUNT';

export type ApplyFreeBalanceDepositResult =
  | { ok: true; freeBalanceCents: number }
  | { ok: false; error: ApplyFreeBalanceDepositError };

export function applyFreeBalanceDeposit(
  freeBalanceCents: number,
  amountCents: number,
): ApplyFreeBalanceDepositResult {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: 'INVALID_AMOUNT' };
  }
  return { ok: true, freeBalanceCents: freeBalanceCents + amountCents };
}
