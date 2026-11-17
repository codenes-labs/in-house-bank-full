import { describe, expect, it } from 'vitest';
import { DEMO_EMAIL } from '../../server/account-seed';
import { HOLDING_ADMIN_EMAIL } from './holding-admin';
import {
  categoryCheckState,
  DEFAULT_COMPANY_MENU_ACCESS,
  MenuAccessCategory,
  menuAccessForAccount,
  normalizeCompanyMenuAccess,
  setCategoryRoutes,
} from './company-menu-access';
import { menuAccessRoutesCatalog } from '../navigation/menu-access-catalog';

describe('company-menu-access', () => {
  it('uses default all on except holding routes', () => {
    expect(DEFAULT_COMPANY_MENU_ACCESS.routes['/holding/empresas']).toBe(false);
    expect(DEFAULT_COMPANY_MENU_ACCESS.routes['/financeiro']).toBe(true);
  });

  it('normalizes legacy category json', () => {
    const access = normalizeCompanyMenuAccess({ holding: true, relatorios: false });
    expect(access.routes['/holding/empresas']).toBe(true);
    expect(access.routes['/relatorios/resumo']).toBe(false);
    expect(access.routes['/financeiro']).toBe(true);
  });

  it('toggles full category', () => {
    const off = setCategoryRoutes(DEFAULT_COMPANY_MENU_ACCESS, MenuAccessCategory.Patrimonio, false);
    expect(categoryCheckState(off, MenuAccessCategory.Patrimonio)).toBe('none');
    const on = setCategoryRoutes(off, MenuAccessCategory.Patrimonio, true);
    expect(categoryCheckState(on, MenuAccessCategory.Patrimonio)).toBe('all');
  });

  it('forces all routes for administration only', () => {
    const sparse = normalizeCompanyMenuAccess({ holding: false, relatorios: false });
    const admin = menuAccessForAccount(HOLDING_ADMIN_EMAIL, 'standard', sparse);
    expect(categoryCheckState(admin, MenuAccessCategory.Holding)).toBe('all');
    for (const entry of menuAccessRoutesCatalog()) {
      expect(admin.routes[entry.to]).toBe(true);
    }
  });

  it('demo defaults to full menu but honors saved routes', () => {
    const demo = menuAccessForAccount(DEMO_EMAIL, 'demo', {
      routes: { '/holding/empresas': false, '/financeiro': true },
    });
    expect(demo.routes['/holding/empresas']).toBe(false);
    expect(demo.routes['/financeiro']).toBe(true);
    const fresh = menuAccessForAccount(DEMO_EMAIL, 'demo', null);
    expect(categoryCheckState(fresh, MenuAccessCategory.Holding)).toBe('all');
  });
});