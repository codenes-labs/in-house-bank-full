import { describe, expect, it } from 'vitest';
import { signAccessToken } from '../server/jwt';
import { isAccessTokenExpired, readAccessTokenExpMs } from './access-token-expiry';

describe('access-token-expiry', () => {
  it('reads exp from issued jwt', async () => {
    const before = Date.now();
    const token = await signAccessToken(
      { secret: 'test-secret-at-least-32-chars-long', expiresInSeconds: 120 },
      { userId: '11111111-1111-1111-1111-111111111111', email: 'ana@example.com' },
    );
    const expMs = readAccessTokenExpMs(token);
    expect(expMs).not.toBeNull();
    expect(expMs!).toBeGreaterThanOrEqual(before + 119_000);
    expect(isAccessTokenExpired(token)).toBe(false);
  });

  it('detects expired jwt', async () => {
    const token = await signAccessToken(
      { secret: 'test-secret-at-least-32-chars-long', expiresInSeconds: -10 },
      { userId: '11111111-1111-1111-1111-111111111111', email: 'ana@example.com' },
    );
    expect(isAccessTokenExpired(token)).toBe(true);
  });
});
