import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { loadTurnstileScript } from './turnstile-script';

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
          appearance?: 'always' | 'execute' | 'interaction-only';
          size?: 'normal' | 'flexible' | 'compact';
          action?: string;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const TOKEN_WAIT_MS = 12_000;

type TokenWaiter = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
  timer: number;
};

export type TurnstileFieldHandle = {
  ensureToken: () => Promise<string>;
  reset: () => void;
};

export const TurnstileField = forwardRef<
  TurnstileFieldHandle,
  {
    siteKey: string;
    onToken: (token: string | null) => void;
    onExpired?: () => void;
    onFailed?: () => void;
  }
>(function TurnstileField({ siteKey, onToken, onExpired, onFailed }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const failedRef = useRef(false);
  const waitersRef = useRef<TokenWaiter[]>([]);
  const onTokenRef = useRef(onToken);
  const onExpiredRef = useRef(onExpired);
  const onFailedRef = useRef(onFailed);
  const reactId = useId();
  const [failed, setFailed] = useState(false);

  onTokenRef.current = onToken;
  onExpiredRef.current = onExpired;
  onFailedRef.current = onFailed;

  function clearWaiters(error: Error) {
    for (const waiter of waitersRef.current) {
      window.clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    waitersRef.current = [];
  }

  function publishToken(token: string) {
    tokenRef.current = token;
    failedRef.current = false;
    setFailed(false);
    onTokenRef.current(token);
    for (const waiter of waitersRef.current) {
      window.clearTimeout(waiter.timer);
      waiter.resolve(token);
    }
    waitersRef.current = [];
  }

  useImperativeHandle(ref, () => ({
    ensureToken() {
      if (tokenRef.current) {
        return Promise.resolve(tokenRef.current);
      }
      if (failedRef.current) {
        return Promise.reject(new Error('turnstile'));
      }
      return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          waitersRef.current = waitersRef.current.filter((waiter) => waiter.timer !== timer);
          reject(new Error('turnstile-timeout'));
        }, TOKEN_WAIT_MS);
        waitersRef.current.push({ resolve, reject, timer });
      });
    },
    reset() {
      tokenRef.current = null;
      onTokenRef.current(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

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
          appearance: 'interaction-only',
          size: 'flexible',
          action: 'auth',
          callback: (token) => publishToken(token),
          'expired-callback': () => {
            tokenRef.current = null;
            onTokenRef.current(null);
            onExpiredRef.current?.();
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
          'error-callback': () => {
            tokenRef.current = null;
            failedRef.current = true;
            setFailed(true);
            onTokenRef.current(null);
            onFailedRef.current?.();
            clearWaiters(new Error('turnstile'));
          },
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }
        failedRef.current = true;
        setFailed(true);
        onTokenRef.current(null);
        onFailedRef.current?.();
        clearWaiters(new Error('turnstile'));
      });

    return () => {
      active = false;
      clearWaiters(new Error('turnstile'));
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <div className="grid gap-1">
      <div className="turnstile-mount max-w-full">
        <div ref={containerRef} id={`turnstile-${reactId}`} className="min-h-0 w-full max-w-full" />
      </div>
      {failed ? (
        <p className="text-sm text-destructive">Não foi possível carregar o captcha. Verifique a conexão ou tente mais tarde.</p>
      ) : null}
    </div>
  );
});
