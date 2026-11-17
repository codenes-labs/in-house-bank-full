import { describe, expect, it } from 'vitest';
import { HoldingAccountProfile } from './holding-account-profile';
import {
  effectiveHoldingRegistrationCode,
  holdingCompanyListSortKey,
} from './holding-company-list-order';

describe('holding-company-list-order', () => {
  it('defaults admin and demo ids when missing', () => {
    expect(effectiveHoldingRegistrationCode(HoldingAccountProfile.Administration, null)).toBe('001001');
    expect(effectiveHoldingRegistrationCode(HoldingAccountProfile.Demo, null)).toBe('001002');
  });

  it('sorts system accounts before companies', () => {
    expect(holdingCompanyListSortKey(HoldingAccountProfile.Administration, null)).toBe(1001);
    expect(holdingCompanyListSortKey(HoldingAccountProfile.Demo, null)).toBe(1002);
    expect(holdingCompanyListSortKey(HoldingAccountProfile.Administration, '001001')).toBe(1001);
    expect(holdingCompanyListSortKey(HoldingAccountProfile.Company, '100001')).toBe(100001);
    expect(
      holdingCompanyListSortKey(HoldingAccountProfile.Administration, null) <
        holdingCompanyListSortKey(HoldingAccountProfile.Company, '100001'),
    ).toBe(true);
  });
});