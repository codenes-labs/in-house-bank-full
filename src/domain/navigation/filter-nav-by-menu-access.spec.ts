import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMPANY_MENU_ACCESS,
  MenuAccessCategory,
  setCategoryRoutes,
  setRouteEnabled,
} from '../holding/company-menu-access';
import { filterDesktopNavByMenuAccess, filterMobileNavByMenuAccess } from './filter-nav-by-menu-access';
import { DESKTOP_NAV_GROUPS, MOBILE_BOTTOM_NAV } from './logged-shell-nav';

describe('filter-nav-by-menu-access', () => {
  it('hides patrimonio when category disabled', () => {
    const access = setCategoryRoutes(DEFAULT_COMPANY_MENU_ACCESS, MenuAccessCategory.Patrimonio, false);
    const groups = filterDesktopNavByMenuAccess(DESKTOP_NAV_GROUPS, access, false);
    expect(groups.some((g) => g.title === 'Patrimônio')).toBe(false);
    expect(groups.some((g) => g.title === 'Início')).toBe(true);
  });

  it('keeps patrimonio group with partial screens', () => {
    let access = setCategoryRoutes(DEFAULT_COMPANY_MENU_ACCESS, MenuAccessCategory.Patrimonio, false);
    access = setRouteEnabled(access, '/financeiro', true);
    const groups = filterDesktopNavByMenuAccess(DESKTOP_NAV_GROUPS, access, false);
    const patrimonio = groups.find((g) => g.title === 'Patrimônio');
    expect(patrimonio?.items.map((i) => i.to)).toEqual(['/financeiro']);
  });

  it('filters mobile bottom nav', () => {
    const access = setCategoryRoutes(DEFAULT_COMPANY_MENU_ACCESS, MenuAccessCategory.Patrimonio, false);
    const items = filterMobileNavByMenuAccess(MOBILE_BOTTOM_NAV, access);
    expect(items.map((i) => i.to)).toEqual(['/inicio', '/relatorios']);
  });
});