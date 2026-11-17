import { describe, expect, it } from 'vitest';
import { HOLDING_ADMIN_EMAIL } from './holding-admin';
import {
  HoldingAccountProfile,
  canAdminEditHoldingAccess,
  holdingAccountProfileLabel,
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

  it('only company profile is editable', () => {
    expect(canAdminEditHoldingAccess(HoldingAccountProfile.Company)).toBe(true);
    expect(canAdminEditHoldingAccess(HoldingAccountProfile.Demo)).toBe(false);
    expect(canAdminEditHoldingAccess(HoldingAccountProfile.Administration)).toBe(false);
  });

  it('exposes Portuguese labels', () => {
    expect(holdingAccountProfileLabel(HoldingAccountProfile.Company)).toBe('Empresa');
  });
});