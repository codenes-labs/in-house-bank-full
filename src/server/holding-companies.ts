import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  canAdminDeleteHoldingCompany,
  holdingCompanyHasOperationalData,
} from '../domain/holding/holding-company-operational-data';
import {
  canAdminEditHoldingAccess,
  canAdminEditHoldingMustChangePassword,
  resolveHoldingAccountProfile,
} from '../domain/holding/holding-account-profile';
import {
  effectiveHoldingRegistrationCode,
  holdingCompanyListSortKey,
} from '../domain/holding/holding-company-list-order';
type Sql = NeonQueryFunction<false, false>;

export type HoldingCompanyListRow = {
  id: string;
  registrationCode: string | null;
  email: string;
  accountKind: string;
  accountActive: boolean;
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
  account_active: boolean;
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
    registrationCode: effectiveHoldingRegistrationCode(profile, row.registration_code),
    email: row.email,
    accountKind: row.account_kind,
    accountActive: row.account_active !== false,
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
      u.account_active,
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
    order by u.created_at asc
  `;
  const mapped = (rows as HoldingCompanyQueryRow[]).map(mapListRow);
  mapped.sort((left, right) => {
    const byCode =
      holdingCompanyListSortKey(left.profile, left.registrationCode) -
      holdingCompanyListSortKey(right.profile, right.registrationCode);
    if (byCode !== 0) {
      return byCode;
    }
    return left.email.localeCompare(right.email, 'pt-BR');
  });
  return mapped;
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
  if (!canAdminEditHoldingMustChangePassword(profile)) {
    return {
      error: 'Só contas empresa podem exigir troca de senha no próximo login.',
      status: 400,
    };
  }
  await sql`
    update users
    set must_change_password = ${mustChangePassword}
    where id = ${userId}
  `;
  return { ok: true, mustChangePassword };
}