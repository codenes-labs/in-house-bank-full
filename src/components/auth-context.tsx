import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  sendRecovery: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabaseConfigured,
      loading,
      session,
      async signIn(email, password) {
        if (!supabase) {
          return 'Configure o Supabase para entrar.';
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signUp(email, password) {
        if (!supabase) {
          return 'Configure o Supabase para criar a conta.';
        }
        const { error } = await supabase.auth.signUp({ email, password });
        return error?.message ?? null;
      },
      async signInWithGoogle() {
        if (!supabase) {
          return 'Configure o Supabase para entrar com Google.';
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/inicio` },
        });
        return error?.message ?? null;
      },
      async sendRecovery(email) {
        if (!supabase) {
          return 'Configure o Supabase para recuperar a senha.';
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/recuperar-senha`,
        });
        return error?.message ?? null;
      },
      async updatePassword(password) {
        if (!supabase) {
          return 'Configure o Supabase para definir a nova senha.';
        }
        const { error } = await supabase.auth.updateUser({ password });
        return error?.message ?? null;
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
