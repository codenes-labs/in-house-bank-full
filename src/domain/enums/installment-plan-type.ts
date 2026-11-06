export const InstallmentPlanType = {
  Purchase: 'PURCHASE',
  Loan: 'LOAN',
  Withdrawal: 'WITHDRAWAL',
  Other: 'OTHER',
} as const;

export type InstallmentPlanType = (typeof InstallmentPlanType)[keyof typeof InstallmentPlanType];

export const INSTALLMENT_PLAN_TYPE_VALUES: readonly InstallmentPlanType[] = [
  InstallmentPlanType.Purchase,
  InstallmentPlanType.Loan,
  InstallmentPlanType.Withdrawal,
  InstallmentPlanType.Other,
];
