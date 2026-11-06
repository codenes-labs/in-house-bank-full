import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from './jwt';

describe('signAccessToken', () => {
  it('issues a token that verifies with the same secret', async () => {
    const token = await signAccessToken(
      { secret: 'test-secret-at-least-32-chars-long', expiresInSeconds: 3600 },
      { userId: '11111111-1111-1111-1111-111111111111', email: 'ana@example.com' },
    );
    const claims = await verifyAccessToken('test-secret-at-least-32-chars-long', token);
    expect(claims).toEqual({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'ana@example.com',
    });
  });

  it('rejects tokens signed with another secret', async () => {
    const token = await signAccessToken(
      { secret: 'first-secret-at-least-32-characters', expiresInSeconds: 3600 },
      { userId: '11111111-1111-1111-1111-111111111111', email: 'ana@example.com' },
    );
    await expect(verifyAccessToken('second-secret-at-least-32-characters', token)).rejects.toThrow();
  });

  it('rejects expired tokens', async () => {
    const token = await signAccessToken(
      { secret: 'test-secret-at-least-32-chars-long', expiresInSeconds: -1 },
      { userId: '11111111-1111-1111-1111-111111111111', email: 'ana@example.com' },
    );
    await expect(verifyAccessToken('test-secret-at-least-32-chars-long', token)).rejects.toThrow(/expirado/i);
  });
});
