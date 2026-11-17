import { describe, expect, it } from 'vitest';
import {
  categoryCheckState,
  DEFAULT_COMPANY_MENU_ACCESS,
  MenuAccessCategory,
  normalizeCompanyMenuAccess,
  setCategoryRoutes,
} from './company-menu-access';

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
});