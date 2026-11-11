import { useEffect } from 'react';
import { SESSION_IDLE_TIMEOUT_MS } from '../domain/auth/access-token-policy';
import { readAccessToken } from './auth-token';
import { isAccessTokenExpired } from './access-token-expiry';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

export function useSessionGuard(
  active: boolean,
  onExpired: () => void,
  idleMs: number = SESSION_IDLE_TIMEOUT_MS,
): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    let lastActivity = Date.now();
    let idleTimer: number | undefined;

    function expireIfNeeded() {
      const token = readAccessToken();
      if (!token || isAccessTokenExpired(token)) {
        onExpired();
        return true;
      }
      return false;
    }

    function scheduleIdleCheck() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (Date.now() - lastActivity >= idleMs) {
          onExpired();
        }
      }, idleMs);
    }

    function markActive() {
      lastActivity = Date.now();
      scheduleIdleCheck();
    }

    if (expireIfNeeded()) {
      return;
    }
    scheduleIdleCheck();

    const interval = window.setInterval(() => {
      if (expireIfNeeded()) {
        return;
      }
      if (Date.now() - lastActivity >= idleMs) {
        onExpired();
      }
    }, 60_000);

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActive, { passive: true });
    }
    const onFocus = () => {
      if (expireIfNeeded()) {
        return;
      }
      markActive();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(idleTimer);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActive);
      }
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [active, idleMs, onExpired]);
}
