import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode } from '../domain/theme/theme-mode';
import {
  readPublicThemeFromStorage,
  resolveEffectiveTheme,
  THEME_PUBLIC_STORAGE_KEY,
  themeModeToDocumentClass,
} from '../domain/theme/theme-mode';
import { useAuth } from './auth-context';
import { useBank } from './bank-context';

interface ThemeContextValue {
  mode: ThemeMode;
  /** Só afeta o site público; logado, use saveSettings com theme. */
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const bank = useBank();
  const loggedIn = Boolean(session?.user.id);

  const [publicMode, setPublicMode] = useState<ThemeMode>(() => readPublicThemeFromStorage());

  const mode = resolveEffectiveTheme({
    loggedIn,
    bankReady: bank.ready,
    accountTheme: bank.snapshot.settings.theme,
    publicTheme: publicMode,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', themeModeToDocumentClass(mode) === 'theme-dark');
  }, [mode]);

  const persistPublicMode = useCallback((next: ThemeMode) => {
    setPublicMode(next);
    localStorage.setItem(THEME_PUBLIC_STORAGE_KEY, next);
  }, []);

  const setMode = useCallback(
    (next: ThemeMode) => {
      if (loggedIn) {
        return;
      }
      persistPublicMode(next);
    },
    [loggedIn, persistPublicMode],
  );

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    if (loggedIn && bank.ready) {
      void bank.saveSettings({ ...bank.snapshot.settings, theme: next });
      return;
    }
    persistPublicMode(next);
  }, [bank, loggedIn, mode, persistPublicMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
