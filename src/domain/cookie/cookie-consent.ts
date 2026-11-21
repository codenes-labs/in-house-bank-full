export const COOKIE_CONSENT_STORAGE_KEY = 'in-house-bank.cookie-consent';

export type CookieConsentValue = 'accepted' | 'declined';

export function readCookieConsent(): CookieConsentValue | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw === 'accepted' || raw === 'declined') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}

export function acceptCookieConsent(): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'accepted');
  } catch {
    // ignore quota / private mode
  }
}

export function declineCookieConsent(): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, 'declined');
  } catch {
    // ignore quota / private mode
  }
}

export function resetCookieConsent(): void {
  try {
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export const COOKIE_CONSENT_RESET_EVENT = 'in-house-bank:cookie-consent-reset';

export function resetCookieConsentForUi(): void {
  resetCookieConsent();
  window.dispatchEvent(new Event(COOKIE_CONSENT_RESET_EVENT));
}