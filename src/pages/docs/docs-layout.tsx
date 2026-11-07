import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicSiteChrome } from '../../components/public-site-chrome';
import { DocsSearchProvider } from './docs-search-context';
import { DocsSidebarNav } from './docs-side-nav';

function DocsLayoutBody() {
  useEffect(() => {
    document.documentElement.classList.add('docs-public-scroll');
    return () => document.documentElement.classList.remove('docs-public-scroll');
  }, []);

  return (
    <PublicSiteChrome section="docs">
      <section className="mt-6 lg:mt-8">
        <div className="mb-6">
          <aside className="mb-6 hidden min-w-0 bg-background pt-1 lg:fixed lg:top-[4.75rem] lg:left-[max(1rem,calc((100vw-72rem)/2+1rem))] lg:z-20 lg:block lg:mb-0 lg:w-[17rem] lg:max-h-[calc(100dvh-4.75rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:pt-4 lg:pr-2">
            <DocsSidebarNav />
          </aside>
          <div className="min-w-0 lg:ml-[calc(17rem+2.5rem)] xl:ml-[calc(17rem+3.5rem)]">
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
