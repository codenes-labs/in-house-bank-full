export const THEME_STORAGE_KEY = 'in-house-bank.themeMode';

export type ThemeMode = 'light' | 'dark';

const VALID_THEME_MODES: readonly ThemeMode[] = ['light', 'dark'];

export function parseStoredThemeMode(raw: string | null): ThemeMode {
  if (raw !== null && (VALID_THEME_MODES as readonly string[]).includes(raw)) {
    return raw as ThemeMode;
  }
  return 'light';
}

export function themeModeToDocumentClass(mode: ThemeMode): string | null {
  return mode === 'dark' ? 'theme-dark' : null;
}
