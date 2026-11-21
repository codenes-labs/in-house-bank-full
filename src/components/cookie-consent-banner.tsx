import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import {
  acceptCookieConsent,
  COOKIE_CONSENT_RESET_EVENT,
  declineCookieConsent,
  hasCookieConsentChoice,
} from '../domain/cookie/cookie-consent';
import { Button } from './ui';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(!hasCookieConsentChoice());
    sync();
    window.addEventListener(COOKIE_CONSENT_RESET_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_RESET_EVENT, sync);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-card/95 shadow-[var(--shadow-card)] backdrop-blur-md"
      role="dialog"
      aria-live="polite"
      aria-label="Consentimento de cookies"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <Cookie className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:mt-0" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Usamos cookies e armazenamento local essenciais para tema, sessão e preferências do site. Eles só são
            utilizados conforme necessário ao serviço — veja a{' '}
            <Link to="/privacidade" className="font-semibold text-primary hover:underline">
              Política de privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button
            type="button"
            variant="soft"
            className="min-h-10 px-5 text-sm"
            onClick={() => {
              declineCookieConsent();
              setVisible(false);
            }}
          >
            Recusar
          </Button>
          <Button
            type="button"
            className="min-h-10 px-5 text-sm"
            onClick={() => {
              acceptCookieConsent();
              setVisible(false);
            }}
          >
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}