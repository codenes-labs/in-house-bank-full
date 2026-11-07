import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { DocsHeaderSearchField, useDocsSearchOptional } from '../pages/docs/docs-search-context';
import { useTheme } from './theme';
import { Logo } from './ui';

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
  const docsHeaderChrome =
    'sticky top-0 z-30 -mx-4 border-b border-border bg-background px-4 py-3 shadow-sm';

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-5">
      <div className={inDocs ? docsHeaderChrome : undefined}>
        <header className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex min-w-0 shrink-0 items-center gap-0">
            <Link to="/" className="min-w-0 shrink">
              <Logo />
            </Link>
            {inDocs ? (
              <span className="truncate text-base font-semibold text-primary">
                <span aria-hidden="true"> / </span>
                Docs
              </span>
            ) : null}
          </div>
          {inDocs && docsSearch ? (
            <DocsHeaderSearchField className="min-w-0 basis-full sm:basis-0 sm:flex-1 sm:max-w-xs md:max-w-sm lg:max-w-md" />
          ) : null}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="press inline-flex size-12 items-center justify-center rounded-lg text-muted-foreground"
            onClick={toggle}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {mode === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
          </button>
          {inDocs ? (
            <Link
              to="/"
              className="hidden min-h-12 items-center rounded-lg border border-border px-4 text-sm font-semibold text-primary sm:inline-flex"
            >
              Página inicial
            </Link>
          ) : null}
          <Link
            to="/entrar"
            className="inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
          >
            Entrar
          </Link>
          </div>
        </header>
      </div>
      {children}
      <PublicSiteFooter inDocs={inDocs} />
    </div>
  );
}

export function PublicSiteFooter({ inDocs = false }: { inDocs?: boolean }) {
  return (
    <footer className="mt-12 shrink-0 border-t border-border pt-8 text-sm text-muted-foreground">
      <p>In House Bank. Só controle financeiro — não movimenta dinheiro e não é meio de pagamento.</p>
      {inDocs ? null : (
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Links institucionais">
          <Link to="/" className="font-semibold text-primary">
            Página inicial
          </Link>
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
      )}
    </footer>
  );
}
