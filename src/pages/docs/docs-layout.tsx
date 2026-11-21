import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicSiteChrome } from '../../components/public-site-chrome';
import { DocsSearchProvider } from './docs-search-context';
import { DocsSidebarNav } from './docs-side-nav';
import { DocsSidebarRail } from './docs-sidebar-rail';

function DocsLayoutBody() {
  const { pathname } = useLocation();
  const isDocsHome = pathname === '/docs' || pathname === '/docs/';

  useEffect(() => {
    document.documentElement.classList.add('docs-public-scroll');
    return () => document.documentElement.classList.remove('docs-public-scroll');
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <PublicSiteChrome section="docs">
      <section className="mt-4 sm:mt-6 lg:mt-8">
        <div className="mb-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-14">
          <DocsSidebarRail>
            <DocsSidebarNav />
          </DocsSidebarRail>
          <div className="min-w-0">
            <div className="grid gap-4 sm:gap-6">
              {isDocsHome ? (
                <header>
                  <p className="text-sm font-semibold uppercase tracking-wide text-accent">Documentação técnica</p>
                  <h1 className="mt-2 text-2xl font-semibold sm:text-4xl">In House Bank</h1>
                  <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                    Referência do produto, stack, banco, pipeline e API HTTP. Esta área não aparece no menu da conta
                    logada.
                  </p>
                </header>
              ) : null}
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
