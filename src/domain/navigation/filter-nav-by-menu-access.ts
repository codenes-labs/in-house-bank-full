import {
  type CompanyMenuAccess,
  DEFAULT_COMPANY_MENU_ACCESS,
  isRouteEnabled,
  MenuAccessCategory,
  legacyCategoryFlag,
} from '../holding/company-menu-access';
import { routesForCategory } from './menu-access-catalog';
import type { ShellNavGroup, ShellNavItem } from './logged-shell-nav';
import { DESKTOP_NAV_GROUPS, HOLDING_DESKTOP_NAV_GROUP } from './logged-shell-nav';

export function filterDesktopNavByMenuAccess(
  groups: readonly ShellNavGroup[],
  access: CompanyMenuAccess,
  includeHoldingGroup: boolean,
): ShellNavGroup[] {
  const result: ShellNavGroup[] = [];
  for (const group of groups) {
    if (group.title === 'Início') {
      result.push(group);
      continue;
    }
    const items = group.items.filter((item) => isRouteEnabled(access, item.to));
    if (items.length === 0) {
      continue;
    }
    if (group.title === 'Patrimônio' && !legacyCategoryFlag(access, MenuAccessCategory.Patrimonio)) {
      continue;
    }
    if (group.title === 'Relatórios' && !legacyCategoryFlag(access, MenuAccessCategory.Relatorios)) {
      continue;
    }
    if (group.title === 'Conta' && !legacyCategoryFlag(access, MenuAccessCategory.Conta)) {
      continue;
    }
    result.push({ ...group, items });
  }
  if (includeHoldingGroup && legacyCategoryFlag(access, MenuAccessCategory.Holding)) {
    const holdingItems = HOLDING_DESKTOP_NAV_GROUP.items.filter((item) => isRouteEnabled(access, item.to));
    if (holdingItems.length > 0) {
      const inicio = result.find((g) => g.title === 'Início');
      const patrimonioIndex = result.findIndex((g) => g.title === 'Patrimônio');
      const insertAt = patrimonioIndex >= 0 ? patrimonioIndex + 1 : inicio ? 1 : 0;
      result.splice(insertAt, 0, { title: 'Holding', items: holdingItems });
    }
  }
  return result;
}

export function filterMobileNavByMenuAccess(items: readonly ShellNavItem[], access: CompanyMenuAccess): ShellNavItem[] {
  const patrimonioRoutes = routesForCategory(MenuAccessCategory.Patrimonio);
  const patrimonioVisible = patrimonioRoutes.some((route) => isRouteEnabled(access, route));
  return items.filter((item) => {
    if (item.to === '/inicio') {
      return true;
    }
    if (item.to === '/patrimonio') {
      return patrimonioVisible;
    }
    if (item.to === '/relatorios') {
      return legacyCategoryFlag(access, MenuAccessCategory.Relatorios);
    }
    return false;
  });
}

export function defaultDesktopGroupsForUser(
  access: CompanyMenuAccess,
  showHoldingProvisioner: boolean,
): ShellNavGroup[] {
  const base = filterDesktopNavByMenuAccess(DESKTOP_NAV_GROUPS, access, false);
  if (showHoldingProvisioner) {
    return filterDesktopNavByMenuAccess(
      [...DESKTOP_NAV_GROUPS],
      {
        routes: {
          ...DEFAULT_COMPANY_MENU_ACCESS.routes,
          ...access.routes,
          '/holding/empresas': true,
        },
      },
      true,
    );
  }
  return filterDesktopNavByMenuAccess(base, access, legacyCategoryFlag(access, MenuAccessCategory.Holding));
}