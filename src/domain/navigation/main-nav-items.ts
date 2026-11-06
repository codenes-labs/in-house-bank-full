export interface MainNavItem {
  label: string;
  route: string;
  icon: string;
  disabled?: boolean;
  disabledHint?: string;
}

export const MAIN_NAV_ITEMS: readonly MainNavItem[] = [
  { label: 'Página inicial', route: '/', icon: 'home' },
  { label: 'Parcelamentos', route: '/parcelamentos', icon: 'receipt_long' },
  { label: 'Financeiro', route: '/financeiro', icon: 'account_balance_wallet' },
  { label: 'Relatórios', route: '/relatorios', icon: 'bar_chart' },
  { label: 'Configurações', route: '/configuracoes', icon: 'settings' },
];

export type MainNavDeploymentMode = 'development' | 'personal' | 'portfolio';

export function resolveMainNavItems(mode: MainNavDeploymentMode): MainNavItem[] {
  return MAIN_NAV_ITEMS.map((item) => {
    if (mode === 'portfolio' && item.route === '/relatorios') {
      return {
        ...item,
        disabled: true,
        disabledHint: 'Em desenvolvimento',
      };
    }
    return { ...item };
  });
}
