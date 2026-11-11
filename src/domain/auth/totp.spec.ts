import { describe, expect, it } from 'vitest';
import { buildTotpAuthUri, createTotpSecret, verifyTotpCode } from './totp';
import { TOTP } from 'otpauth';

describe('totp', () => {
  it('verifies a code from the same secret', () => {
    const secret = createTotpSecret();
    const totp = new TOTP({ secret, digits: 6, period: 30 });
    const now = Date.now();
    const token = totp.generate({ timestamp: now });
    expect(verifyTotpCode(secret, token, now)).toBe(true);
    expect(verifyTotpCode(secret, '000000', now)).toBe(false);
  });

  it('builds an otpauth uri with issuer and email', () => {
    const secret = createTotpSecret();
    const uri = buildTotpAuthUri(secret, 'user@example.com');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('In%20House%20Bank');
  });
});
