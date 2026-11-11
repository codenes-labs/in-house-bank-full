import { describe, expect, it } from 'vitest';
import {
  clearLoginLockoutState,
  createEmptyLoginLockoutState,
  formatLoginLockoutMessage,
  isLoginLocked,
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_FAILURES_BEFORE_LOCKOUT,
  recordLoginFailure,
  remainingLockSeconds,
} from './login-lockout';

const T0 = Date.parse('2026-01-01T12:00:00.000Z');

function failNTimes(n: number, start = createEmptyLoginLockoutState(), atMs = T0) {
  let state = start;
  for (let i = 0; i < n; i += 1) {
    state = recordLoginFailure(state, atMs);
  }
  return state;
}

describe('recordLoginFailure', () => {
  it('does not lock before the failure threshold', () => {
    const state = failNTimes(LOGIN_FAILURES_BEFORE_LOCKOUT - 1);
    expect(state.failureCount).toBe(LOGIN_FAILURES_BEFORE_LOCKOUT - 1);
    expect(state.lockedUntilMs).toBeNull();
    expect(isLoginLocked(state, T0)).toBe(false);
  });

  it('locks for 15 minutes on the fifth failure', () => {
    const state = failNTimes(LOGIN_FAILURES_BEFORE_LOCKOUT);
    const expectedUntil = T0 + LOGIN_LOCKOUT_MINUTES[0]! * 60 * 1000;
    expect(state.lockedUntilMs).toBe(expectedUntil);
    expect(state.lockoutLevel).toBe(1);
    expect(state.failureCount).toBe(0);
    expect(isLoginLocked(state, T0)).toBe(true);
    expect(remainingLockSeconds(state, T0)).toBe(15 * 60);
  });

  it('escalates to 30, 60 and 120 minute lockouts', () => {
    let state = createEmptyLoginLockoutState();
    const durations = LOGIN_LOCKOUT_MINUTES;
    for (let cycle = 0; cycle < durations.length; cycle += 1) {
      const at = T0 + cycle * 10_000;
      state = failNTimes(LOGIN_FAILURES_BEFORE_LOCKOUT, state, at);
      const minutes = durations[Math.min(cycle, durations.length - 1)]!;
      expect(remainingLockSeconds(state, at)).toBe(minutes * 60);
      const unlockedAt = (state.lockedUntilMs ?? 0) + 1;
      state = { ...state, lockedUntilMs: null };
      expect(isLoginLocked(state, unlockedAt)).toBe(false);
    }
    const afterMax = failNTimes(LOGIN_FAILURES_BEFORE_LOCKOUT, state);
    expect(remainingLockSeconds(afterMax, T0)).toBe(120 * 60);
  });

  it('clears on successful login helper', () => {
    const locked = failNTimes(LOGIN_FAILURES_BEFORE_LOCKOUT);
    expect(isLoginLocked(locked, T0)).toBe(true);
    const cleared = clearLoginLockoutState();
    expect(cleared).toEqual(createEmptyLoginLockoutState());
  });
});

describe('formatLoginLockoutMessage', () => {
  it('uses singular minute for short waits', () => {
    expect(formatLoginLockoutMessage(45)).toContain('1 minuto');
  });

  it('rounds up minutes for longer waits', () => {
    expect(formatLoginLockoutMessage(15 * 60)).toContain('15 minutos');
  });
});
