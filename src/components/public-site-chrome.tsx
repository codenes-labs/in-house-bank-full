import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { ThemeMode } from '../domain/theme/theme-mode';
import { DocsHeaderSearchField, useDocsSearchOptional } from '../pages/docs/docs-search-context';
import { DocsMobileMenu } from '../pages/docs/docs-mobile-menu';
import { useTheme } from './theme';
import { PUBLIC_FOOTER_TAGLINE } from '../domain/navigation/public-site-copy';
import { CookiePreferencesLink } from './cookie-preferences-link';
import { PublicToolsFooterNav } from './public-tools-footer-nav';
import { BrandMark, cx, Logo } from './ui';

function DocsHeaderActions({
  themeLabel,
  mode,
  toggle,
  className,
  compact,
}: {
  themeLabel: string;
  mode: ThemeMode;
  toggle: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cx('flex shrink-0 items-center gap-0.5 sm:gap-2', className)}>
      <button
        type="button"
        className={cx(
          'press inline-flex items-center justify-center rounded-lg text-muted-foreground',
          compact ? 'size-10' : 'size-12',
        )}
        onClick={toggle}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {mode === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      </button>
      <Link
        to="/entrar"
        className={cx(
          'inline-flex items-center rounded-lg bg-primary font-semibold text-primary-foreground',
          compact ? 'min-h-10 px-3.5 text-sm' : 'min-h-12 px-5',
        )}
      >
        Entrar
      </Link>
    </div>
  );
}

const LANDING_NAV_LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Funcionalidades' },
  { href: '#para-quem', label: 'Para quem é' },
] as const;

