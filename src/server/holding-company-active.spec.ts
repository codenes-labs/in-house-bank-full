import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { ADMIN_EMAIL, ADMIN_USER_ID } from './account-seed';
import { signAccessToken } from './jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';

const neonMock = vi.hoisted(() => {
  const tagged = vi.fn(async () => []);
  return { sql: Object.assign(tagged, { transaction: vi.fn(), query: vi.fn(async () => []) }), tagged };
});

vi.mock('@neondatabase/serverless', () => ({
  neon: () => neonMock.sql,
}));

vi.mock('./account-seed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./account-seed')>();
  return { ...actual, ensureSeededAccounts: vi.fn(async () => undefined) };
});

describe('PATCH /api/holding/companies/:id/active', () => {
  const jwtSecret = 'a'.repeat(32);

  beforeEach(() => {
    neonMock.tagged.mockClear();
  });

  async function bearer(): Promise<string> {
    return signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: ADMIN_USER_ID, email: ADMIN_EMAIL },
    );
  }

  it('rejects toggling administration account', async () => {
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users') && text.includes('where id')) {
        return [
          {
            id: ADMIN_USER_ID,
            email: ADMIN_EMAIL,
            account_kind: 'standard',
            must_change_password: false,
            holding_delegate: false,
            menu_access: {},
            account_active: true,
          },
        ];
      }
      return [];
    });
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const token = await bearer();
    const response = await handler(
      new Request(`http://localhost/api/holding/companies/${ADMIN_USER_ID}/active`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ active: false }),
      }),
    );
    expect(response.status).toBe(400);
  });
});