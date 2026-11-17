import type { NeonQueryFunction } from '@neondatabase/serverless';
import { canAdminDeleteHoldingCompany } from '../domain/holding/holding-company-operational-data';
import { holdingCompanyHasOperationalData } from '../domain/holding/holding-company-operational-data';
import {
  HoldingAccountProfile,
  resolveHoldingAccountProfile,
  canAdminEditHoldingAccess,
} from '../domain/holding/holding-account-profile';
import { isHoldingAdminEmail } from '../domain/holding/holding-admin';
import { AccountKind } from './account-seed';
import { loadHoldingCompanyDataMetrics } from './delete-holding-company';
import { hashPassword } from './password';

type Sql = NeonQueryFunction<false, false>;

export type HoldingCompanyDetail = {
  id: string;
  registrationCode: string | null;
  email: string;
  accountKind: string;
  profile: ReturnType<typeof resolveHoldingAccountProfile>;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  holdingDelegate: boolean;
  createdAt: string;
  businessName: string;
  city: string;
  document: string | null;
  canEditAccess: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  hasOperationalData: boolean;
  dataMetrics: NonNullable<Awaited<ReturnType<typeof loadHoldingCompanyDataMetrics>>>;
};

export async function getHoldingCompanyDetail(
  sql: Sql,
  userId: string,
): Promise<HoldingCompanyDetail | null> {
  const rows = await sql`
    select
      u.id,
      u.registration_code,
      u.email,
      u.account_kind,
      u.must_change_password,
      u.totp_enabled,
      u.holding_delegate,
      u.created_at,
      s.business_name,
      s.city,
      s.document
    from users u
    left join settings s on s.user_id = u.id
    where u.id = ${userId}::uuid
    limit 1
  `;
  const row = rows[0] as
    | {
        id: string;
        registration_code: string | null;
        email: string;
        account_kind: string;
        must_change_password: boolean;
        totp_enabled: boolean;
        holding_delegate: boolean;
        created_at: Date | string;
        business_name: string | null;
        city: string | null;
        document: string | null;
      }
    | undefined;
  if (!row) {
    return null;
  }
  const metrics = await loadHoldingCompanyDataMetrics(sql, userId);
  if (!metrics) {
    return null;
  }
  const profile = resolveHoldingAccountProfile(row.email, row.account_kind);
  const canManage = !isHoldingAdminEmail(row.email) && profile === HoldingAccountProfile.Company;
  return {
    id: row.id,
    registrationCode: row.registration_code,
    email: row.email,
    accountKind: row.account_kind,
    profile,
    mustChangePassword: row.must_change_password,
    totpEnabled: Boolean(row.totp_enabled),
    holdingDelegate: Boolean(row.holding_delegate),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    businessName: String(row.business_name ?? '').trim(),
    city: String(row.city ?? '').trim(),
    document: row.document?.trim() || null,
    canEditAccess: canAdminEditHoldingAccess(profile),
    canDelete: canAdminDeleteHoldingCompany(profile),
    canManagePermissions: canManage,
    hasOperationalData: holdingCompanyHasOperationalData(metrics),
    dataMetrics: metrics,
  };
}

export async function setHoldingCompanyPassword(
  sql: Sql,
  userId: string,
  newPassword: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  if (newPassword.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.', status: 400 };
  }
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
  if (isHoldingAdminEmail(row.email) || row.account_kind === AccountKind.Demo) {
    return { error: 'Não é possível alterar a senha desta conta por aqui.', status: 400 };
  }
  await sql`
    update users
    set password_hash = ${await hashPassword(newPassword)}, must_change_password = false
    where id = ${userId}::uuid
  `;
  return { ok: true };
}

export async function updateHoldingDelegate(
  sql: Sql,
  userId: string,
  enabled: boolean,
): Promise<{ ok: true; holdingDelegate: boolean } | { error: string; status: number }> {
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
  if (!canAdminEditHoldingAccess(profile)) {
    return { error: 'Só é possível alterar o acesso Holding de contas empresa.', status: 400 };
  }
  await sql`
    update users
    set holding_delegate = ${enabled}
    where id = ${userId}::uuid
  `;
  return { ok: true, holdingDelegate: enabled };
}