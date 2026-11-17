import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { signAccessToken } from './jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';

const neonMock = vi.hoisted(() => {
  const tagged = vi.fn(async () => []);
  const sql = Object.assign(tagged, {
    transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
    query: vi.fn(async () => []),
  });
  return { sql, tagged };
});

let lastUpdateReveal: string | null | undefined;

vi.mock('@neondatabase/serverless', () => ({
  neon: () => neonMock.sql,
}));

vi.mock('./account-seed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./account-seed')>();
  return {
    ...actual,
    ensureSeededAccounts: vi.fn(async () => undefined),
  };
});

vi.mock('./password', () => ({
  hashPassword: vi.fn(async () => 'hashed'),
  verifyPassword: vi.fn(async () => true),
}));

describe('POST /api/auth/password — holding_reveal_password', () => {
  const jwtSecret = 'a'.repeat(32);
  const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  beforeEach(() => {
    neonMock.tagged.mockClear();
    lastUpdateReveal = undefined;
  });

  function mockUser(mustChangePassword: boolean) {
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join('');
      if (text.includes('from users where id') && text.includes('must_change_password')) {
        return [
          {
            id: userId,
            email: 'empresa@exemplo.com',
            account_kind: 'standard',
            must_change_password: mustChangePassword,
            password_hash: 'hash',
          },
        ];
      }
      if (text.includes('update users') && text.includes('holding_reveal_password')) {
        lastUpdateReveal = values.find((v) => typeof v === 'string' && v.length >= 6) as string | null;
        if (values.includes(null)) {
          const nullIdx = values.indexOf(null);
          if (strings.join('').includes('holding_reveal_password')) {
            lastUpdateReveal = values[nullIdx] as null;
          }
        }
        for (const v of values) {
          if (v === null && text.includes('holding_reveal_password')) {
            lastUpdateReveal = null;
          }
        }
        const revealSlot = values[values.length - 2];
        if (text.includes('holding_reveal_password')) {
          const newPassword = values.find((v) => v === 'novaSenhaSegura');
          lastUpdateReveal = newPassword === 'novaSenhaSegura' ? 'novaSenhaSegura' : (revealSlot as string | null);
        }
        return [];
      }
      return [];
    });
  }

  async function postPassword(token: string, mustChangePassword: boolean) {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
    });
    const body = mustChangePassword
      ? { newPassword: 'novaSenhaSegura' }
      : { newPassword: 'novaSenhaSegura', currentPassword: 'atualOk' };
    return handler(
      new Request('http://localhost/api/auth/password', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      }),
    );
  }

  it('keeps reveal password when first login forces password change', async () => {
    mockUser(true);
    const token = await signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId, email: 'empresa@exemplo.com' },
    );
    const response = await postPassword(token, true);
    expect(response.status).toBe(200);
    expect(lastUpdateReveal).toBe('novaSenhaSegura');
  });

  it('syncs reveal password on voluntary change', async () => {
    mockUser(false);
    const token = await signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId, email: 'empresa@exemplo.com' },
    );
    const response = await postPassword(token, false);
    expect(response.status).toBe(200);
    const updateCalls = neonMock.tagged.mock.calls.filter((call) =>
      String((call[0] as TemplateStringsArray).join('')).includes('holding_reveal_password'),
    );
    expect(updateCalls.length).toBeGreaterThan(0);
    const values = updateCalls[0]?.slice(1) ?? [];
    const revealValue = values.find((v) => v === 'novaSenhaSegura');
    expect(revealValue).toBe('novaSenhaSegura');
  });
});