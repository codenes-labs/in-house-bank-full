import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  clampProvisionalHours,
  provisionalValidUntilFromHours,
  resolveHoldingProvisionalAccess,
} from '../domain/holding/holding-provisional-access';
import { generateProvisionalPassword } from '../domain/holding/generate-provisional-password';
import { hashPassword } from './password';

type Sql = NeonQueryFunction<false, false>;

export async function setHoldingProvisionalAccess(
  sql: Sql,
  userId: string,
  options: { newPassword?: string; generate?: boolean; validHours?: number },
): Promise<
  | { ok: true; generatedPassword?: string; provisionalAccess: ReturnType<typeof resolveHoldingProvisionalAccess> }
  | { error: string; status: number }
> {
  const manual = String(options.newPassword ?? '').trim();
  let password: string;
  let generatedPassword: string | undefined;
  if (options.generate === true) {
    password = manual.length >= 6 ? manual : generateProvisionalPassword();
    if (manual.length < 6) {
      generatedPassword = password;
    }
  } else if (manual.length >= 6) {
    password = manual;
  } else {
    return { error: 'Informe a senha provisória (mín. 6 caracteres) ou use gerar automaticamente.', status: 400 };
  }
  const hours = clampProvisionalHours(options.validHours);
  const validUntil = provisionalValidUntilFromHours(hours);
  const hash = await hashPassword(password);
  const rows = await sql`
    update users
    set
      holding_provisional_password_hash = ${hash},
      holding_provisional_reveal = ${password},
      holding_provisional_valid_until = ${validUntil.toISOString()}::timestamptz
    where id = ${userId}::uuid
    returning holding_provisional_reveal, holding_provisional_valid_until
  `;
  const row = rows[0] as
    | { holding_provisional_reveal: string; holding_provisional_valid_until: Date | string }
    | undefined;
  if (!row) {
    return { error: 'Conta não encontrada.', status: 404 };
  }
  const provisionalAccess = resolveHoldingProvisionalAccess(
    row.holding_provisional_reveal,
    row.holding_provisional_valid_until,
  );
  return { ok: true, generatedPassword, provisionalAccess };
}

export async function revokeHoldingProvisionalAccess(
  sql: Sql,
  userId: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  const rows = await sql`
    update users
    set
      holding_provisional_password_hash = null,
      holding_provisional_reveal = null,
      holding_provisional_valid_until = null
    where id = ${userId}::uuid
    returning id
  `;
  if (rows.length === 0) {
    return { error: 'Conta não encontrada.', status: 404 };
  }
  return { ok: true };
}

export async function clearExpiredProvisionalAccess(sql: Sql, userId: string, nowMs: number): Promise<void> {
  await sql`
    update users
    set
      holding_provisional_password_hash = null,
      holding_provisional_reveal = null,
      holding_provisional_valid_until = null
    where
      id = ${userId}::uuid
      and holding_provisional_valid_until is not null
      and holding_provisional_valid_until <= ${new Date(nowMs).toISOString()}::timestamptz
  `;
}