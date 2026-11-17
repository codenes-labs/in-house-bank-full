import {
  buildDefaultMenuAccessRoutes,
  buildFullMenuAccessRoutes,
  menuAccessRoutesCatalog,
  routesForCategory,
} from '../navigation/menu-access-catalog';
import { HoldingAccountProfile, resolveHoldingAccountProfile } from './holding-account-profile';

export const MenuAccessCategory = {
  Patrimonio: 'patrimonio',
  Holding: 'holding',
  Relatorios: 'relatorios',
  Conta: 'conta',
} as const;

export type MenuAccessCategory = (typeof MenuAccessCategory)[keyof typeof MenuAccessCategory];

export type CompanyMenuAccess = {
  routes: Record<string, boolean>;
};

export const DEFAULT_COMPANY_MENU_ACCESS: CompanyMenuAccess = {
  routes: buildDefaultMenuAccessRoutes(),
};

export const FULL_SYSTEM_MENU_ACCESS: CompanyMenuAccess = {
  routes: buildFullMenuAccessRoutes(),
};

export function normalizeDemoMenuAccess(raw: unknown): CompanyMenuAccess {
  const full = buildFullMenuAccessRoutes();
  const routes: Record<string, boolean> = { ...full };
  if (raw && typeof raw === 'object') {
    const source = raw as Record<string, unknown>;
    if (source.routes && typeof source.routes === 'object') {
      for (const entry of menuAccessRoutesCatalog()) {
        const value = (source.routes as Record<string, unknown>)[entry.to];
        if (typeof value === 'boolean') {
          routes[entry.to] = value;
        }
      }
    } else {
      const legacy = normalizeCompanyMenuAccess(raw);
      for (const entry of menuAccessRoutesCatalog()) {
        routes[entry.to] = isRouteEnabled(legacy, entry.to);
      }
    }
  }
  routes['/inicio'] = true;
  return { routes };
}

export function menuAccessForAccount(email: string, accountKind: string, raw: unknown): CompanyMenuAccess {
  const profile = resolveHoldingAccountProfile(email, accountKind);
  if (profile === HoldingAccountProfile.Administration) {
    return { routes: { ...FULL_SYSTEM_MENU_ACCESS.routes } };
  }
  if (profile === HoldingAccountProfile.Demo) {
    return normalizeDemoMenuAccess(raw);
  }
  return normalizeCompanyMenuAccess(raw);
}

export function menuAccessCategoryLabel(category: MenuAccessCategory): string {
  switch (category) {
    case MenuAccessCategory.Patrimonio:
      return 'Patrimônio';
    case MenuAccessCategory.Holding:
      return 'Holding';
    case MenuAccessCategory.Relatorios:
      return 'Relatórios';
    case MenuAccessCategory.Conta:
      return 'Conta (Ajustes)';
  }
}

export type CategoryCheckState = 'all' | 'none' | 'partial';

export function categoryCheckState(access: CompanyMenuAccess, category: MenuAccessCategory): CategoryCheckState {
  const routeIds = routesForCategory(category);
  if (routeIds.length === 0) {
    return 'none';
  }
  let enabled = 0;
  for (const route of routeIds) {
    if (isRouteEnabled(access, route)) {
      enabled += 1;
    }
  }
  if (enabled === 0) {
    return 'none';
  }
  if (enabled === routeIds.length) {
    return 'all';
  }
  return 'partial';
}

export function isRouteEnabled(access: CompanyMenuAccess, route: string): boolean {
  const defaults = DEFAULT_COMPANY_MENU_ACCESS.routes;
  const fallback = defaults[route] ?? true;
  return access.routes[route] ?? fallback;
}

export function setCategoryRoutes(
  access: CompanyMenuAccess,
  category: MenuAccessCategory,
  enabled: boolean,
): CompanyMenuAccess {
  const next = { ...access.routes };
  for (const route of routesForCategory(category)) {
    next[route] = enabled;
  }
  return { routes: next };
}

export function setRouteEnabled(access: CompanyMenuAccess, route: string, enabled: boolean): CompanyMenuAccess {
  return { routes: { ...access.routes, [route]: enabled } };
}

export function holdingDelegateFromMenuAccess(access: CompanyMenuAccess): boolean {
  return isRouteEnabled(access, '/holding/empresas');
}

export function legacyCategoryFlag(access: CompanyMenuAccess, category: MenuAccessCategory): boolean {
  const state = categoryCheckState(access, category);
  return state === 'all' || state === 'partial';
}

export function normalizeCompanyMenuAccess(raw: unknown): CompanyMenuAccess {
  const defaults = buildDefaultMenuAccessRoutes();
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  if (source.routes && typeof source.routes === 'object') {
    const routesSource = source.routes as Record<string, unknown>;
    const routes: Record<string, boolean> = { ...defaults };
    for (const entry of menuAccessRoutesCatalog()) {
      const value = routesSource[entry.to];
      if (typeof value === 'boolean') {
        routes[entry.to] = value;
      }
    }
    routes['/inicio'] = true;
    return { routes };
  }

  const routes: Record<string, boolean> = { ...defaults };
  const legacyPatrimonio = source.patrimonio !== false;
  const legacyHolding = source.holding === true;
  const legacyRelatorios = source.relatorios !== false;
  const legacyConta = source.conta !== false;

  for (const route of routesForCategory(MenuAccessCategory.Patrimonio)) {
    routes[route] = legacyPatrimonio;
  }
  for (const route of routesForCategory(MenuAccessCategory.Holding)) {
    routes[route] = legacyHolding;
  }
  for (const route of routesForCategory(MenuAccessCategory.Relatorios)) {
    routes[route] = legacyRelatorios;
  }
  for (const route of routesForCategory(MenuAccessCategory.Conta)) {
    routes[route] = legacyConta;
  }
  routes['/inicio'] = true;
  return { routes };
}