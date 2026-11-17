import type { NeonQueryFunction } from '@neondatabase/serverless';
import { canAdminDeleteHoldingCompany } from '../domain/holding/holding-company-operational-data';
import { holdingCompanyHasOperationalData } from '../domain/holding/holding-company-operational-data';
import {
  resolveHoldingAccountProfile,
  canAdminEditHoldingAccess,
  canAdminEditHoldingLoginEmail,
} from '../domain/holding/holding-account-profile';
import {
  type CompanyMenuAccess,
  holdingDelegateFromMenuAccess,
  menuAccessForAccount,
  normalizeCompanyMenuAccess,
} from '../domain/holding/company-menu-access';
import {
  canAdminEditHoldingMenuAccess,
  canAdminEditHoldingMustChangePassword,
} from '../domain/holding/holding-account-profile';
import { canToggleHoldingAccountActive } from '../domain/holding/holding-account-active';
import { normalizeLoginEmail, ADMIN_EMAIL, DEMO_EMAIL } from './account-seed';
import { effectiveHoldingRegistrationCode } from '../domain/holding/holding-company-list-order';
import { generateProvisionalPassword } from '../domain/holding/generate-provisional-password';
import { loadHoldingCompanyDataMetrics } from './delete-holding-company';
import {
  type HoldingProvisionalAccessView,
  resolveHoldingProvisionalAccess,
} from '../domain/holding/holding-provisional-access';
import { hashPassword } from './password';

type Sql = NeonQueryFunction<false, false>;

export type HoldingCompanyDetail = {
  id: string;
  registrationCode: string | null;
  email: string;
  accountKind: string;
  profile: ReturnType<typeof resolveHoldingAccountProfile>;
  accountActive: boolean;
  canToggleAccountActive: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  holdingDelegate: boolean;
  menuAccess: CompanyMenuAccess;
  createdAt: string;
  businessName: string;
  city: string;
  document: string | null;
  canEditAccess: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  canEditMenuAccess: boolean;
  hasOperationalData: boolean;
  dataMetrics: NonNullable<Awaited<ReturnType<typeof loadHoldingCompanyDataMetrics>>>;
  /** Acesso provisório para suporte (senha principal não é exibida). */
  provisionalAccess: HoldingProvisionalAccessView;
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
      u.account_active,
      u.totp_enabled,
      u.holding_delegate,
      u.menu_access,
      u.created_at,
      u.holding_provisional_reveal,
      u.holding_provisional_valid_until,
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
        account_active: boolean;
        totp_enabled: boolean;
        holding_delegate: boolean;
        menu_access: unknown;
        created_at: Date | string;
        holding_provisional_reveal: string | null;
        holding_provisional_valid_until: Date | string | null;
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
  const canManage = canAdminEditHoldingAccess(profile);
  const provisionalAccess = resolveHoldingProvisionalAccess(
    row.holding_provisional_reveal,
    row.holding_provisional_valid_until,
  );
  return {
    id: row.id,
    registrationCode: effectiveHoldingRegistrationCode(profile, row.registration_code),
    email: row.email,
    accountKind: row.account_kind,
    profile,
    accountActive: row.account_active !== false,
    canToggleAccountActive: canToggleHoldingAccountActive(profile),
    mustChangePassword: row.must_change_password,
    totpEnabled: Boolean(row.totp_enabled),
    holdingDelegate: Boolean(row.holding_delegate),
    menuAccess: menuAccessForAccount(row.email, row.account_kind, row.menu_access),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    businessName: String(row.business_name ?? '').trim(),
    city: String(row.city ?? '').trim(),
    document: row.document?.trim() || null,
    canEditAccess: canAdminEditHoldingAccess(profile),
    canDelete: canAdminDeleteHoldingCompany(profile),
    canManagePermissions: canManage,
    canEditMenuAccess: canAdminEditHoldingMenuAccess(profile),
    hasOperationalData: holdingCompanyHasOperationalData(metrics),
    dataMetrics: metrics,
    provisionalAccess,
  };
}

