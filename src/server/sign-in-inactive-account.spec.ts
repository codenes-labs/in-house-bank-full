import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { INACTIVE_ACCOUNT_LOGIN_MESSAGE } from '../domain/auth/inactive-account-login';
import { DEMO_EMAIL, DEMO_PASSWORD } from './account-seed';

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

vi.mock('./password', () => ({
  hashPassword: vi.fn(async () => 'hashed'),
  verifyPassword: vi.fn(async (plain: string) => plain === 'senha123' || plain === DEMO_PASSWORD),
}));

vi.mock('./auth-rate-limit-flow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./auth-rate-limit-flow')>();
  return {
    ...actual,
    loadRateLimitStates: vi.fn(async () => []),
    recordRateLimitFailures: vi.fn(async () => ({ locked: false, retryAfterSeconds: 0 })),
    clearRateLimitKeys: vi.fn(async () => undefined),
  };
});

vi.mock('./turnstile', () => ({
  verifyTurnstileToken: vi.fn(async () => true),
}));

describe('POST /api/auth/sign-in — account_active', () => {
  const jwtSecret = 'a'.repeat(32);

  beforeEach(() => {
    accountActive = true;
    neonMock.tagged.mockClear();
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users where email')) {
        return [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            email: DEMO_EMAIL,
            password_hash: 'hash',
            account_kind: 'demo',
            must_change_password: false,
            holding_delegate: false,
            menu_access: {},
            totp_secret: null,
            totp_enabled: false,
            account_active: accountActive,
          },
        ];
      }
      return [];
    });
  });

  async function signIn(password: string) {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
      authSecurity: { turnstileSecret: undefined },
    });
    return handler(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: DEMO_EMAIL, password }),
      }),
    );
  }

  it('rejects inactive account when password is correct', async () => {
    accountActive = false;
    const response = await signIn(DEMO_PASSWORD);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe(INACTIVE_ACCOUNT_LOGIN_MESSAGE);
  });

  it('keeps generic error for inactive account with wrong password', async () => {
    accountActive = false;
    const response = await signIn('errada1');
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe('E-mail ou senha incorretos.');
  });
});