import { useEffect, useId, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }
  const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('turnstile')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('turnstile'));
    document.head.appendChild(script);
  });
}

export function TurnstileField({
  siteKey,
  onToken,
  onExpired,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  onExpired?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const reactId = useId();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
  void loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => onToken(token),
          'expired-callback': () => {
            onToken(null);
            onExpired?.();
          },
          'error-callback': () => {
            onToken(null);
            setFailed(true);
          },
        });
      })
      .catch(() => {
        if (active) {
          setFailed(true);
          onToken(null);
        }
      });

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onExpired, onToken, siteKey]);

  return (
    <div className="grid gap-1">
      <div ref={containerRef} id={`turnstile-${reactId}`} />
      {failed ? (
        <p className="text-sm text-destructive">Não foi possível carregar o captcha. Verifique a conexão ou tente mais tarde.</p>
      ) : null}
    </div>
  );
}
