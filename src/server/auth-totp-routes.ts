import type { NeonQueryFunction } from '@neondatabase/serverless';
import { buildTotpAuthUri, createTotpSecret, verifyTotpCode } from '../domain/auth/totp';
import { AccountKind } from './account-seed';
import { verifyPassword } from './password';

type Sql = NeonQueryFunction<false, false>;

type UserTotpRow = {
  id: string;
  email: string;
  password_hash: string;
  account_kind: string;
  totp_secret: string | null;
  totp_enabled: boolean;
};

export async function totpBegin(
  sql: Sql,
  userId: string,
  options?: { password?: string; code?: string },
): Promise<{ secret: string; otpauthUrl: string } | { error: string }> {
  const rows = await sql`
    select id, email, password_hash, account_kind, totp_secret, totp_enabled
    from users where id = ${userId}::uuid
  `;
  const row = rows[0] as UserTotpRow | undefined;
  if (!row) {
    return { error: 'Conta não encontrada.' };
  }
  if (row.account_kind === AccountKind.Demo) {
    return { error: 'A conta de demonstração não usa 2FA.' };
  }
  if (row.totp_enabled) {
    const password = String(options?.password ?? '');
    const code = String(options?.code ?? '');
    if (!password || !code) {
      return {
        error:
          'Com o 2FA ativo, informe a senha atual e um código do autenticador para gerar um novo segredo (ou desative o 2FA antes).',
      };
    }
    if (!(await verifyPassword(password, row.password_hash))) {
      return { error: 'Senha atual incorreta.' };
    }
    if (!row.totp_secret || !verifyTotpCode(row.totp_secret, code)) {
      return { error: 'Código 2FA inválido.' };
    }
  }
  const secret = createTotpSecret();
  await sql`
    update users
    set totp_secret = ${secret}, totp_enabled = false
    where id = ${userId}::uuid
  `;
  return { secret, otpauthUrl: buildTotpAuthUri(secret, row.email) };
}

export async function totpEnable(sql: Sql, userId: string, code: string): Promise<{ ok: true } | { error: string }> {
  const rows = await sql`
    select id, email, account_kind, totp_secret, totp_enabled
    from users where id = ${userId}::uuid
  `;
  const row = rows[0] as UserTotpRow | undefined;
  if (!row?.totp_secret) {
    return { error: 'Gere um novo segredo em Configurações → Usuário antes de ativar.' };
  }
  if (!verifyTotpCode(row.totp_secret, code)) {
    return { error: 'Código inválido. Confira o relógio do celular e tente de novo.' };
  }
  await sql`update users set totp_enabled = true where id = ${userId}::uuid`;
  return { ok: true };
}

export async function totpDisable(
  sql: Sql,
  userId: string,
  password: string,
  code: string,
): Promise<{ ok: true } | { error: string }> {
  const rows = await sql`
    select id, account_kind, password_hash, totp_secret, totp_enabled
    from users where id = ${userId}::uuid
  `;
  const row = rows[0] as UserTotpRow | undefined;
  if (!row?.totp_enabled || !row.totp_secret) {
    return { error: 'A verificação em duas etapas já está desativada.' };
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    return { error: 'Senha atual incorreta.' };
  }
  if (!verifyTotpCode(row.totp_secret, code)) {
    return { error: 'Código 2FA inválido.' };
  }
  await sql`
    update users
    set totp_secret = null, totp_enabled = false
    where id = ${userId}::uuid
  `;
  return { ok: true };
}

export async function loadUserTotpRow(sql: Sql, email: string): Promise<UserTotpRow | undefined> {
  const rows = await sql`
    select id, email, password_hash, account_kind, totp_secret, totp_enabled, must_change_password
    from users where email = ${email}
  `;
  return rows[0] as UserTotpRow | undefined;
}
