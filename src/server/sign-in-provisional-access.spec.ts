import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { DEMO_EMAIL } from './account-seed';

const neonMock = vi.hoisted(() => {
  const tagged = vi.fn(async () => []);
  return { sql: Object.assign(tagged, { transaction: vi.fn(), query: vi.fn(async () => []) }), tagged };
});

let primaryOk = false;
let provisionalOk = false;
let provisionalUntil = '2099-01-01T00:00:00.000Z';

vi.mock('@neondatabase/serverless', () => ({
  neon: () => neonMock.sql,
}));

vi.mock('./account-seed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./account-seed')>();
  return { ...actual, ensureSeededAccounts: vi.fn(async () => undefined) };
});

vi.mock('./password', () => ({
  hashPassword: vi.fn(async () => 'hashed'),
  verifyPassword: vi.fn(async (plain: string, hash: string) => {
    if (hash === 'main' && plain === 'principal1') {
      return primaryOk;
    }
    if (hash === 'prov' && plain === 'provisoria1') {
      return provisionalOk;
    }
    return false;
  }),
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

describe('POST /api/auth/sign-in — provisional access', () => {
  const jwtSecret = 'a'.repeat(32);

  beforeEach(() => {
    primaryOk = false;
    provisionalOk = true;
    neonMock.tagged.mockClear();
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users where email')) {
        return [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            email: DEMO_EMAIL,
            password_hash: 'main',
            account_kind: 'demo',
            must_change_password: false,
            holding_delegate: false,
            menu_access: {},
            totp_secret: null,
            totp_enabled: false,
            account_active: true,
            holding_provisional_password_hash: 'prov',
            holding_provisional_valid_until: provisionalUntil,
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

  it('allows login with valid provisional when primary fails', async () => {
    const response = await signIn('provisoria1');
    expect(response.status).toBe(200);
  });

  it('rejects expired provisional', async () => {
    provisionalUntil = '2020-01-01T00:00:00.000Z';
    const response = await signIn('provisoria1');
    expect(response.status).toBe(400);
    provisionalUntil = '2099-01-01T00:00:00.000Z';
  });
});