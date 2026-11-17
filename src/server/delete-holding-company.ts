import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  canAdminDeleteHoldingCompany,
  holdingCompanyHasOperationalData,
  type HoldingCompanyDataMetrics,
} from '../domain/holding/holding-company-operational-data';
import { resolveHoldingAccountProfile } from '../domain/holding/holding-account-profile';

type Sql = NeonQueryFunction<false, false>;

export async function loadHoldingCompanyDataMetrics(
  sql: Sql,
  userId: string,
): Promise<HoldingCompanyDataMetrics | null> {
  const rows = await sql`
    select
      u.id,
      u.email,
      u.account_kind,
      coalesce(s.free_balance_cents, 0) as free_balance_cents,
      (select count(*)::int from installment_plans where user_id = u.id) as installment_plan_count,
      (select count(*)::int from cash_boxes where user_id = u.id) as cash_box_count,
      (select count(*)::int from cash_box_movements where user_id = u.id) as cash_box_movement_count,
      (select count(*)::int from free_balance_deposits where user_id = u.id) as free_balance_deposit_count,
      (select count(*)::int from free_balance_withdrawals where user_id = u.id) as free_balance_withdrawal_count
    from users u
    left join settings s on s.user_id = u.id
    where u.id = ${userId}::uuid
    limit 1
  `;
  const row = rows[0] as
    | {
        id: string;
        email: string;
        account_kind: string;
        free_balance_cents: number | string;
        installment_plan_count: number;
        cash_box_count: number;
        cash_box_movement_count: number;
        free_balance_deposit_count: number;
        free_balance_withdrawal_count: number;
      }
    | undefined;
  if (!row) {
    return null;
  }
  return {
    installmentPlanCount: Number(row.installment_plan_count ?? 0),
    cashBoxCount: Number(row.cash_box_count ?? 0),
    cashBoxMovementCount: Number(row.cash_box_movement_count ?? 0),
    freeBalanceCents: Number(row.free_balance_cents ?? 0),
    freeBalanceDepositCount: Number(row.free_balance_deposit_count ?? 0),
    freeBalanceWithdrawalCount: Number(row.free_balance_withdrawal_count ?? 0),
  };
}

export async function deleteHoldingCompany(
  sql: Sql,
  userId: string,
  acknowledgeDataLoss: boolean,
): Promise<{ ok: true } | { error: string; status: number; requiresDataAcknowledgement?: boolean }> {
  const rows = await sql`
    select id, email, account_kind
    from users
    where id = ${userId}::uuid
    limit 1
  `;
  const row = rows[0] as { id: string; email: string; account_kind: string } | undefined;
  if (!row) {
    return { error: 'Conta não encontrada.', status: 404 };
  }
  const profile = resolveHoldingAccountProfile(row.email, row.account_kind);
  if (!canAdminDeleteHoldingCompany(profile)) {
    return { error: 'Não é possível excluir as contas admin ou demonstração.', status: 400 };
  }

  const metrics = await loadHoldingCompanyDataMetrics(sql, userId);
  if (!metrics) {
    return { error: 'Conta não encontrada.', status: 404 };
  }

  const hasData = holdingCompanyHasOperationalData(metrics);
  if (hasData && !acknowledgeDataLoss) {
    return {
      error:
        'Esta conta contém dados (parcelamentos, caixinhas ou saldo). Faça backup em Ajustes → Backup na conta da empresa antes de excluir. A exclusão é permanente.',
      status: 400,
      requiresDataAcknowledgement: true,
    };
  }

  await sql`delete from users where id = ${userId}::uuid`;
  return { ok: true };
}