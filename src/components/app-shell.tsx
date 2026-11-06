import { NavLink } from 'react-router-dom';
import {
  ChartColumn,
  House,
  Landmark,
  Settings,
  WalletCards,
} from 'lucide-react';
import { useAuth } from './auth-context';
import { useTheme } from './theme';
import { Button, cx, Logo } from './ui';

const items = [
  { to: '/inicio', label: 'Início', icon: House },
  { to: '/parcelamentos', label: 'Parcelamentos', icon: WalletCards },
  { to: '/financeiro', label: 'Financeiro', icon: Landmark },
  { to: '/relatorios', label: 'Relatórios', icon: ChartColumn },
  { to: '/configuracoes', label: 'Ajustes', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut, session } = useAuth();
  const { mode, toggle } = useTheme();

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[17rem_1fr]">
      {session?.user.isDemo ? (
        <p className="border-b border-border bg-warning-soft px-4 py-2 text-center text-sm text-status-pending lg:col-span-2">
          Conta de demonstração: você pode editar tudo, mas ao sair e entrar de novo os dados voltam ao mock.
        </p>
      ) : null}
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col lg:px-4 lg:py-6">
        <Logo />
        <nav className="mt-8 grid gap-1" aria-label="Menu principal">
          {items.map((item) => (
            <SideLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="mt-auto grid gap-2">
          <Button variant="ghost" type="button" onClick={toggle}>
            {mode === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </Button>
          <Button variant="soft" type="button" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </aside>
      <div>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <Logo />
          <button type="button" className="min-h-12 px-2 text-sm font-semibold text-primary" onClick={toggle}>
            {mode === 'dark' ? 'Claro' : 'Escuro'}
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-card px-1 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Menu principal">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="size-5" aria-hidden />
              {item.label === 'Parcelamentos' ? 'Parcelas' : item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function SideLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof House }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          'flex min-h-12 items-center gap-3 rounded-lg px-3 font-semibold',
          isActive ? 'bg-brand-soft text-primary' : 'text-foreground',
        )
      }
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </NavLink>
  );
}
