/** Derived installment status (RN-04). */
export const InstallmentStatus = {
  Pending: 'PENDING',
  Paid: 'PAID',
  Overdue: 'OVERDUE',
} as const;

export type InstallmentStatus = (typeof InstallmentStatus)[keyof typeof InstallmentStatus];
