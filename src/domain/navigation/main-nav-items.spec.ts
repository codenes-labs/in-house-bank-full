import { describe, expect, it } from 'vitest';
import { MAIN_NAV_ITEMS, resolveMainNavItems } from './main-nav-items';

describe('MAIN_NAV_ITEMS', () => {
  it('includes RF-01 menu sections in order', () => {
    expect(MAIN_NAV_ITEMS.map((item) => item.label)).toEqual([
      'Página inicial',
      'Parcelamentos',
      'Financeiro',
      'Relatórios',
      'Configurações',
    ]);
  });
});

describe('resolveMainNavItems', () => {
  it('disables Relatórios on portfolio deployment', () => {
    const items = resolveMainNavItems('portfolio');
    const reports = items.find((item) => item.route === '/relatorios');
    expect(reports?.disabled).toBe(true);
    expect(reports?.disabledHint).toBe('Em desenvolvimento');
  });

  it('keeps Relatórios enabled on personal deployment', () => {
    const reports = resolveMainNavItems('personal').find((item) => item.route === '/relatorios');
    expect(reports?.disabled).toBeFalsy();
  });
});
