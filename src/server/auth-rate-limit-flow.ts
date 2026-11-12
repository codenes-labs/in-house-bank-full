import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  formatLoginLockoutMessage,
  isLoginLocked,
  recordLoginFailure,
  remainingLockSeconds,
  type LoginLockoutState,
} from '../domain/auth/login-lockout';
import { worstRateLimitLock, type RateLimitSubjectState } from '../domain/auth/rate-limit-subjects';
import { clearAuthRateLimit, loadAuthRateLimit, saveAuthRateLimit } from './auth-rate-limit-store';

type Sql = NeonQueryFunction<false, false>;

export type RateLimitKey = { scope: string; subject: string };

export async function loadRateLimitStates(sql: Sql, keys: readonly RateLimitKey[]): Promise<RateLimitSubjectState[]> {
  return Promise.all(
    keys.map(async (key) => {
      const state = await loadAuthRateLimit(sql, key.scope, key.subject);
      return { scope: key.scope, subject: key.subject, state };
    }),
  );
}

export function rateLimitBlockedResponse(
  entries: readonly RateLimitSubjectState[],
  nowMs: number,
  json: (body: unknown, status?: number, extraHeaders?: Record<string, string>) => Response,
): Response | null {
  const worst = worstRateLimitLock(entries, nowMs);
  if (!worst.locked) {
    return null;
  }
  return json(
    { error: formatLoginLockoutMessage(worst.retryAfterSeconds), retryAfterSeconds: worst.retryAfterSeconds },
    429,
    { 'retry-after': String(worst.retryAfterSeconds) },
  );
}

export async function recordRateLimitFailures(
  sql: Sql,
  keys: readonly RateLimitKey[],
  nowMs: number,
): Promise<{ locked: boolean; retryAfterSeconds: number }> {
  const updated: RateLimitSubjectState[] = [];
  for (const key of keys) {
    let state: LoginLockoutState = await loadAuthRateLimit(sql, key.scope, key.subject);
    state = recordLoginFailure(state, nowMs);
    await saveAuthRateLimit(sql, key.scope, key.subject, state);
    updated.push({ scope: key.scope, subject: key.subject, state });
  }
  const worst = worstRateLimitLock(updated, nowMs);
  return worst;
}

export async function clearRateLimitKeys(sql: Sql, keys: readonly RateLimitKey[]): Promise<void> {
  for (const key of keys) {
    await clearAuthRateLimit(sql, key.scope, key.subject);
  }
}

export function anyNewlyLocked(entries: readonly RateLimitSubjectState[], nowMs: number): boolean {
  return entries.some((entry) => isLoginLocked(entry.state, nowMs));
}

export function maxRetryAfter(entries: readonly RateLimitSubjectState[], nowMs: number): number {
  return entries.reduce((max, entry) => Math.max(max, remainingLockSeconds(entry.state, nowMs)), 0);
}
