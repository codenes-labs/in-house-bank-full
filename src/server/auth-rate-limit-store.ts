import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  clearLoginLockoutState,
  createEmptyLoginLockoutState,
  type LoginLockoutState,
} from '../domain/auth/login-lockout';

type Sql = NeonQueryFunction<false, false>;

type RateRow = {
  failure_count: number;
  lockout_level: number;
  locked_until: string | Date | null;
};

function rowToState(row: RateRow | undefined): LoginLockoutState {
  if (!row) {
    return createEmptyLoginLockoutState();
  }
  const lockedUntilMs =
    row.locked_until === null || row.locked_until === undefined
      ? null
      : new Date(row.locked_until).getTime();
  return {
    failureCount: Number(row.failure_count) || 0,
    lockoutLevel: Number(row.lockout_level) || 0,
    lockedUntilMs: Number.isFinite(lockedUntilMs) ? lockedUntilMs : null,
  };
}

export async function loadAuthRateLimit(sql: Sql, scope: string, subject: string): Promise<LoginLockoutState> {
  const rows = await sql`
    select failure_count, lockout_level, locked_until
    from auth_rate_limits
    where scope = ${scope} and subject = ${subject}
  `;
  return rowToState(rows[0] as RateRow | undefined);
}

export async function saveAuthRateLimit(
  sql: Sql,
  scope: string,
  subject: string,
  state: LoginLockoutState,
): Promise<void> {
  const lockedUntil =
    state.lockedUntilMs === null ? null : new Date(state.lockedUntilMs).toISOString();
  await sql`
    insert into auth_rate_limits (scope, subject, failure_count, lockout_level, locked_until, updated_at)
    values (${scope}, ${subject}, ${state.failureCount}, ${state.lockoutLevel}, ${lockedUntil}, now())
    on conflict (scope, subject) do update set
      failure_count = excluded.failure_count,
      lockout_level = excluded.lockout_level,
      locked_until = excluded.locked_until,
      updated_at = now()
  `;
}

export async function clearAuthRateLimit(sql: Sql, scope: string, subject: string): Promise<void> {
  await saveAuthRateLimit(sql, scope, subject, clearLoginLockoutState());
}
