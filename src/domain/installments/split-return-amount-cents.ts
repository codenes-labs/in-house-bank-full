export function splitReturnAmountCents(
  returnAmountCents: number,
  installmentCount: number,
): number[] {
  assertPositiveInstallmentCount(installmentCount);

  const baseAmount = Math.round(returnAmountCents / installmentCount);
  const amounts = Array.from({ length: installmentCount }, () => baseAmount);
  const distributed = baseAmount * installmentCount;
  amounts[installmentCount - 1] += returnAmountCents - distributed;
  return amounts;
}

function assertPositiveInstallmentCount(installmentCount: number): void {
  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new Error('Installment count must be a positive integer');
  }
}
