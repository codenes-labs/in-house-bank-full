import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { ADMIN_EMAIL, DEMO_EMAIL } from './account-seed';

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

describe('sign-up flag', () => {
  beforeEach(() => {
    neonMock.sql.mockClear();
    neonMock.tagged.mockClear();
    neonMock.query.mockClear();
  });

  it('returns 403 when sign-up is disabled', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
      signUpEnabled: false,
    });
    const response = await handler(
      new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'novo@exemplo.com', password: 'senha123' }),
      }),
    );
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain('Cadastro');
  });

  it('creates account when sign-up is enabled', async () => {
    neonMock.tagged.mockImplementation(async () => []);
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
      signUpEnabled: true,
    });
    const response = await handler(
      new Request('http://localhost/api/auth/sign-up', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'novo@exemplo.com', password: 'senha123' }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { accessToken?: string; user?: { email: string } };
    expect(body.accessToken).toBeTruthy();
    expect(body.user?.email).toBe('novo@exemplo.com');
  });

  it('rejects reserved seed emails', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
      signUpEnabled: true,
    });
    for (const email of [ADMIN_EMAIL, DEMO_EMAIL, 'teste']) {
      const response = await handler(
        new Request('http://localhost/api/auth/sign-up', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password: 'senha123' }),
        }),
      );
      expect(response.status).toBe(400);
    }
  });
});