import { useCallback } from 'react';
import { useAuth } from '../components/auth-context';
import { useBank } from '../components/bank-context';
import { useTheme } from '../components/theme';
import type { ThemeMode } from '../domain/theme/theme-mode';

export function useAccountThemeToggle() {
  const { mode, setMode } = useTheme();
  const bank = useBank();
  const { session } = useAuth();

  const toggle = useCallback(() => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    if (session?.user.id && bank.ready) {
      void bank.saveSettings({ ...bank.snapshot.settings, theme: next });
    }
  }, [bank.ready, bank.saveSettings, bank.snapshot.settings, mode, session?.user.id, setMode]);

  return { mode, setMode, toggle };
}
