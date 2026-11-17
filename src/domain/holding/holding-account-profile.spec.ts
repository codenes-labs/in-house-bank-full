import { describe, expect, it } from 'vitest';
import { HOLDING_ADMIN_EMAIL } from './holding-admin';
import {
  HoldingAccountProfile,
  canAdminEditHoldingAccess,
  canAdminEditHoldingLoginEmail,
  canAdminEditHoldingMenuAccess,
  holdingAccountProfileLabel,
  isHoldingSystemAccountProfile,
  resolveHoldingAccountProfile,
} from './holding-account-profile';

describe('holding-account-profile', () => {
  it('classifies admin, demo and company', () => {
    expect(resolveHoldingAccountProfile(HOLDING_ADMIN_EMAIL, 'standard')).toBe(
      HoldingAccountProfile.Administration,
    );
    expect(resolveHoldingAccountProfile('teste@teste.com', 'demo')).toBe(HoldingAccountProfile.Demo);
    expect(resolveHoldingAccountProfile('empresa@exemplo.com', 'standard')).toBe(HoldingAccountProfile.Company);
  });

  it('allows holding edit for all listed profiles', () => {
    expect(canAdminEditHoldingAccess(HoldingAccountProfile.Company)).toBe(true);
    expect(canAdminEditHoldingAccess(HoldingAccountProfile.Demo)).toBe(true);
    expect(canAdminEditHoldingAccess(HoldingAccountProfile.Administration)).toBe(true);
  });

  it('only company may change login email', () => {
    expect(canAdminEditHoldingLoginEmail(HoldingAccountProfile.Company)).toBe(true);
    expect(canAdminEditHoldingLoginEmail(HoldingAccountProfile.Demo)).toBe(false);
    expect(canAdminEditHoldingLoginEmail(HoldingAccountProfile.Administration)).toBe(false);
  });

  it('locks menu access editing only on administration', () => {
    expect(canAdminEditHoldingMenuAccess(HoldingAccountProfile.Company)).toBe(true);
    expect(canAdminEditHoldingMenuAccess(HoldingAccountProfile.Demo)).toBe(true);
    expect(canAdminEditHoldingMenuAccess(HoldingAccountProfile.Administration)).toBe(false);
    expect(isHoldingSystemAccountProfile(HoldingAccountProfile.Administration)).toBe(true);
    expect(isHoldingSystemAccountProfile(HoldingAccountProfile.Company)).toBe(false);
  });

  it('exposes Portuguese labels', () => {
    expect(holdingAccountProfileLabel(HoldingAccountProfile.Company)).toBe('Empresa');
  });
});