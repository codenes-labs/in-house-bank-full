export const UI_FONT_SCALE_STORAGE_KEY = 'in-house-bank.uiFontScale';

export type UiFontScale = 'default' | 'large';

export function parseUiFontScale(raw: string | null): UiFontScale {
  return raw === 'large' ? 'large' : 'default';
}

export function applyUiFontScale(scale: UiFontScale): void {
  if (scale === 'large') {
    document.documentElement.dataset.uiScale = 'large';
  } else {
    delete document.documentElement.dataset.uiScale;
  }
  localStorage.setItem(UI_FONT_SCALE_STORAGE_KEY, scale);
}

export function readStoredUiFontScale(): UiFontScale {
  if (typeof localStorage === 'undefined') {
    return 'default';
  }
  return parseUiFontScale(localStorage.getItem(UI_FONT_SCALE_STORAGE_KEY));
}
