import type { NeonQueryFunction } from '@neondatabase/serverless';
import { HOLDING_ADMIN_EMAIL } from '../domain/holding/holding-admin';
import { hashPassword } from './password';

export const ADMIN_USER_ID = '11111111-1111-4111-8111-111111111111';
export const DEMO_USER_ID = '22222222-2222-4222-8222-222222222222';

export const ADMIN_EMAIL = HOLDING_ADMIN_EMAIL;
export const DEMO_EMAIL = 'teste@teste.com';

/** Senha provisória do admin; trocar em /alterar-senha após o primeiro acesso. */
export const ADMIN_PROVISIONAL_PASSWORD = 'CodenesTemp1';
export const DEMO_PASSWORD = 'teste';

export const AccountKind = {
  Standard: 'standard',
  Demo: 'demo',
} as const;

export type AccountKind = (typeof AccountKind)[keyof typeof AccountKind];

const accountsReady = getAccountsReadyMap();

function getAccountsReadyMap(): Map<string, Promise<void>> {
  const host = globalThis as typeof globalThis & { __ihb_accounts_ready__?: Map<string, Promise<void>> };
  const existing = host.__ihb_accounts_ready__;
  if (existing) {
    return existing;
  }
  const created = new Map<string, Promise<void>>();
  host.__ihb_accounts_ready__ = created;
  return created;
}

export function normalizeLoginEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === 'teste') {
    return DEMO_EMAIL;
  }
  return trimmed;
}

export function ensureSeededAccounts(databaseUrl: string, sql: NeonQueryFunction<false, false>): Promise<void> {
  if (!accountsReady.has(databaseUrl)) {
    accountsReady.set(databaseUrl, seedAccounts(sql));
  }
  return accountsReady.get(databaseUrl)!;
}

async function seedAccounts(sql: NeonQueryFunction<false, false>): Promise<void> {
  const adminHash = await hashPassword(ADMIN_PROVISIONAL_PASSWORD);
  const demoHash = await hashPassword(DEMO_PASSWORD);

  await sql`
    insert into users (id, email, password_hash, account_kind, must_change_password)
    values (
      ${ADMIN_USER_ID}::uuid,
      ${ADMIN_EMAIL},
      ${adminHash},
      ${AccountKind.Standard},
      true
    )
    on conflict (email) do nothing
  `;

  await sql`
    insert into users (id, email, password_hash, account_kind, must_change_password)
    values (
      ${DEMO_USER_ID}::uuid,
      ${DEMO_EMAIL},
      ${demoHash},
      ${AccountKind.Demo},
      false
    )
    on conflict (email) do nothing
  `;
}

