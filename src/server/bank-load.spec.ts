import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { createEmptySettings } from '../domain/models/settings';
import { DEMO_USER_ID, DEMO_EMAIL } from './account-seed';
import { signAccessToken } from './jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';

const neonMock = vi.hoisted(() => {
  const query = vi.fn(async () => []);
  const tx = vi.fn(async (queries: Promise<unknown>[] | unknown[]) => {
    const list = Array.isArray(queries) ? queries : [queries];
    const results: unknown[][] = [];
    for (const item of list) {
      if (item && typeof item === 'object' && 'then' in item) {
        results.push((await item) as unknown[]);
      }
    }
    return results;
  });
  const tagged = vi.fn(async () => []);
  const sql = Object.assign(tagged, { transaction: tx, query });
  return { sql, tx, tagged, query };
});

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

describe('GET /api/bank after settings save (regression)', () => {
  const jwtSecret = 'a'.repeat(32);
  const standardUserId = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    neonMock.tagged.mockClear();
    neonMock.tx.mockClear();
  });

  function mockStandardUserSession() {
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users where')) {
        return [
          {
            id: standardUserId,
            email: 'user@local.test',
            account_kind: 'standard',
            must_change_password: false,
          },
        ];
      }
      return [];
    });
  }

  it('returns snapshot rows from transaction results (theme in settings)', async () => {
    mockStandardUserSession();
    neonMock.tx.mockImplementation(async () => [
      [],
      [{ theme: 'dark', user_id: standardUserId }],
      [],
      [],
      [],
      [],
      [],
      [],
    ]);

    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@db:5432/inhouse',
      jwtSecret,
    });

    const token = await signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: standardUserId, email: 'user@local.test' },
    );

    const response = await handler(
      new Request('http://localhost/api/bank', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { settings: { theme: string } };
    expect(body.settings.theme).toBe('dark');
  });

  it('returns empty settings when settings row is missing', async () => {
    mockStandardUserSession();
    neonMock.tx.mockResolvedValue([[], [], [], [], [], [], [], [], []]);

    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@db:5432/inhouse',
      jwtSecret,
    });

    const token = await signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: standardUserId, email: 'user@local.test' },
    );

    const response = await handler(
      new Request('http://localhost/api/bank', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { settings: ReturnType<typeof createEmptySettings> };
    expect(body.settings).toMatchObject({ theme: 'light', businessName: '' });
  });

  it('PUT settings then GET bank returns saved theme', async () => {
    mockStandardUserSession();
    const settingsRow = {
      theme: 'dark',
      business_name: 'Loja',
      city: 'SP',
      default_pix_key: '',
      default_institution: '',
      default_installments: 1,
      default_interest_type: 'SIMPLE',
      cdi_annual_percent: 0,
      milestones_cents: [],
      free_balance_cents: 0,
    };
    neonMock.tx.mockImplementation(async (queries: unknown[]) => {
      const count = Array.isArray(queries) ? queries.length : 1;
      if (count === 2) {
        return [[], []];
      }
      return [[], [settingsRow], [], [], [], [], [], [], []];
    });

    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@db:5432/inhouse',
      jwtSecret,
    });
    const token = await signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: standardUserId, email: 'user@local.test' },
    );
    const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const save = await handler(
      new Request('http://localhost/api/bank/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...createEmptySettings(), theme: 'dark', businessName: 'Loja', city: 'SP' }),
      }),
    );
    expect(save.status).toBe(200);

    const load = await handler(
      new Request('http://localhost/api/bank', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(load.status).toBe(200);
    const body = (await load.json()) as { settings: { theme: string; businessName: string } };
    expect(body.settings.theme).toBe('dark');
    expect(body.settings.businessName).toBe('Loja');
  });

  it('demo account still uses in-memory snapshot', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@db:5432/inhouse',
      jwtSecret,
    });
    const token = await signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: DEMO_USER_ID, email: DEMO_EMAIL },
    );
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users where')) {
        return [
          {
            id: DEMO_USER_ID,
            email: DEMO_EMAIL,
            password_hash: 'x',
            account_kind: 'demo',
            must_change_password: false,
          },
        ];
      }
      return [];
    });

    const response = await handler(
      new Request('http://localhost/api/bank', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { installmentPlans: unknown[] };
    expect(body.installmentPlans.length).toBeGreaterThan(0);
    expect(neonMock.tx).not.toHaveBeenCalled();
  });
});