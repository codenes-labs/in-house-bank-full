export type ApplyFreeBalanceWithdrawalError = 'INVALID_AMOUNT' | 'INSUFFICIENT_BALANCE';

export type ApplyFreeBalanceWithdrawalResult =
  | { ok: true; freeBalanceCents: number }
  | { ok: false; error: ApplyFreeBalanceWithdrawalError };

export function applyFreeBalanceWithdrawal(
  freeBalanceCents: number,
  amountCents: number,
): ApplyFreeBalanceWithdrawalResult {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: 'INVALID_AMOUNT' };
  }
  const nextBalance = freeBalanceCents - amountCents;
  if (nextBalance < 0) {
    return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  }
  return { ok: true, freeBalanceCents: nextBalance };
}
