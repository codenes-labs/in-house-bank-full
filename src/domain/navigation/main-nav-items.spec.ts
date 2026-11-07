import { describe, expect, it } from 'vitest';
import { isRelatoriosResumoDisabled, MAIN_NAV_ITEMS } from './main-nav-items';

describe('MAIN_NAV_ITEMS', () => {
  it('lists primary logged-in routes', () => {
    expect(MAIN_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Início',
      'Patrimônio',
      'Financeiro',
      'Caixinhas',
      'Parcelamentos',
      'Relatórios',
      'Ajustes',
    ]);
  });
});

describe('isRelatoriosResumoDisabled', () => {
  it('disables Resumo on portfolio deployment', () => {
    expect(isRelatoriosResumoDisabled('portfolio')).toBe(true);
  });

  it('keeps Resumo enabled on personal deployment', () => {
    expect(isRelatoriosResumoDisabled('personal')).toBe(false);
  });
});