export async function setHoldingCompanyPassword(
  sql: Sql,
  userId: string,
  options: { newPassword?: string; generate?: boolean },
): Promise<{ ok: true; generatedPassword?: string } | { error: string; status: number }> {
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
    return { error: 'Informe a nova senha (mín. 6 caracteres) ou use gerar automaticamente.', status: 400 };
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
  await sql`
    update users
    set
      password_hash = ${await hashPassword(password)},
      must_change_password = false,
      holding_reveal_password = null,
      holding_provisional_password_hash = null,
      holding_provisional_reveal = null,
      holding_provisional_valid_until = null
    where id = ${userId}::uuid
  `;
  return { ok: true, generatedPassword };
}

export async function updateHoldingCompanyProfile(
  sql: Sql,
  userId: string,
  profile: { businessName: string; city: string; document: string | null; email?: string },
): Promise<{ ok: true } | { error: string; status: number }> {
  if (profile.businessName.trim().length < 2) {
    return { error: 'Informe o nome da empresa (mínimo 2 caracteres).', status: 400 };
  }
  const rows = await sql`
    select u.id, u.email, u.account_kind
    from users u
    where u.id = ${userId}::uuid
    limit 1
  `;
  const row = rows[0] as { email: string; account_kind: string } | undefined;
  if (!row) {
    return { error: 'Conta não encontrada.', status: 404 };
  }
  const accountProfile = resolveHoldingAccountProfile(row.email, row.account_kind);
  if (!canAdminEditHoldingAccess(accountProfile)) {
    return { error: 'Não é possível editar este cadastro.', status: 400 };
  }
  let nextEmail: string | undefined;
  if (profile.email !== undefined && canAdminEditHoldingLoginEmail(accountProfile)) {
    const email = normalizeLoginEmail(profile.email);
    if (!email.includes('@')) {
      return { error: 'Informe um e-mail válido.', status: 400 };
    }
    if (email === ADMIN_EMAIL || email === DEMO_EMAIL) {
      return { error: 'Este e-mail não pode ser usado.', status: 400 };
    }
    const taken = await sql`
      select id from users where email = ${email} and id <> ${userId}::uuid limit 1
    `;
    if (taken.length > 0) {
      return { error: 'Este e-mail já está em uso.', status: 400 };
    }
    nextEmail = email;
  }
  if (nextEmail) {
    await sql`update users set email = ${nextEmail} where id = ${userId}::uuid`;
  }
  await sql`
    insert into settings (user_id, business_name, city, document)
    values (
      ${userId}::uuid,
      ${profile.businessName.trim()},
      ${profile.city.trim()},
      ${profile.document?.trim() || null}
    )
    on conflict (user_id) do update set
      business_name = excluded.business_name,
      city = excluded.city,
      document = excluded.document,
      updated_at = now()
  `;
  return { ok: true };
}

export async function updateHoldingCompanyMenuAccess(
  sql: Sql,
  userId: string,
  access: CompanyMenuAccess,
): Promise<{ ok: true; menuAccess: CompanyMenuAccess; holdingDelegate: boolean } | { error: string; status: number }> {
  const normalized = normalizeCompanyMenuAccess(access);
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
  if (!canAdminEditHoldingMenuAccess(profile)) {
    return {
      error: 'As permissões de menu das contas administração e demonstração são fixas (todas as telas).',
      status: 400,
    };
  }
  const holdingDelegate = holdingDelegateFromMenuAccess(normalized);
  await sql`
    update users
    set
      menu_access = ${JSON.stringify(normalized)}::jsonb,
      holding_delegate = ${holdingDelegate}
    where id = ${userId}::uuid
  `;
  return { ok: true, menuAccess: normalized, holdingDelegate };
}

export async function updateHoldingCompanyMustChangePassword(
  sql: Sql,
  userId: string,
  mustChangePassword: boolean,
): Promise<{ ok: true; mustChangePassword: boolean } | { error: string; status: number }> {
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
  if (!canAdminEditHoldingMustChangePassword(profile)) {
    return {
      error: 'Só contas empresa podem exigir troca de senha no próximo login por aqui.',
      status: 400,
    };
  }
  await sql`
    update users
    set must_change_password = ${mustChangePassword}
    where id = ${userId}::uuid
  `;
  return { ok: true, mustChangePassword };
}