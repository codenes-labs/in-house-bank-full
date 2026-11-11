import { describe, expect, it } from 'vitest';
import {
  parseStoredThemeMode,
  resolveEffectiveTheme,
  THEME_PUBLIC_STORAGE_KEY,
  THEME_STORAGE_KEY,
  themeModeToDocumentClass,
} from './theme-mode';

describe('parseStoredThemeMode', () => {
  it('defaults to light when value is null', () => {
    expect(parseStoredThemeMode(null)).toBe('light');
  });

  it('accepts light and dark', () => {
    expect(parseStoredThemeMode('light')).toBe('light');
    expect(parseStoredThemeMode('dark')).toBe('dark');
  });

  it('falls back to light for unknown values', () => {
    expect(parseStoredThemeMode('system')).toBe('light');
    expect(parseStoredThemeMode('')).toBe('light');
  });
});

describe('themeModeToDocumentClass', () => {
  it('maps dark mode to theme-dark class', () => {
    expect(themeModeToDocumentClass('dark')).toBe('theme-dark');
    expect(themeModeToDocumentClass('light')).toBeNull();
  });
});

describe('THEME_STORAGE_KEY', () => {
  it('is stable for persistence', () => {
    expect(THEME_PUBLIC_STORAGE_KEY).toBe('in-house-bank.themeMode');
    expect(THEME_STORAGE_KEY).toBe(THEME_PUBLIC_STORAGE_KEY);
  });
});

describe('resolveEffectiveTheme', () => {
  it('uses public theme when logged out', () => {
    expect(
      resolveEffectiveTheme({
        loggedIn: false,
        bankReady: false,
        accountTheme: 'dark',
        publicTheme: 'light',
      }),
    ).toBe('light');
  });

  it('uses account theme when logged in and bank is ready', () => {
    expect(
      resolveEffectiveTheme({
        loggedIn: true,
        bankReady: true,
        accountTheme: 'dark',
        publicTheme: 'light',
      }),
    ).toBe('dark');
  });

  it('keeps public theme while bank is loading', () => {
    expect(
      resolveEffectiveTheme({
        loggedIn: true,
        bankReady: false,
        accountTheme: 'dark',
        publicTheme: 'light',
      }),
    ).toBe('light');
  });
});
