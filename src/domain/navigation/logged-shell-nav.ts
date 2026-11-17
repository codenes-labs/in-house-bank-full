import { canProvisionHoldingCompanies, type HoldingProvisionerSession } from '../holding/holding-provision';
import { EXTRATO_KIND_OPTIONS, ExtratoKind } from '../ledger/extrato-kind';

export interface ShellNavItem {
  to: string;
  label: string;
  shortLabel?: string;
}

export interface ShellNavGroup {
  title: string;
  items: ShellNavItem[];
}

export function relatoriosExtratoNavTo(kind: ExtratoKind): string {
  if (kind === ExtratoKind.Installments) {
    return '/relatorios/extrato';
  }
  return `/relatorios/extrato?tipo=${encodeURIComponent(kind)}`;
}

export const RELATORIOS_EXTRATO_NAV_ITEMS: readonly ShellNavItem[] = EXTRATO_KIND_OPTIONS.map((option) => ({
  to: relatoriosExtratoNavTo(option.value),
  label: option.label,
}));

export const RELATORIOS_DESKTOP_NAV_ITEMS: readonly ShellNavItem[] = [
  ...RELATORIOS_EXTRATO_NAV_ITEMS,
  { to: '/relatorios/resumo', label: 'Resumo' },
];

export const HOLDING_DESKTOP_NAV_GROUP: ShellNavGroup = {
  title: 'Holding',
  items: [{ to: '/holding/empresas', label: 'Cadastro de empresas' }],
};

export const HOLDING_ROUTE_PREFIXES = ['/holding'] as const;

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
    items: [...RELATORIOS_DESKTOP_NAV_ITEMS],
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

export function desktopNavGroupsForUser(user: HoldingProvisionerSession | undefined): readonly ShellNavGroup[] {
  if (!user || !canProvisionHoldingCompanies(user)) {
    return DESKTOP_NAV_GROUPS;
  }
  return [
    DESKTOP_NAV_GROUPS[0]!,
    DESKTOP_NAV_GROUPS[1]!,
    HOLDING_DESKTOP_NAV_GROUP,
    ...DESKTOP_NAV_GROUPS.slice(2),
  ];
}

export const PATRIMONIO_ROUTE_PREFIXES = ['/patrimonio', '/financeiro', '/caixinhas', '/parcelamentos'] as const;

export const RELATORIOS_ROUTE_PREFIXES = ['/relatorios'] as const;

export function relatoriosExtratoNavKind(navTo: string): ExtratoKind | null {
  if (!navTo.startsWith('/relatorios/extrato')) {
    return null;
  }
  const tipo = new URL(navTo, 'https://inhouse.local').searchParams.get('tipo');
  if (!tipo) {
    return ExtratoKind.Installments;
  }
  const match = EXTRATO_KIND_OPTIONS.find((option) => option.value === tipo);
  return match?.value ?? null;
}

export function isRelatoriosExtratoNavActive(pathname: string, search: string, navTo: string): boolean {
  if (pathname !== '/relatorios/extrato') {
    return false;
  }
  const targetKind = relatoriosExtratoNavKind(navTo);
  const currentTipo = new URLSearchParams(search).get('tipo');
  const currentKind = parseExtratoKindFromSearch(currentTipo);
  return targetKind !== null && currentKind === targetKind;
}

function parseExtratoKindFromSearch(raw: string | null): ExtratoKind {
  const match = EXTRATO_KIND_OPTIONS.find((option) => option.value === raw);
  return match?.value ?? ExtratoKind.Installments;
}
