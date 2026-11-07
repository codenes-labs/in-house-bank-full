export interface MainNavItem {
  label: string;
  route: string;
  icon: string;
  disabled?: boolean;
  disabledHint?: string;
}

/** Rotas principais do app logado (referência de domínio; navegação visual em logged-shell-nav). */
export const MAIN_NAV_ITEMS: readonly MainNavItem[] = [
  { label: 'Início', route: '/inicio', icon: 'home' },
  { label: 'Patrimônio', route: '/patrimonio', icon: 'savings' },
  { label: 'Financeiro', route: '/financeiro', icon: 'account_balance_wallet' },
  { label: 'Caixinhas', route: '/caixinhas', icon: 'savings' },
  { label: 'Parcelamentos', route: '/parcelamentos', icon: 'receipt_long' },
  { label: 'Relatórios', route: '/relatorios', icon: 'bar_chart' },
  { label: 'Ajustes', route: '/configuracoes', icon: 'settings' },
];

/** Sub-rota usada só para regras de deploy (ex.: portfolio). */
export const RELATORIOS_RESUMO_ROUTE = '/relatorios/resumo' as const;

export type MainNavDeploymentMode = 'development' | 'personal' | 'portfolio';

export function resolveMainNavItems(_mode: MainNavDeploymentMode): MainNavItem[] {
  return MAIN_NAV_ITEMS.map((item) => ({ ...item }));
}

export function isRelatoriosResumoDisabled(mode: MainNavDeploymentMode): boolean {
  return mode === 'portfolio';
}
