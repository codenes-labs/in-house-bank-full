import {
  InstallmentPlanType,
  type InstallmentPlanType as InstallmentPlanTypeValue,
} from '../enums/installment-plan-type';

export const INSTALLMENT_PLAN_TYPE_LABELS: Record<InstallmentPlanTypeValue, string> = {
  [InstallmentPlanType.Purchase]: 'Compra',
  [InstallmentPlanType.Loan]: 'Empréstimo',
  [InstallmentPlanType.Withdrawal]: 'Sangria',
  [InstallmentPlanType.Other]: 'Outro',
};
