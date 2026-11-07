import { NavLink } from 'react-router-dom';
import { cx } from '../../components/ui';
import { DOCS_NAV } from './docs-nav';

export function DocsSidebarNav({ className = '' }: { className?: string }) {
  return (
    <nav className={className} aria-label="Seções da documentação">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sumário</p>
      <ul className="grid gap-0.5">
        {DOCS_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/docs'}
              className={({ isActive }) =>
                cx(
                  'block rounded-lg border-l-2 py-2 pl-3.5 pr-2 text-sm font-semibold',
                  isActive
                    ? 'border-primary bg-brand-soft text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
