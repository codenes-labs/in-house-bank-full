/** Preferência do site público (landing, docs, entrar). Padrão claro. */
export const THEME_PUBLIC_STORAGE_KEY = 'in-house-bank.themeMode';

/** @deprecated Use THEME_PUBLIC_STORAGE_KEY — mesma chave, só persiste fora da conta. */
export const THEME_STORAGE_KEY = THEME_PUBLIC_STORAGE_KEY;

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

export function readPublicThemeFromStorage(storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): ThemeMode {
  return parseStoredThemeMode(storage?.getItem(THEME_PUBLIC_STORAGE_KEY) ?? null);
}

export function resolveEffectiveTheme(input: {
  loggedIn: boolean;
  bankReady: boolean;
  accountTheme: ThemeMode;
  publicTheme: ThemeMode;
}): ThemeMode {
  if (input.loggedIn && input.bankReady) {
    return input.accountTheme;
  }
  return input.publicTheme;
}
