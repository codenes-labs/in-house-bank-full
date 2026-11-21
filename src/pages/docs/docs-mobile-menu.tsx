import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { OverlayPanel } from '../../components/overlay-panel';
import { cx } from '../../components/ui';
import { DOCS_NAV } from './docs-nav';

export function DocsMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('docs-mobile-nav-open');
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.classList.remove('docs-mobile-nav-open');
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="press inline-flex size-12 items-center justify-center rounded-lg text-muted-foreground lg:hidden"
        aria-label="Abrir sumário"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <OverlayPanel
        open={open}
        title="Sumário"
        layer="modal"
        onClose={() => setOpen(false)}
        className="w-full max-w-full border-l-0 sm:max-w-sm sm:border-l"
      >
        <nav aria-label="Seções da documentação">
          <ul className="grid gap-0.5">
            {DOCS_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/docs'}
                  className={({ isActive }) =>
                    cx(
                      'block rounded-lg border-l-2 py-2.5 pl-3.5 pr-2 text-sm font-semibold',
                      isActive
                        ? 'border-primary bg-brand-soft text-primary'
                        : 'border-transparent text-foreground hover:border-border hover:bg-muted',
                    )
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </OverlayPanel>
    </>
  );
}
