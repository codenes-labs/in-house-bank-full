import type { NeonQueryFunction } from '@neondatabase/serverless';
import { canToggleHoldingAccountActive } from '../domain/holding/holding-account-active';
import { resolveHoldingAccountProfile } from '../domain/holding/holding-account-profile';

type Sql = NeonQueryFunction<false, false>;

export async function updateHoldingCompanyActive(
  sql: Sql,
  userId: string,
  active: boolean,
): Promise<{ ok: true; accountActive: boolean } | { error: string; status: number }> {
  const rows = await sql`
    select id, email, account_kind
    from users
    where id = ${userId}::uuid
    limit 1
  `;
  const row = rows[0] as { email: string; account_kind: string } | undefined;
  if (!row) {
    return { error: 'Conta não encontrada.', status: 404 };
  }
  const profile = resolveHoldingAccountProfile(row.email, row.account_kind);
  if (!canToggleHoldingAccountActive(profile)) {
    return { error: 'Não é possível inativar a conta de administração.', status: 400 };
  }
  await sql`
    update users
    set account_active = ${active}
    where id = ${userId}::uuid
  `;
  return { ok: true, accountActive: active };
}