import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createApiHandler } from './create-api-handler';

const neonMock = vi.hoisted(() => {
  const query = vi.fn(async () => []);
  const tx = vi.fn(async (queries: Promise<unknown>[]) => {
    await Promise.all(queries);
  });
  const sql = Object.assign(vi.fn(async () => []), { transaction: tx, query });
  return { sql, tx, query };
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

describe('password recover flag', () => {
  beforeEach(() => {
    neonMock.sql.mockClear();
  });

  it('returns 403 when recover is disabled', async () => {
    const handler = createApiHandler({
      databaseUrl: 'postgresql://u:p@ep.example/neondb',
      jwtSecret: 'a'.repeat(32),
      passwordRecoverEnabled: false,
    });
    const response = await handler(
      new Request('http://localhost/api/auth/recover', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.com', newPassword: 'nova123' }),
      }),
    );
    expect(response.status).toBe(403);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain('desativada');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });
});
