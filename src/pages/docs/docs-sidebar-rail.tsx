import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../components/ui';

/** Reserva coluna no grid e fixa o conteúdo abaixo do cabeçalho (sticky quebrava com overflow dos ancestrais). */
export function DocsSidebarRail({ children }: { children: ReactNode }) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState<number | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const sync = () => {
      setLeft(anchor.getBoundingClientRect().left);
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(anchor);
    if (anchor.parentElement) {
      observer.observe(anchor.parentElement);
    }

    window.addEventListener('resize', sync, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  return (
    <div ref={anchorRef} className="hidden w-[17rem] shrink-0 lg:block">
      <aside
        className={cx(
          'z-10 w-[17rem] max-w-[17rem] lg:fixed lg:max-h-[calc(100dvh-var(--docs-sticky-top,5rem))] lg:overflow-y-auto lg:overscroll-y-contain lg:pr-2',
          left === null && 'lg:invisible',
        )}
        style={{
          top: 'var(--docs-sticky-top, 5rem)',
          ...(left !== null ? { left: `${left}px` } : {}),
        }}
      >
        {children}
      </aside>
    </div>
  );
}