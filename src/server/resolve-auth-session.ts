import type { NeonQueryFunction } from '@neondatabase/serverless';
import { verifyAccessToken } from './jwt';
import { AccountKind } from './account-seed';
import { menuAccessForAccount, type CompanyMenuAccess } from '../domain/holding/company-menu-access';

type Sql = NeonQueryFunction<false, false>;

export type SessionUser = {
  id: string;
  email: string;
  mustChangePassword: boolean;
  isDemo: boolean;
  holdingDelegate: boolean;
  menuAccess: CompanyMenuAccess;
};

type UserRow = {
  id: string;
  email: string;
  account_kind: string;
  must_change_password: boolean;
  holding_delegate?: boolean;
  menu_access?: unknown;
  account_active?: boolean;
};

export type ResolvedAuthSession = {
  user: SessionUser | null;
  accountInactive: boolean;
};

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: String(row.id),
    email: row.email,
    mustChangePassword: row.must_change_password,
    isDemo: row.account_kind === AccountKind.Demo,
    holdingDelegate: Boolean(row.holding_delegate),
    menuAccess: menuAccessForAccount(row.email, row.account_kind, row.menu_access),
  };
}

export async function resolveAuthSession(
  sql: Sql,
  jwtSecret: string,
  token: string | null,
): Promise<ResolvedAuthSession> {
  if (!token) {
    return { user: null, accountInactive: false };
  }
  try {
    const claims = await verifyAccessToken(jwtSecret, token);
    const rows = await sql`
      select id, email, account_kind, must_change_password, holding_delegate, menu_access, account_active
      from users where id = ${claims.userId}::uuid
    `;
    const row = rows[0] as UserRow | undefined;
    if (!row) {
      return { user: null, accountInactive: false };
    }
    if (row.account_active === false) {
      return { user: null, accountInactive: true };
    }
    return { user: toSessionUser(row), accountInactive: false };
  } catch {
    return { user: null, accountInactive: false };
  }
}