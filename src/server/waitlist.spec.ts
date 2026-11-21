import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { ADMIN_EMAIL } from './account-seed';

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

vi.mock('./jwt', () => ({
  signAccessToken: vi.fn(() => 'token'),
  verifyAccessToken: vi.fn(() => ({
    sub: 'admin-id',
    email: ADMIN_EMAIL,
    mustChangePassword: false,
    isDemo: false,
  })),
}));

describe('waitlist API', () => {
  beforeEach(() => {
    neonMock.sql.mockClear();
    neonMock.tagged.mockClear();
    neonMock.tagged.mockResolvedValue([]);
  });

  it('rejects signup without consent', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
    });
    const response = await handler(
      new Request('http://localhost/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Ana',
          email: 'ana@exemplo.com',
          interest: 'organizar-renda',
          consentGiven: false,
        }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('accepts valid signup', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
    });
    neonMock.tagged
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const response = await handler(
      new Request('http://localhost/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Ana Costa',
          email: 'ana@exemplo.com',
          interest: 'parcelamentos',
          consentGiven: true,
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  it('forbids listing for unauthenticated clients', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
    });
    const response = await handler(new Request('http://localhost/api/waitlist', { method: 'GET' }));
    expect(response.status).toBe(401);
  });
});