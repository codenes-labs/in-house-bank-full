export function formatPixAmount(amountCents: number): string {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Pix amount must be a positive integer in cents');
  }

  return (amountCents / 100).toFixed(2);
}
