import { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PublicSiteChrome } from '../../components/public-site-chrome';
import { DOCS_NAV } from './docs-nav';
import { DocsSearchProvider, useDocsSearch } from './docs-search-context';
import { filterDocsSearch } from './docs-search-index';

function DocsSideNav({
  className = '',
  visibleTo,
}: {
  className?: string;
  visibleTo: ReadonlySet<string>;
}) {
  const items = DOCS_NAV.filter((item) => visibleTo.has(item.to));
  return (
    <nav className={className} aria-label="Seções da documentação">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sumário</p>
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma seção encontrada.</p>
      ) : (
        <ul className="grid gap-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/docs'}
                className={({ isActive }) =>
                  [
                    'block rounded-lg border-l-2 py-2 pl-3.5 pr-2 text-sm font-semibold',
                    isActive
                      ? 'border-primary bg-brand-soft text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

function DocsLayoutBody() {
  const { query } = useDocsSearch();
  const visibleTo = useMemo(
    () => new Set(filterDocsSearch(query).map((entry) => entry.to)),
    [query],
  );

  return (
    <PublicSiteChrome section="docs">
      <section className="mt-8">
        <div className="mb-6 lg:grid lg:grid-cols-[minmax(13.5rem,17rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-14">
          <aside className="mb-6 min-w-0 lg:sticky lg:top-[5.25rem] lg:mb-0 lg:self-start lg:pr-2">
            <DocsSideNav visibleTo={visibleTo} />
          </aside>
          <div className="min-w-0">
            <div className="grid gap-6">
              <header>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">Documentação técnica</p>
                <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">In House Bank</h1>
                <p className="mt-3 text-lg text-muted-foreground">
                  Referência do produto, stack, banco, pipeline e API HTTP. Esta área não aparece no menu da conta
                  logada.
                </p>
              </header>
              <Outlet />
            </div>
          </div>
        </div>
      </section>
    </PublicSiteChrome>
  );
}

export function DocsLayout() {
  return (
    <DocsSearchProvider>
      <DocsLayoutBody />
    </DocsSearchProvider>
  );
}
