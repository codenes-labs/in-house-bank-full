import { resetCookieConsentForUi } from '../domain/cookie/cookie-consent';

const footerLinkClass =
  'block w-full max-w-full text-left text-sm font-semibold text-primary hover:underline bg-transparent p-0 border-0 cursor-pointer';

export function CookiePreferencesLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className ?? footerLinkClass} onClick={() => resetCookieConsentForUi()}>
      Preferências de cookies
    </button>
  );
}