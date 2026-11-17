import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isAccessTokenExpired } from '../lib/access-token-expiry';
import { useSessionGuard } from '../lib/use-session-guard';
import { AUTH_ACCOUNT_INACTIVE_EVENT } from '../lib/auth-account-inactive';
import { authRequestInit, readAccessToken, writeAccessToken } from '../lib/auth-token';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    mustChangePassword: boolean;
    isDemo: boolean;
    holdingDelegate?: boolean;
    menuAccess?: import('../domain/holding/company-menu-access').CompanyMenuAccess;
  };
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: AuthSession | null;
  signIn: (
    email: string,
    password: string,
    options?: { totpCode?: string; turnstileToken?: string | null },
  ) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    options?: { turnstileToken?: string | null },
  ) => Promise<string | null>;
  recoverPassword: (
    email: string,
    newPassword: string,
    options?: { turnstileToken?: string | null },
  ) => Promise<string | null>;
  updatePassword: (password: string, currentPassword?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  const expireSession = useCallback(() => {
    writeAccessToken(null);
    setSession(null);
  }, []);

  useSessionGuard(Boolean(session), expireSession);

  useEffect(() => {
    const token = readAccessToken();
    if (token && isAccessTokenExpired(token)) {
      expireSession();
    }
  }, [expireSession]);

  const applySessionResponse = useCallback(
    (body: { configured?: boolean; user?: AuthSession['user'] | null; accountInactive?: boolean }) => {
      if (body.accountInactive) {
        expireSession();
        return;
      }
      setConfigured(body.configured !== false);
      if (!body.user) {
        expireSession();
      } else {
        setSession({ user: body.user });
      }
    },
    [expireSession],
  );

  const refreshSession = useCallback(async () => {
    if (!readAccessToken()) {
      return;
    }
    try {
      const response = await fetch('/api/auth/session', authRequestInit());
      if (!response.ok) {
        expireSession();
        return;
      }
      const body = (await response.json()) as {
        configured?: boolean;
        user?: AuthSession['user'] | null;
        accountInactive?: boolean;
      };
      applySessionResponse(body);
    } catch {
      // Mantém sessão local se a rede falhar; próxima requisição ou nova checagem trata inatividade.
    }
  }, [applySessionResponse, expireSession]);

  useEffect(() => {
    let active = true;
    void fetch('/api/auth/session', authRequestInit())
      .then(async (response) => {
        if (!response.ok) {
          return { configured: false, user: null };
        }
        return (await response.json()) as {
          configured?: boolean;
          user?: AuthSession['user'] | null;
          accountInactive?: boolean;
        };
      })
      .then((body) => {
        if (!active) {
          return;
        }
        applySessionResponse(body);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setConfigured(false);
        expireSession();
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applySessionResponse, expireSession]);

  useEffect(() => {
    const onInactive = () => expireSession();
    window.addEventListener(AUTH_ACCOUNT_INACTIVE_EVENT, onInactive);
    return () => window.removeEventListener(AUTH_ACCOUNT_INACTIVE_EVENT, onInactive);
  }, [expireSession]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(intervalId);
    };
  }, [session, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      async signIn(email, password, options) {
        return authenticate('/api/auth/sign-in', { email, password, ...options }, setSession);
      },
      async signUp(email, password, options) {
        return authenticate(
          '/api/auth/sign-up',
          { email, password, turnstileToken: options?.turnstileToken },
          setSession,
        );
      },
      async recoverPassword(email, newPassword, options) {
        const response = await fetch('/api/auth/recover', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            newPassword,
            turnstileToken: options?.turnstileToken ?? undefined,
          }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          return body.error ?? 'Não foi possível redefinir a senha.';
        }
        return null;
      },
      async updatePassword(password, currentPassword) {
        const response = await fetch('/api/auth/password', authRequestInit({
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            newPassword: password,
            ...(currentPassword ? { currentPassword } : {}),
          }),
        }));
        const body = (await response.json()) as {
          error?: string;
          user?: AuthSession['user'];
          accessToken?: string;
        };
        if (!response.ok || !body.user || !body.accessToken) {
          return body.error ?? 'Não foi possível salvar a senha.';
        }
        writeAccessToken(body.accessToken);
        setSession({ user: body.user });
        return null;
      },
      async signOut() {
        await fetch('/api/auth/sign-out', authRequestInit({ method: 'POST' }));
        writeAccessToken(null);
        setSession(null);
      },
    }),
    [configured, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export type AuthSignInPayload = {
  email: string;
  password: string;
  totpCode?: string;
  turnstileToken?: string | null;
};

async function authenticate(
  path: string,
  payload: AuthSignInPayload,
  setSession: (session: AuthSession | null) => void,
): Promise<string | null> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      totpCode: payload.totpCode,
      turnstileToken: payload.turnstileToken ?? undefined,
    }),
  });
  const body = (await response.json()) as {
    error?: string;
    user?: AuthSession['user'];
    accessToken?: string;
    retryAfterSeconds?: number;
    requiresTotp?: boolean;
  };
  if (response.status === 401 && body.requiresTotp) {
    return body.error ?? 'Informe o código do autenticador.';
  }
  if (!response.ok || !body.user || !body.accessToken) {
    return body.error ?? 'Não foi possível entrar.';
  }
  writeAccessToken(body.accessToken);
  setSession({ user: body.user });
  return null;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
