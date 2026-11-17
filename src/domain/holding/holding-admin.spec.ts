import { describe, expect, it } from 'vitest';
import { HOLDING_ADMIN_EMAIL, isHoldingAdminEmail } from './holding-admin';
import { canProvisionHoldingCompanies } from './holding-provision';

describe('holding-admin', () => {
  it('recognizes the holding admin email', () => {
    expect(isHoldingAdminEmail(HOLDING_ADMIN_EMAIL)).toBe(true);
    expect(isHoldingAdminEmail('  Admin@Codenes.com.br  ')).toBe(true);
  });

  it('rejects other emails', () => {
    expect(isHoldingAdminEmail('outro@exemplo.com')).toBe(false);
  });
});

describe('holding-provision', () => {
  it('allows only non-demo admin', () => {
    expect(canProvisionHoldingCompanies({ email: HOLDING_ADMIN_EMAIL, isDemo: false })).toBe(true);
    expect(canProvisionHoldingCompanies({ email: HOLDING_ADMIN_EMAIL, isDemo: true })).toBe(false);
    expect(canProvisionHoldingCompanies({ email: 'empresa@exemplo.com', isDemo: false })).toBe(false);
    expect(canProvisionHoldingCompanies({ email: 'empresa@exemplo.com', isDemo: true })).toBe(false);
  });

  it('allows holding delegate on standard account', () => {
    expect(
      canProvisionHoldingCompanies({ email: 'empresa@exemplo.com', isDemo: false, holdingDelegate: true }),
    ).toBe(true);
  });
});