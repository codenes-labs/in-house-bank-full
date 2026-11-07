export const LedgerDirection = {
  In: 'IN',
  Out: 'OUT',
} as const;

export type LedgerDirection = (typeof LedgerDirection)[keyof typeof LedgerDirection];
