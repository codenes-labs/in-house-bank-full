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

describe('GET /api/holding/companies', () => {
  const jwtSecret = 'a'.repeat(32);
  const otherUserId = '44444444-4444-4444-8444-444444444444';
  const companyId = '55555555-5555-4555-8555-555555555555';

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
      if (text.includes('from users u')) {
        return [
          {
            id: companyId,
            registration_code: '100042',
            email: 'empresa@exemplo.com',
            account_kind: 'standard',
            must_change_password: false,
            totp_enabled: false,
            created_at: '2026-01-01T00:00:00.000Z',
            business_name: 'Empresa Exemplo',
            city: 'São Paulo',
            free_balance_cents: 0,
            installment_plan_count: 0,
            cash_box_count: 0,
            cash_box_movement_count: 0,
            free_balance_deposit_count: 0,
            free_balance_withdrawal_count: 0,
          },
        ];
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
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const response = await handler(new Request('http://localhost/api/holding/companies'));
    expect(response.status).toBe(401);
  });

  it('returns companies for admin', async () => {
    mockSessionUser(ADMIN_EMAIL, ADMIN_USER_ID);
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const token = await bearerToken(ADMIN_USER_ID, ADMIN_EMAIL);
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { companies?: Array<{ email: string }> };
    expect(body.companies?.[0]?.email).toBe('empresa@exemplo.com');
  });

  it('returns 403 for standard company user', async () => {
    mockSessionUser('outro@exemplo.com', otherUserId);
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const token = await bearerToken(otherUserId, 'outro@exemplo.com');
    const response = await handler(
      new Request('http://localhost/api/holding/companies', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/holding/companies/:id/access', () => {
  const jwtSecret = 'a'.repeat(32);
  const companyId = '55555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    neonMock.sql.mockClear();
    neonMock.tagged.mockClear();
  });

  function mockAdminAndCompanyUpdate() {
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('update users')) {
        return [];
      }
      if (text.includes('must_change_password')) {
        return [
          {
            id: ADMIN_USER_ID,
            email: ADMIN_EMAIL,
            account_kind: 'standard',
            must_change_password: false,
          },
        ];
      }
      if (text.includes('account_kind') && text.includes('where id =')) {
        return [{ id: companyId, email: 'empresa@exemplo.com', account_kind: 'standard' }];
      }
      return [];
    });
  }

  async function bearerToken(): Promise<string> {
    return signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: ADMIN_USER_ID, email: ADMIN_EMAIL },
    );
  }

  it('updates mustChangePassword for company', async () => {
    mockAdminAndCompanyUpdate();
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const token = await bearerToken();
    const response = await handler(
      new Request(`http://localhost/api/holding/companies/${companyId}/access`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ mustChangePassword: true }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { mustChangePassword?: boolean };
    expect(body.mustChangePassword).toBe(true);
  });

  it('rejects demo account target', async () => {
    neonMock.tagged.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join('');
      if (text.includes('must_change_password')) {
        return [
          {
            id: ADMIN_USER_ID,
            email: ADMIN_EMAIL,
            account_kind: 'standard',
            must_change_password: false,
          },
        ];
      }
      if (text.includes('account_kind') && text.includes('where id =')) {
        return [{ id: DEMO_USER_ID, email: DEMO_EMAIL, account_kind: 'demo' }];
      }
      return [];
    });
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const token = await bearerToken();
    const response = await handler(
      new Request(`http://localhost/api/holding/companies/${DEMO_USER_ID}/access`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ mustChangePassword: true }),
      }),
    );
    expect(response.status).toBe(400);
  });
});