import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { ADMIN_EMAIL, ADMIN_USER_ID, DEMO_EMAIL, DEMO_USER_ID } from './account-seed';
import { signAccessToken } from './jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';

const neonMock = vi.hoisted(() => {
  const query = vi.fn(async () => []);
  const tx = vi.fn(async (queries: Promise<unknown>[]) => {
    await Promise.all(queries);
  });
  const tagged = vi.fn(async () => []);
  const sql = Object.assign(tagged, { transaction: tx, query });
  return { sql, tx, query, tagged };
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

vi.mock('./password', () => ({
  hashPassword: vi.fn(async () => 'hashed'),
  verifyPassword: vi.fn(async () => false),
}));

describe('POST /api/holding/companies', () => {
  const jwtSecret = 'a'.repeat(32);
  const otherUserId = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    neonMock.sql.mockClear();
    neonMock.tagged.mockClear();
  });

  function mockSessionUser(email: string, userId: string, accountKind: 'standard' | 'demo' = 'standard') {
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('from users where id')) {
        return [
          {
            id: userId,
            email,
            account_kind: accountKind,
            must_change_password: false,
          },
        ];
      }
      if (text.includes('from users where email')) {
        return [];
      }
      return [];
    });
  }

  async function bearerToken(userId: string, email: string): Promise<string> {
    return signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId, email },
    );
  }

  it('returns 401 without JWT', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
    });
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Empresa Exemplo',
          email: 'empresa@exemplo.com',
          password: 'senha123',
          city: 'Curitiba',
        }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it('returns 403 for demo JWT even if email matched admin', async () => {
    mockSessionUser(ADMIN_EMAIL, ADMIN_USER_ID, 'demo');
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
    });
    const token = await bearerToken(ADMIN_USER_ID, ADMIN_EMAIL);
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Empresa Exemplo',
          email: 'empresa@exemplo.com',
          password: 'senha123',
          city: 'Curitiba',
        }),
      }),
    );
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain('demonstração');
  });

  it('returns 403 for demo account (teste)', async () => {
    mockSessionUser(DEMO_EMAIL, DEMO_USER_ID, 'demo');
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
    });
    const token = await bearerToken(DEMO_USER_ID, DEMO_EMAIL);
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Empresa Exemplo',
          email: 'empresa@exemplo.com',
          password: 'senha123',
          city: 'Curitiba',
        }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it('returns 403 for standard company user (JWT real, not admin)', async () => {
    mockSessionUser('outro@exemplo.com', otherUserId);
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
    });
    const token = await bearerToken(otherUserId, 'outro@exemplo.com');
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Empresa Exemplo',
          email: 'empresa@exemplo.com',
          password: 'senha123',
          city: 'Curitiba',
        }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it('creates company for admin without returning access token', async () => {
    mockSessionUser(ADMIN_EMAIL, ADMIN_USER_ID);
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret,
    });
    const token = await bearerToken(ADMIN_USER_ID, ADMIN_EMAIL);
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'Empresa Exemplo',
          email: 'empresa@exemplo.com',
          password: 'senha123',
          city: 'Curitiba',
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok?: boolean;
      user?: { email: string; id: string };
      accessToken?: string;
    };
    expect(body.ok).toBe(true);
    expect(body.user?.email).toBe('empresa@exemplo.com');
    expect(body.user?.id).toBeTruthy();
    expect(body.accessToken).toBeUndefined();
  });
});