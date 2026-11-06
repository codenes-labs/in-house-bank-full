import type { Installment } from '../models/installment';

export const PlanDeleteConfirmationLevel = {
  Standard: 'STANDARD',
  Reinforced: 'REINFORCED',
} as const;

export type PlanDeleteConfirmationLevel =
  (typeof PlanDeleteConfirmationLevel)[keyof typeof PlanDeleteConfirmationLevel];

export function resolvePlanDeleteConfirmationLevel(
  installments: Installment[],
): PlanDeleteConfirmationLevel {
  const hasPaidInstallment = installments.some((installment) => installment.paidDate);
  return hasPaidInstallment
    ? PlanDeleteConfirmationLevel.Reinforced
    : PlanDeleteConfirmationLevel.Standard;
}
