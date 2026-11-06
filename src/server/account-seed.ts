import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createDemoAppBackup } from './demo-backup';
import { hashPassword } from './password';
import { replaceUserBackup } from './user-backup';

export const ADMIN_USER_ID = '11111111-1111-4111-8111-111111111111';
export const DEMO_USER_ID = '22222222-2222-4222-8222-222222222222';

export const ADMIN_EMAIL = 'admin@codenes.com.br';
export const DEMO_EMAIL = 'teste@teste.com';

/** Senha provisória do admin; trocar em /alterar-senha após o primeiro acesso. */
export const ADMIN_PROVISIONAL_PASSWORD = 'CodenesTemp1';
export const DEMO_PASSWORD = 'teste';

export const AccountKind = {
  Standard: 'standard',
  Demo: 'demo',
} as const;

export type AccountKind = (typeof AccountKind)[keyof typeof AccountKind];

const accountsReady = new Map<string, Promise<void>>();

export function normalizeLoginEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === 'teste') {
    return DEMO_EMAIL;
  }
  return trimmed;
}

export function ensureSeededAccounts(databaseUrl: string, sql: NeonQueryFunction<false, false>): Promise<void> {
  const existing = accountsReady.get(databaseUrl);
  if (existing) {
    return existing;
  }
  const pending = seedAccounts(sql);
  accountsReady.set(databaseUrl, pending);
  return pending;
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

export async function restoreDemoSnapshot(sql: NeonQueryFunction<false, false>, userId: string): Promise<void> {
  const backup = createDemoAppBackup();
  await replaceUserBackup(sql, userId, backup);
}
