import { resetCookieConsentForUi } from '../domain/cookie/cookie-consent';

export function CookiePreferencesLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className ?? 'font-semibold text-primary hover:underline'}
      onClick={() => resetCookieConsentForUi()}
    >
      Preferências de cookies
    </button>
  );
}