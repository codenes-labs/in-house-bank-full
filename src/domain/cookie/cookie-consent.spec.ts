import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  acceptCookieConsent,
  COOKIE_CONSENT_STORAGE_KEY,
  declineCookieConsent,
  hasCookieConsentChoice,
  readCookieConsent,
} from './cookie-consent';

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('cookie-consent', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  });

  it('registra aceite e recusa', () => {
    expect(hasCookieConsentChoice()).toBe(false);
    acceptCookieConsent();
    expect(readCookieConsent()).toBe('accepted');
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    declineCookieConsent();
    expect(readCookieConsent()).toBe('declined');
    expect(hasCookieConsentChoice()).toBe(true);
  });
});