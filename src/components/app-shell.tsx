import { NavLink, useLocation } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChartColumn,
  CircleDollarSign,
  House,
  Landmark,
  Moon,
  PiggyBank,
  LogOut,
  Settings,
  Sun,
  WalletCards,
} from 'lucide-react';
import { useAuth } from './auth-context';
import { DemoBanner } from './demo-banner';
import { useAccountThemeToggle } from '../lib/use-account-theme-toggle';
import { UserAccountMenu } from './user-account-menu';
import { cx, Logo } from './ui';
import {
  DESKTOP_NAV_GROUPS,
  MOBILE_BOTTOM_NAV,
  PATRIMONIO_ROUTE_PREFIXES,
  RELATORIOS_ROUTE_PREFIXES,
  isRelatoriosExtratoNavActive,
  relatoriosExtratoNavKind,
  type ShellNavItem,
} from '../domain/navigation/logged-shell-nav';
import { ExtratoKind } from '../domain/ledger/extrato-kind';

const NAV_ICONS: Record<string, typeof House> = {
  '/inicio': House,
  '/patrimonio': Landmark,
  '/financeiro': Landmark,
  '/caixinhas': PiggyBank,
  '/parcelamentos': WalletCards,
  '/relatorios': ChartColumn,
  '/relatorios/resumo': ChartColumn,
  '/configuracoes': Settings,
};

const EXTRATO_KIND_NAV_ICONS: Record<ExtratoKind, typeof House> = {
  [ExtratoKind.Payables]: ArrowDownToLine,
  [ExtratoKind.Receivables]: ArrowUpFromLine,
  [ExtratoKind.Installments]: WalletCards,
  [ExtratoKind.CashBox]: PiggyBank,
  [ExtratoKind.FreeBalance]: CircleDollarSign,
};

function navIconForItem(to: string): typeof House {
  const extratoKind = relatoriosExtratoNavKind(to);
  if (extratoKind) {
    return EXTRATO_KIND_NAV_ICONS[extratoKind];
  }
  return NAV_ICONS[to] ?? House;
}

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut, session } = useAuth();
  const { mode, toggle } = useAccountThemeToggle();
  const location = useLocation();
  const themeLabel = mode === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {session?.user.isDemo ? <DemoBanner /> : null}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden min-h-0 border-r border-border bg-card lg:flex lg:flex-col lg:overflow-y-auto lg:px-4 lg:py-6">
          <Logo />
          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-6" aria-label="Menu principal">
            <div className="grid gap-6">
              {DESKTOP_NAV_GROUPS.map((group) => {
                const showSectionTitle =
                  group.items.length > 1 || group.items[0]?.label !== group.title;
                return (
                  <div key={group.title} className="grid gap-1">
                    {showSectionTitle ? (
                      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.title}
                      </p>
                    ) : null}
                    {group.items.map((item) => (
                      <SideLink key={item.to} {...item} icon={navIconForItem(item.to)} />
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="mt-auto grid gap-1 border-t border-border pt-4">
              <button
                type="button"
                className="press flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left font-semibold text-foreground hover:bg-muted"
                onClick={() => void signOut()}
              >
                <LogOut className="size-5 shrink-0" aria-hidden />
                Sair
              </button>
            </div>
          </nav>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="press inline-flex size-12 items-center justify-center rounded-lg text-muted-foreground"
                onClick={toggle}
                aria-label={themeLabel}
                title={themeLabel}
              >
                {mode === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
              </button>
              <UserAccountMenu />
            </div>
          </header>
          <main className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">{children}</div>
          </main>
          <nav
            className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-border bg-card px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
            aria-label="Menu principal"
          >
            {MOBILE_BOTTOM_NAV.map((item) => (
              <BottomLink key={item.to} item={item} pathname={location.pathname} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

function SideLink({ to, label, icon: Icon }: ShellNavItem & { icon: typeof House }) {
  const location = useLocation();
  const extratoKind = relatoriosExtratoNavKind(to);

  return (
    <NavLink
      to={to}
      end={!['/parcelamentos', '/caixinhas'].includes(to.split('?')[0] ?? to)}
      className={({ isActive }) => {
        const active =
          extratoKind !== null
            ? isRelatoriosExtratoNavActive(location.pathname, location.search, to)
            : isActive;
        return cx(
          'flex min-h-12 items-center gap-3 rounded-lg px-3 font-semibold',
          active ? 'bg-brand-soft text-primary' : 'text-foreground',
        );
      }}
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </NavLink>
  );
}

function BottomLink({ item, pathname }: { item: ShellNavItem; pathname: string }) {
  const Icon = NAV_ICONS[item.to] ?? House;
  const isActive =
    item.to === '/inicio'
      ? pathname === '/inicio'
      : item.to === '/patrimonio'
        ? matchesPrefix(pathname, PATRIMONIO_ROUTE_PREFIXES)
        : matchesPrefix(pathname, RELATORIOS_ROUTE_PREFIXES);

  return (
    <NavLink
      to={item.to}
      className={cx(
        'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
        isActive ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-5" aria-hidden />
      {item.shortLabel ?? item.label}
    </NavLink>
  );
}
