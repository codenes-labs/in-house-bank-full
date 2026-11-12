import { describe, expect, it, beforeAll } from 'vitest';
import { createApiHandler } from './create-api-handler';
import { ADMIN_EMAIL, ADMIN_PROVISIONAL_PASSWORD, DEMO_EMAIL, DEMO_PASSWORD } from './account-seed';

const databaseUrl = process.env.DATABASE_URL?.trim();
const jwtSecret = process.env.JWT_SECRET?.trim();

describe.skipIf(!databaseUrl || !jwtSecret || jwtSecret.length < 32)('bank isolation (live Neon)', () => {
  const handler = createApiHandler({
    databaseUrl,
    jwtSecret,
    passwordRecoverEnabled: false,
  });

  let adminToken = '';
  let demoToken = '';

  beforeAll(async () => {
    adminToken = await signInToken(ADMIN_EMAIL, ADMIN_PROVISIONAL_PASSWORD);
    demoToken = await signInToken(DEMO_EMAIL, DEMO_PASSWORD);
  }, 60_000);

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

  async function signInToken(email: string, password: string): Promise<string> {
    const response = await handler(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }),
    );
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
