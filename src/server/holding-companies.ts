import type { NeonQueryFunction } from '@neondatabase/serverless';
import { isHoldingAdminEmail } from '../domain/holding/holding-admin';
import {
  canAdminDeleteHoldingCompany,
  holdingCompanyHasOperationalData,
} from '../domain/holding/holding-company-operational-data';
import {
  canAdminEditHoldingAccess,
  resolveHoldingAccountProfile,
} from '../domain/holding/holding-account-profile';
import { AccountKind } from './account-seed';

type Sql = NeonQueryFunction<false, false>;

export type HoldingCompanyListRow = {
  id: string;
  registrationCode: string | null;
  email: string;
  accountKind: string;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  createdAt: string;
  profile: ReturnType<typeof resolveHoldingAccountProfile>;
  canEditAccess: boolean;
  canDelete: boolean;
  hasOperationalData: boolean;
  businessName: string;
  city: string;
};

type HoldingCompanyQueryRow = {
  id: string;
  registration_code: string | null;
  email: string;
  account_kind: string;
  must_change_password: boolean;
  totp_enabled: boolean;
  created_at: Date | string;
  business_name: string | null;
  city: string | null;
  free_balance_cents: number | string;
  installment_plan_count: number;
  cash_box_count: number;
  cash_box_movement_count: number;
  free_balance_deposit_count: number;
  free_balance_withdrawal_count: number;
};

function mapListRow(row: HoldingCompanyQueryRow): HoldingCompanyListRow {
  const profile = resolveHoldingAccountProfile(row.email, row.account_kind);
  const metrics = {
    installmentPlanCount: Number(row.installment_plan_count ?? 0),
    cashBoxCount: Number(row.cash_box_count ?? 0),
    cashBoxMovementCount: Number(row.cash_box_movement_count ?? 0),
    freeBalanceCents: Number(row.free_balance_cents ?? 0),
    freeBalanceDepositCount: Number(row.free_balance_deposit_count ?? 0),
    freeBalanceWithdrawalCount: Number(row.free_balance_withdrawal_count ?? 0),
  };
  return {
    id: row.id,
    registrationCode: row.registration_code,
    email: row.email,
    accountKind: row.account_kind,
    mustChangePassword: row.must_change_password,
    totpEnabled: row.totp_enabled,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    profile,
    canEditAccess: canAdminEditHoldingAccess(profile),
    canDelete: canAdminDeleteHoldingCompany(profile),
    hasOperationalData: holdingCompanyHasOperationalData(metrics),
    businessName: String(row.business_name ?? '').trim(),
    city: String(row.city ?? '').trim(),
  };
}

export async function listHoldingCompanies(sql: Sql): Promise<HoldingCompanyListRow[]> {
  const rows = await sql`
    select
      u.id,
      u.registration_code,
      u.email,
      u.account_kind,
      u.must_change_password,
      u.totp_enabled,
      u.created_at,
      s.business_name,
      s.city,
      coalesce(s.free_balance_cents, 0) as free_balance_cents,
      (select count(*)::int from installment_plans ip where ip.user_id = u.id) as installment_plan_count,
      (select count(*)::int from cash_boxes cb where cb.user_id = u.id) as cash_box_count,
      (select count(*)::int from cash_box_movements m where m.user_id = u.id) as cash_box_movement_count,
      (select count(*)::int from free_balance_deposits d where d.user_id = u.id) as free_balance_deposit_count,
      (select count(*)::int from free_balance_withdrawals w where w.user_id = u.id) as free_balance_withdrawal_count
    from users u
    left join settings s on s.user_id = u.id
    order by u.registration_code nulls last, u.email asc
  `;
  return (rows as HoldingCompanyQueryRow[]).map(mapListRow);
}

export async function updateHoldingCompanyAccess(
  sql: Sql,
  userId: string,
  mustChangePassword: boolean,
): Promise<{ ok: true; mustChangePassword: boolean } | { error: string; status: number }> {
  const rows = await sql`
    select id, email, account_kind
    from users
    where id = ${userId}
    limit 1
  `;
  const row = rows[0] as { id: string; email: string; account_kind: string } | undefined;
  if (!row) {
    return { error: 'Conta não encontrada.', status: 404 };
  }
  const profile = resolveHoldingAccountProfile(row.email, row.account_kind);
  if (!canAdminEditHoldingAccess(profile)) {
    return { error: 'Só é possível alterar o acesso de contas empresa.', status: 400 };
  }
  if (isHoldingAdminEmail(row.email) || row.account_kind === AccountKind.Demo) {
    return { error: 'Só é possível alterar o acesso de contas empresa.', status: 400 };
  }
  await sql`
    update users
    set must_change_password = ${mustChangePassword}
    where id = ${userId}
  `;
  return { ok: true, mustChangePassword };
}