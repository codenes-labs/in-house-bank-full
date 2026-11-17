export type HoldingCompanyDataMetrics = {
  installmentPlanCount: number;
  cashBoxCount: number;
  cashBoxMovementCount: number;
  freeBalanceCents: number;
  freeBalanceDepositCount: number;
  freeBalanceWithdrawalCount: number;
};

export function holdingCompanyHasOperationalData(metrics: HoldingCompanyDataMetrics): boolean {
  return (
    metrics.installmentPlanCount > 0 ||
    metrics.cashBoxCount > 0 ||
    metrics.cashBoxMovementCount > 0 ||
    metrics.freeBalanceDepositCount > 0 ||
    metrics.freeBalanceWithdrawalCount > 0 ||
    metrics.freeBalanceCents !== 0
  );
}

import { HoldingAccountProfile } from './holding-account-profile';

export function canAdminDeleteHoldingCompany(profile: HoldingAccountProfile): boolean {
  return profile === HoldingAccountProfile.Company;
}