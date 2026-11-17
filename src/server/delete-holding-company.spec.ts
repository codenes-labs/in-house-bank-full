import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { ADMIN_EMAIL, ADMIN_USER_ID, DEMO_EMAIL, DEMO_USER_ID } from './account-seed';
import { signAccessToken } from './jwt';
import { ACCESS_TOKEN_TTL_SECONDS } from '../domain/auth/access-token-policy';

const neonMock = vi.hoisted(() => {
  const tagged = vi.fn(async () => []);
  const sql = Object.assign(tagged, { transaction: vi.fn(), query: vi.fn() });
  return { sql, tagged };
});

vi.mock('@neondatabase/serverless', () => ({
  neon: () => neonMock.sql,
}));

vi.mock('./account-seed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./account-seed')>();
  return { ...actual, ensureSeededAccounts: vi.fn(async () => undefined) };
});

describe('DELETE /api/holding/companies/:id', () => {
  const jwtSecret = 'a'.repeat(32);
  const companyId = '55555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    neonMock.tagged.mockClear();
  });

  async function adminToken(): Promise<string> {
    return signAccessToken(
      { secret: jwtSecret, expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS },
      { userId: ADMIN_USER_ID, email: ADMIN_EMAIL },
    );
  }

  it('rejects delete for demo target', async () => {
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
      if (text.includes('from users') && text.includes('limit 1')) {
        return [{ id: DEMO_USER_ID, email: DEMO_EMAIL, account_kind: 'demo' }];
      }
      return [];
    });
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const response = await handler(
      new Request(`http://localhost/api/holding/companies/${DEMO_USER_ID}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${await adminToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain('demonstração');
  });

  it('requires acknowledgement when company has data', async () => {
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
      if (text.includes('installment_plan_count') || text.includes('free_balance_cents')) {
        return [
          {
            id: companyId,
            email: 'emp@ex.com',
            account_kind: 'standard',
            free_balance_cents: 0,
            installment_plan_count: 1,
            cash_box_count: 0,
            cash_box_movement_count: 0,
            free_balance_deposit_count: 0,
            free_balance_withdrawal_count: 0,
          },
        ];
      }
      if (text.includes('from users') && text.includes('limit 1')) {
        return [{ id: companyId, email: 'emp@ex.com', account_kind: 'standard' }];
      }
      return [];
    });
    const handler = createApiHandler({ databaseUrl: 'postgresql://u:p@ep.example/neondb', jwtSecret });
    const response = await handler(
      new Request(`http://localhost/api/holding/companies/${companyId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${await adminToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify({ acknowledgeDataLoss: false }),
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { requiresDataAcknowledgement?: boolean };
    expect(body.requiresDataAcknowledgement).toBe(true);
  });
});