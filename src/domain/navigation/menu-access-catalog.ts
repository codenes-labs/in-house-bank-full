import { ExtratoKind } from '../ledger/extrato-kind';

export type MenuAccessCatalogCategory = 'patrimonio' | 'holding' | 'relatorios' | 'conta';

export type MenuAccessRouteEntry = {
  to: string;
  label: string;
  category: MenuAccessCatalogCategory;
};

const EXTRATO_ROUTE_ENTRIES: MenuAccessRouteEntry[] = [
  { to: '/relatorios/extrato', label: 'Parcelamento', category: 'relatorios' },
  {
    to: `/relatorios/extrato?tipo=${ExtratoKind.Payables}`,
    label: 'Contas a pagar',
    category: 'relatorios',
  },
  {
    to: `/relatorios/extrato?tipo=${ExtratoKind.Receivables}`,
    label: 'Contas a receber',
    category: 'relatorios',
  },
  {
    to: `/relatorios/extrato?tipo=${ExtratoKind.CashBox}`,
    label: 'Caixinha',
    category: 'relatorios',
  },
  {
    to: `/relatorios/extrato?tipo=${ExtratoKind.FreeBalance}`,
    label: 'Saldo livre',
    category: 'relatorios',
  },
  { to: '/relatorios/resumo', label: 'Resumo', category: 'relatorios' },
];

export const MENU_ACCESS_ROUTE_DEFINITIONS: readonly MenuAccessRouteEntry[] = [
  { to: '/financeiro', label: 'Financeiro', category: 'patrimonio' },
  { to: '/caixinhas', label: 'Caixinhas', category: 'patrimonio' },
  { to: '/parcelamentos', label: 'Parcelamentos', category: 'patrimonio' },
  ...EXTRATO_ROUTE_ENTRIES,
  { to: '/configuracoes', label: 'Ajustes', category: 'conta' },
  { to: '/holding/empresas', label: 'Cadastro de empresas', category: 'holding' },
];

export function menuAccessRoutesCatalog(): readonly MenuAccessRouteEntry[] {
  return MENU_ACCESS_ROUTE_DEFINITIONS;
}

export function routesForCategory(category: MenuAccessCatalogCategory): readonly string[] {
  return MENU_ACCESS_ROUTE_DEFINITIONS.filter((entry) => entry.category === category).map((entry) => entry.to);
}

export function buildDefaultMenuAccessRoutes(): Record<string, boolean> {
  const routes: Record<string, boolean> = { '/inicio': true };
  for (const entry of MENU_ACCESS_ROUTE_DEFINITIONS) {
    routes[entry.to] = entry.category !== 'holding';
  }
  return routes;
}