function LandingSectionNav() {
  return (
    <nav
      className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"
      aria-label="Seções da página inicial"
    >
      {LANDING_NAV_LINKS.map((item) => (
        <a key={item.href} href={item.href} className="transition-colors hover:text-primary">
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function PublicSiteHeader({
  inDocs,
  inLanding,
  docsSearch,
  themeLabel,
  mode,
  toggle,
}: {
  inDocs: boolean;
  inLanding: boolean;
  docsSearch: ReturnType<typeof useDocsSearchOptional>;
  themeLabel: string;
  mode: ThemeMode;
  toggle: () => void;
}) {
  if (inDocs) {
    return (
      <header className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-3">
        <div className="flex w-full min-w-0 items-center gap-0.5 sm:w-auto sm:gap-1">
          <DocsMobileMenu />
          <Link
            to="/docs"
            className="inline-flex min-w-0 flex-1 items-center gap-1.5 font-semibold text-primary sm:flex-initial"
            aria-label="In House Bank — documentação"
          >
            <BrandMark />
            <span className="flex min-w-0 items-baseline whitespace-nowrap text-base">
              <span className="hidden truncate sm:inline">In House Bank</span>
              <span>
                <span className="hidden sm:inline" aria-hidden="true">
                  {' '}
                  /{' '}
                </span>
                Docs
              </span>
            </span>
          </Link>
          <DocsHeaderActions
            themeLabel={themeLabel}
            mode={mode}
            toggle={toggle}
            compact
            className="sm:hidden"
          />
        </div>
        {docsSearch ? (
          <DocsHeaderSearchField className="w-full min-w-0 sm:max-w-xs sm:flex-1 md:max-w-sm lg:max-w-md" />
        ) : null}
        <DocsHeaderActions
          themeLabel={themeLabel}
          mode={mode}
          toggle={toggle}
          className="ml-auto hidden sm:flex"
        />
      </header>
    );
  }

  return (
    <header
      className={cx(
        'shrink-0 gap-2 sm:gap-3',
        inLanding
          ? 'flex h-full w-full min-w-0 items-center justify-between gap-3'
          : 'flex w-full min-w-0 items-center justify-between gap-2',
      )}
    >
      <Link to="/" className="inline-flex min-w-0 max-w-full items-center" aria-label="In House Bank">
        <Logo />
      </Link>
      {inLanding ? <LandingSectionNav /> : null}
      <DocsHeaderActions themeLabel={themeLabel} mode={mode} toggle={toggle} className="shrink-0" />
    </header>
  );
}

export function PublicSiteChrome({
  children,
  section,
}: {
  children: ReactNode;
  /** `landing`: âncoras no topo; `marketing`: cabeçalho fixo igual à home, sem âncoras (ferramentas). */
  section?: 'docs' | 'landing' | 'marketing';
}) {
  const { mode, toggle } = useTheme();
  const themeLabel = mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  const inDocs = section === 'docs';
  const inLanding = section === 'landing';
  const inMarketingShell = inLanding || section === 'marketing';
  const docsSearch = useDocsSearchOptional();

  if (inMarketingShell) {
    return (
      <div className="flex min-h-dvh min-w-0 flex-col">
        <div className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <PublicSiteHeader
              inDocs={false}
              inLanding={inLanding}
              docsSearch={docsSearch}
              themeLabel={themeLabel}
              mode={mode}
              toggle={toggle}
            />
          </div>
        </div>
        <main
          className={cx(
            'min-w-0 flex-1',
            section === 'marketing' && 'mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8',
          )}
        >
          {children}
        </main>
        <div className="mx-auto w-full max-w-6xl shrink-0 px-4 pb-8 sm:px-6">
          <PublicSiteFooter />
        </div>
      </div>
    );
  }

  if (inDocs) {
    return (
      <div className="flex min-h-dvh min-w-0 flex-col">
        <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-2 sm:px-6 sm:py-3">
            <PublicSiteHeader
              inDocs
              inLanding={false}
              docsSearch={docsSearch}
              themeLabel={themeLabel}
              mode={mode}
              toggle={toggle}
            />
          </div>
        </div>
        <main className="docs-public-chrome mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6">
          {children}
        </main>
        <div className="mx-auto w-full max-w-6xl shrink-0 px-4 pb-8 sm:px-6">
          <PublicSiteFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full min-w-0 max-w-6xl px-4 py-5">
      <PublicSiteHeader
        inDocs={false}
        inLanding={false}
        docsSearch={docsSearch}
        themeLabel={themeLabel}
        mode={mode}
        toggle={toggle}
      />
      {children}
      <PublicSiteFooter />
    </div>
  );
}

export function PublicSiteFooter() {
  return (
    <footer
      id="ferramentas"
      className={cx(
        'mt-10 shrink-0 scroll-mt-24 border-t border-border pt-8 text-sm text-muted-foreground',
      )}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 shrink-0 space-y-1 lg:max-w-xl">
          <p className="text-base font-semibold text-foreground">In House Bank</p>
          <p className="text-pretty lg:whitespace-nowrap">{PUBLIC_FOOTER_TAGLINE}</p>
        </div>
        <div className="flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-8 lg:shrink-0 lg:gap-x-12">
          <PublicToolsFooterNav />
          <nav className="flex flex-col gap-1.5" aria-label="Links institucionais">
            <p className="mb-0.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Institucional</p>
            <Link to="/" className="font-semibold text-primary hover:underline">
              Início
            </Link>
            <Link to="/lista-espera" className="font-semibold text-primary hover:underline">
              Lista de espera
            </Link>
            <Link to="/docs" className="font-semibold text-primary hover:underline">
              Documentação
            </Link>
          </nav>
          <nav className="flex flex-col gap-1.5" aria-label="Links legais">
            <p className="mb-0.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">Legal</p>
            <Link to="/termos" className="font-semibold text-primary hover:underline">
              Termos de uso
            </Link>
            <Link to="/privacidade" className="font-semibold text-primary hover:underline">
              Privacidade
            </Link>
            <CookiePreferencesLink />
          </nav>
        </div>
      </div>
    </footer>
  );
}
