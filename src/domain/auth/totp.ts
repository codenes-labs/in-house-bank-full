import { TOTP } from 'otpauth';

const TOTP_ISSUER = 'In House Bank';

export function createTotpSecret(): string {
  const secret = new TOTP().secret.base32;
  return secret;
}

export function buildTotpAuthUri(secret: string, accountEmail: string): string {
  const totp = new TOTP({
    issuer: TOTP_ISSUER,
    label: accountEmail,
    secret,
    digits: 6,
    period: 30,
  });
  return totp.toString();
}

export function verifyTotpCode(secret: string, code: string, nowMs = Date.now()): boolean {
  const normalized = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const totp = new TOTP({
    secret,
    digits: 6,
    period: 30,
  });
  const delta = totp.validate({ token: normalized, window: 1, timestamp: nowMs });
  return delta !== null;
}
