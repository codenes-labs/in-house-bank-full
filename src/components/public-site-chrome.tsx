import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../domain/theme/theme-mode';
import { DocsHeaderSearchField, useDocsSearchOptional } from '../pages/docs/docs-search-context';
import { DocsMobileMenu } from '../pages/docs/docs-mobile-menu';
import { useTheme } from './theme';
import { cx, Logo } from './ui';

function DocsHeaderActions({
  inDocs,
  themeLabel,
  mode,
  toggle,
  className,
}: {
  inDocs: boolean;
  themeLabel: string;
  mode: ThemeMode;
  toggle: () => void;
  className?: string;
}) {
  return (
    <div className={cx('flex shrink-0 items-center gap-1 sm:gap-2', className)}>
      <button
        type="button"
        className="press inline-flex size-12 items-center justify-center rounded-lg text-muted-foreground"
        onClick={toggle}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {mode === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      </button>
      <Link
        to="/entrar"
        className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
      >
        Entrar
      </Link>
    </div>
  );
}

function PublicSiteHeader({
  inDocs,
  docsSearch,
  themeLabel,
  mode,
  toggle,
}: {
  inDocs: boolean;
  docsSearch: ReturnType<typeof useDocsSearchOptional>;
  themeLabel: string;
  mode: ThemeMode;
  toggle: () => void;
}) {
  return (
    <header
      className={cx(
        'shrink-0 gap-2 sm:gap-3',
        inDocs ? 'grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center' : 'flex flex-wrap items-center',
      )}
    >
      <div
        className={cx(
          'flex min-w-0 items-center',
          inDocs ? 'w-full justify-between gap-2 sm:w-auto sm:justify-start' : 'shrink-0 gap-0',
        )}
      >
        <div className="inline-flex min-w-0 items-center gap-1">
          {inDocs ? <DocsMobileMenu /> : null}
          {inDocs ? (
            <Link to="/docs" className="inline-flex min-w-0 shrink items-center gap-0">
              <Logo />
              <span className="truncate text-base font-semibold text-primary">
                <span aria-hidden="true"> / </span>
                Docs
              </span>
            </Link>
          ) : (
            <Link to="/" className="min-w-0 shrink">
              <Logo />
            </Link>
          )}
        </div>
        {inDocs ? (
          <DocsHeaderActions
            inDocs={inDocs}
            themeLabel={themeLabel}
            mode={mode}
            toggle={toggle}
            className="sm:hidden"
          />
        ) : null}
      </div>
      {inDocs && docsSearch ? (
        <DocsHeaderSearchField className="w-full min-w-0 sm:max-w-xs sm:flex-1 md:max-w-sm lg:max-w-md" />
      ) : null}
      {inDocs ? (
        <DocsHeaderActions
          inDocs={inDocs}
          themeLabel={themeLabel}
          mode={mode}
          toggle={toggle}
          className="ml-auto hidden sm:flex"
        />
      ) : (
        <DocsHeaderActions
          inDocs={inDocs}
          themeLabel={themeLabel}
          mode={mode}
          toggle={toggle}
          className="ml-auto"
        />
      )}
    </header>
  );
}

export function PublicSiteChrome({
  children,
  section,
}: {
  children: ReactNode;
  section?: 'docs';
}) {
  const { mode, toggle } = useTheme();
  const themeLabel = mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  const inDocs = section === 'docs';
  const docsSearch = useDocsSearchOptional();

  return (
    <div className={`mx-auto min-h-dvh max-w-6xl px-4 ${inDocs ? 'docs-public-chrome pb-5' : 'py-5'}`}>
      {inDocs ? (
        <>
          <div className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background shadow-sm">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <PublicSiteHeader
                inDocs={inDocs}
                docsSearch={docsSearch}
                themeLabel={themeLabel}
                mode={mode}
                toggle={toggle}
              />
            </div>
          </div>
          <div className="h-[7.5rem] shrink-0 sm:h-[4.75rem] lg:h-[4.75rem]" aria-hidden />
        </>
      ) : (
        <PublicSiteHeader
          inDocs={inDocs}
          docsSearch={docsSearch}
          themeLabel={themeLabel}
          mode={mode}
          toggle={toggle}
        />
      )}
      {children}
      {!inDocs ? <PublicSiteFooter /> : null}
    </div>
  );
}

export function PublicSiteFooter() {
  return (
    <footer className="mt-12 shrink-0 border-t border-border pt-8 text-sm text-muted-foreground">
      <p>In House Bank. Só controle financeiro — não movimenta dinheiro e não é meio de pagamento.</p>
      <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Links institucionais">
        <Link to="/termos" className="font-semibold text-primary">
          Termos de uso
        </Link>
        <Link to="/privacidade" className="font-semibold text-primary">
          Privacidade
        </Link>
        <Link to="/docs" className="font-semibold text-primary">
          Documentação
        </Link>
      </nav>
    </footer>
  );
}
