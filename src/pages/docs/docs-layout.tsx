import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicSiteChrome } from '../../components/public-site-chrome';
import { DocsSearchProvider } from './docs-search-context';
import { DocsSidebarNav } from './docs-side-nav';

function DocsLayoutBody() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('docs-public-scroll');
    return () => document.documentElement.classList.remove('docs-public-scroll');
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <PublicSiteChrome section="docs">
      <section className="mt-6 lg:mt-8">
        <div className="mb-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-14">
          <aside className="mb-6 hidden min-w-0 lg:sticky lg:top-4 lg:block lg:mb-0 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:pr-2">
            <DocsSidebarNav />
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
