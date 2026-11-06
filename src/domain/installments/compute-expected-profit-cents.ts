export function computeExpectedProfitCents(input: {
  usedAmountCents: number;
  returnAmountCents: number;
}): number {
  return input.returnAmountCents - input.usedAmountCents;
}
