export const CashBoxMovementType = {
  Deposit: 'DEPOSIT',
  Withdrawal: 'WITHDRAWAL',
} as const;

export type CashBoxMovementType = (typeof CashBoxMovementType)[keyof typeof CashBoxMovementType];
