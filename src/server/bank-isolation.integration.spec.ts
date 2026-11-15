import { describe, expect, it, beforeAll } from 'vitest';
import { createViteDevApiHandler } from './vite-api-handler';
import { ADMIN_EMAIL, ADMIN_PROVISIONAL_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from './account-seed';
const databaseUrl = process.env.DATABASE_URL?.trim();
const jwtSecret = process.env.JWT_SECRET?.trim();
const runBankIsolation =
  process.env.RUN_BANK_ISOLATION === '1' &&
  Boolean(databaseUrl && jwtSecret && jwtSecret.length >= 32);

describe.skipIf(!runBankIsolation)('bank isolation (integration DB)', () => {
  const handler = createViteDevApiHandler({
    databaseUrl,
    jwtSecret,
    passwordRecoverEnabled: false,
    signUpEnabled: false,
  });

  let adminToken = '';
  let demoToken = '';

  beforeAll(async () => {
    await handler(new Request('http://localhost/api/health'));
    adminToken = await signInAdmin();
    demoToken = await signInToken(DEMO_EMAIL, DEMO_PASSWORD);
  }, 120_000);

  it('admin and demo receive different bank payloads', async () => {
    const adminBank = await fetchBank(adminToken);
    const demoBank = await fetchBank(demoToken);
    expect(adminBank).not.toEqual(demoBank);
  }, 30_000);

  it('demo cannot persist a plan via API', async () => {
    const response = await handler(
      new Request('http://localhost/api/bank/plans', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${demoToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: '00000000-0000-4000-8000-000000000001',
          payerName: 'Teste',
          returnAmountCents: 100,
          installmentsCount: 1,
          firstDueDate: '2026-01-01',
          notes: '',
        }),
      }),
    );
    expect(response.status).toBe(403);
  }, 15_000);

  const ADMIN_TEST_PASSWORD = 'AdminDefinitiva1';

  async function signInAdmin(): Promise<string> {
    for (const password of [ADMIN_PROVISIONAL_PASSWORD, ADMIN_TEST_PASSWORD]) {
      const response = await handler(
        new Request('http://localhost/api/auth/sign-in', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: ADMIN_EMAIL, password }),
        }),
      );
      if (!response.ok) {
        continue;
      }
      const body = (await response.json()) as { accessToken?: string };
      if (!body.accessToken) {
        continue;
      }
      return clearMandatoryPasswordChange(body.accessToken);
    }
    throw new Error(`sign-in ${ADMIN_EMAIL}: nenhuma senha de teste funcionou`);
  }

  async function clearMandatoryPasswordChange(token: string): Promise<string> {
    const sessionRes = await handler(
      new Request('http://localhost/api/auth/session', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    const session = (await sessionRes.json()) as { user?: { mustChangePassword?: boolean } };
    if (!session.user?.mustChangePassword) {
      return token;
    }
    const response = await handler(
      new Request('http://localhost/api/auth/password', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ newPassword: ADMIN_TEST_PASSWORD }),
      }),
    );
    if (!response.ok) {
      const err = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(`password change: ${response.status} ${err?.error ?? ''}`.trim());
    }
    const body = (await response.json()) as { accessToken?: string };
    if (!body.accessToken) {
      throw new Error('password change: missing accessToken');
    }
    return body.accessToken;
  }

  async function signInToken(email: string, password: string): Promise<string> {
    const response = await handler(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }),
    );
    if (!response.ok) {
      const err = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(`sign-in ${email}: ${response.status} ${err?.error ?? ''}`.trim());
    }
    expect(response.ok).toBe(true);
    const body = (await response.json()) as { accessToken?: string };
    if (!body.accessToken) {
      throw new Error(`sign-in failed for ${email}`);
    }
    return body.accessToken;
  }

  async function fetchBank(token: string): Promise<unknown> {
    const response = await handler(
      new Request('http://localhost/api/bank', {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(response.ok).toBe(true);
    return response.json();
  }
});
