import { NavLink, Outlet } from 'react-router-dom';
import { cx } from '../components/ui';

const sections = [
  { to: '/relatorios/extrato', label: 'Extrato' },
  { to: '/relatorios/resumo', label: 'Resumo' },
] as const;

export function RelatoriosLayout() {
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Relatórios</h1>
      <nav className="flex gap-2" aria-label="Seções de relatórios">
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              cx(
                'press min-h-11 rounded-lg px-4 text-sm font-semibold',
                isActive ? 'bg-brand-soft text-primary' : 'bg-muted text-muted-foreground',
              )
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
