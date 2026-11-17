import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { INACTIVE_ACCOUNT_LOGIN_MESSAGE } from '../domain/auth/inactive-account-login';
import { signAccessToken } from './jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';
import { DEMO_EMAIL } from './account-seed';

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const neonMock = vi.hoisted(() => {
  const tagged = vi.fn(async () => []);
  return { sql: Object.assign(tagged, { transaction: vi.fn(), query: vi.fn(async () => []) }), tagged };
});

let accountActive = true;

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

describe('inactive account while session open', () => {
  const jwtSecret = 'a'.repeat(32);

  beforeEach(() => {
    accountActive = true;
    neonMock.tagged.mockClear();
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users where id')) {
        return [
          {
            id: USER_ID,
            email: DEMO_EMAIL,
            account_kind: 'demo',
            must_change_password: false,
            holding_delegate: false,
            menu_access: {},
            account_active: accountActive,
          },
        ];
      }
      return [];
    });
  });

  async function bearerToken(): Promise<string> {
    return signAccessToken({ secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS }, {
      userId: USER_ID,
      email: DEMO_EMAIL,
    });
  }

  async function sessionGet(token: string) {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
      authSecurity: { turnstileSecret: undefined },
    });
    return handler(
      new Request('http://localhost/api/auth/session', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
  }

  async function bankGet(token: string) {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
      authSecurity: { turnstileSecret: undefined },
    });
    return handler(
      new Request('http://localhost/api/bank', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
  }

  it('GET /api/auth/session returns accountInactive when JWT is valid but account is inactive', async () => {
    accountActive = false;
    const token = await bearerToken();
    const response = await sessionGet(token);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      user?: unknown;
      accountInactive?: boolean;
    };
    expect(body.user).toBeNull();
    expect(body.accountInactive).toBe(true);
  });

  it('protected API returns 403 accountInactive for inactive account', async () => {
    accountActive = false;
    const token = await bearerToken();
    const response = await bankGet(token);
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string; accountInactive?: boolean };
    expect(body.error).toBe(INACTIVE_ACCOUNT_LOGIN_MESSAGE);
    expect(body.accountInactive).toBe(true);
  });
});