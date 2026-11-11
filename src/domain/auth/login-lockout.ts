export const LOGIN_FAILURES_BEFORE_LOCKOUT = 5;

/** Minutos de bloqueio por nível (0 = primeiro bloqueio após 5 falhas). */
export const LOGIN_LOCKOUT_MINUTES = [15, 30, 60, 120] as const;

export interface LoginLockoutState {
  failureCount: number;
  lockoutLevel: number;
  lockedUntilMs: number | null;
}

export function createEmptyLoginLockoutState(): LoginLockoutState {
  return { failureCount: 0, lockoutLevel: 0, lockedUntilMs: null };
}

export function isLoginLocked(state: LoginLockoutState, nowMs: number): boolean {
  return state.lockedUntilMs !== null && state.lockedUntilMs > nowMs;
}

export function remainingLockSeconds(state: LoginLockoutState, nowMs: number): number {
  if (!isLoginLocked(state, nowMs)) {
    return 0;
  }
  return Math.max(0, Math.ceil((state.lockedUntilMs! - nowMs) / 1000));
}

export function recordLoginFailure(state: LoginLockoutState, nowMs: number): LoginLockoutState {
  if (isLoginLocked(state, nowMs)) {
    return state;
  }
  const failureCount = state.failureCount + 1;
  if (failureCount < LOGIN_FAILURES_BEFORE_LOCKOUT) {
    return { ...state, failureCount };
  }
  const level = Math.min(state.lockoutLevel, LOGIN_LOCKOUT_MINUTES.length - 1);
  const minutes = LOGIN_LOCKOUT_MINUTES[level]!;
  const lockedUntilMs = nowMs + minutes * 60 * 1000;
  const nextLevel = Math.min(state.lockoutLevel + 1, LOGIN_LOCKOUT_MINUTES.length - 1);
  return {
    failureCount: 0,
    lockoutLevel: nextLevel,
    lockedUntilMs,
  };
}

export function clearLoginLockoutState(): LoginLockoutState {
  return createEmptyLoginLockoutState();
}

export function formatLoginLockoutMessage(remainingSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(remainingSeconds / 60));
  if (minutes === 1) {
    return 'Muitas tentativas de login. Aguarde cerca de 1 minuto antes de tentar de novo.';
  }
  return `Muitas tentativas de login. Aguarde cerca de ${minutes} minutos antes de tentar de novo.`;
}
