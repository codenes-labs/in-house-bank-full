export interface ShellNavItem {
  to: string;
  label: string;
  shortLabel?: string;
}

export interface ShellNavGroup {
  title: string;
  items: ShellNavItem[];
}

export const DESKTOP_NAV_GROUPS: readonly ShellNavGroup[] = [
  {
    title: 'Início',
    items: [{ to: '/inicio', label: 'Início' }],
  },
  {
    title: 'Patrimônio',
    items: [
      { to: '/financeiro', label: 'Financeiro' },
      { to: '/caixinhas', label: 'Caixinhas' },
      { to: '/parcelamentos', label: 'Parcelamentos' },
    ],
  },
  {
    title: 'Relatórios',
    items: [{ to: '/relatorios', label: 'Relatórios' }],
  },
  {
    title: 'Conta',
    items: [{ to: '/configuracoes', label: 'Ajustes' }],
  },
];

export const MOBILE_BOTTOM_NAV: readonly ShellNavItem[] = [
  { to: '/inicio', label: 'Início' },
  { to: '/patrimonio', label: 'Patrimônio' },
  { to: '/relatorios', label: 'Relatórios' },
];

export const PATRIMONIO_ROUTE_PREFIXES = ['/patrimonio', '/financeiro', '/caixinhas', '/parcelamentos'] as const;

export const RELATORIOS_ROUTE_PREFIXES = ['/relatorios'] as const;
