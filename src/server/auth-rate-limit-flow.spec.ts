import { describe, expect, it } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createEmptyLoginLockoutState } from '../domain/auth/login-lockout';
import { loadRateLimitStates, rateLimitBlockedResponse } from './auth-rate-limit-flow';

type Sql = NeonQueryFunction<false, false>;

function sqlReturning(rowsBySubject: Record<string, unknown[]>): Sql {
  const sql = (async (_strings: TemplateStringsArray, ...values: unknown[]) => {
    const subject = String(values[1] ?? '');
    return rowsBySubject[subject] ?? [];
  }) as unknown as Sql;
  return sql;
}

describe('loadRateLimitStates', () => {
  it('loads every key, including a subject with no row', async () => {
    const sql = sqlReturning({
      'ada@example.com': [{ failure_count: 2, lockout_level: 1, locked_until: '2026-01-01T12:15:00.000Z' }],
    });
    const states = await loadRateLimitStates(sql, [
      { scope: 'sign-in:email', subject: 'ada@example.com' },
      { scope: 'sign-in:ip', subject: '203.0.113.8' },
    ]);
    expect(states).toEqual([
      {
        scope: 'sign-in:email',
        subject: 'ada@example.com',
        state: {
          failureCount: 2,
          lockoutLevel: 1,
          lockedUntilMs: Date.parse('2026-01-01T12:15:00.000Z'),
        },
      },
      {
        scope: 'sign-in:ip',
        subject: '203.0.113.8',
        state: createEmptyLoginLockoutState(),
      },
    ]);
  });
});

describe('rateLimitBlockedResponse', () => {
  const nowMs = Date.parse('2026-01-01T12:00:00.000Z');

  it('returns null when nothing is locked', () => {
    const response = rateLimitBlockedResponse(
      [{ scope: 'sign-in:email', subject: 'ada@example.com', state: createEmptyLoginLockoutState() }],
      nowMs,
      (body, status) => Response.json(body, { status }),
    );
    expect(response).toBeNull();
  });

  it('returns 429 with the longest remaining lock', async () => {
    const response = rateLimitBlockedResponse(
      [
        {
          scope: 'sign-in:email',
          subject: 'ada@example.com',
          state: { failureCount: 0, lockoutLevel: 1, lockedUntilMs: nowMs + 15 * 60 * 1000 },
        },
      ],
      nowMs,
      (body, status, extraHeaders) => Response.json(body, { status, headers: extraHeaders }),
    );
    expect(response?.status).toBe(429);
    expect(response?.headers.get('retry-after')).toBe('900');
    await expect(response?.json()).resolves.toMatchObject({ retryAfterSeconds: 900 });
  });
});
