import { Link, useLocation } from 'react-router-dom';
import { activePublicToolLinks } from '../domain/navigation/public-tools-catalog';
import { cx } from './ui';

export function PublicToolsFooterNav() {
  const { pathname } = useLocation();
  const tools = activePublicToolLinks();

  if (tools.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Ferramentas públicas">
      <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Ferramentas</p>
      <ul className="flex flex-col gap-1.5">
        {tools.map((tool) => {
          const active = pathname === tool.to;
          return (
            <li key={tool.id}>
              <Link
                to={tool.to}
                className={cx(
                  'font-semibold text-primary hover:underline',
                  active && 'underline decoration-2 underline-offset-4',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {tool.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}