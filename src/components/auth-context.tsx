import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authRequestInit, writeAccessToken } from '../lib/auth-token';

export interface AuthSession {
  user: { id: string; email: string };
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  sendRecovery: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch('/api/auth/session', authRequestInit())
      .then(async (response) => {
        if (!response.ok) {
          return { configured: false, user: null };
        }
        return (await response.json()) as { configured?: boolean; user?: AuthSession['user'] | null };
      })
      .then((body) => {
        if (!active) {
          return;
        }
        setConfigured(body.configured !== false);
        setSession(body.user ? { user: body.user } : null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setConfigured(false);
        setSession(null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      async signIn(email, password) {
        return authenticate('/api/auth/sign-in', email, password, setSession);
      },
      async signUp(email, password) {
        return authenticate('/api/auth/sign-up', email, password, setSession);
      },
      async sendRecovery() {
        return 'A recuperação de senha por e-mail não está disponível neste banco.';
      },
      async updatePassword() {
        return 'A recuperação de senha por e-mail não está disponível neste banco.';
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

async function authenticate(
  path: string,
  email: string,
  password: string,
  setSession: (session: AuthSession | null) => void,
): Promise<string | null> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json()) as { error?: string; user?: AuthSession['user']; accessToken?: string };
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
