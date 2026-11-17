import { describe, expect, it } from 'vitest';
import {
  canAdminDeleteHoldingCompany,
  holdingCompanyHasOperationalData,
} from './holding-company-operational-data';

describe('holdingCompanyHasOperationalData', () => {
  it('is false for empty metrics', () => {
    expect(
      holdingCompanyHasOperationalData({
        installmentPlanCount: 0,
        cashBoxCount: 0,
        cashBoxMovementCount: 0,
        freeBalanceCents: 0,
        freeBalanceDepositCount: 0,
        freeBalanceWithdrawalCount: 0,
      }),
    ).toBe(false);
  });

  it('is true when any operational artifact exists', () => {
    expect(
      holdingCompanyHasOperationalData({
        installmentPlanCount: 1,
        cashBoxCount: 0,
        cashBoxMovementCount: 0,
        freeBalanceCents: 0,
        freeBalanceDepositCount: 0,
        freeBalanceWithdrawalCount: 0,
      }),
    ).toBe(true);
  });
});

describe('canAdminDeleteHoldingCompany', () => {
  it('only allows company profile', () => {
    expect(canAdminDeleteHoldingCompany('company')).toBe(true);
    expect(canAdminDeleteHoldingCompany('administration')).toBe(false);
    expect(canAdminDeleteHoldingCompany('demo')).toBe(false);
  });
});