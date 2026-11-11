import {
  isLoginLocked,
  remainingLockSeconds,
  type LoginLockoutState,
} from './login-lockout';

export interface RateLimitSubjectState {
  scope: string;
  subject: string;
  state: LoginLockoutState;
}

export function worstRateLimitLock(
  entries: readonly RateLimitSubjectState[],
  nowMs: number,
): { locked: boolean; retryAfterSeconds: number } {
  let maxSeconds = 0;
  for (const entry of entries) {
    if (isLoginLocked(entry.state, nowMs)) {
      maxSeconds = Math.max(maxSeconds, remainingLockSeconds(entry.state, nowMs));
    }
  }
  return { locked: maxSeconds > 0, retryAfterSeconds: maxSeconds };
}
