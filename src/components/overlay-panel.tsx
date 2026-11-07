import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button, cx } from './ui';

export function OverlayPanel({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="overlay-panel-title">
      <button type="button" className="absolute inset-0 bg-foreground/30" aria-label="Fechar" onClick={onClose} />
      <div
        className={cx(
          'relative flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-[var(--shadow-card)] sm:max-w-xl',
          className,
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="overlay-panel-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button type="button" variant="ghost" className="min-h-10 min-w-10 px-2" aria-label="Fechar" onClick={onClose}>
            <X className="size-5" aria-hidden />
          </Button>
        </header>
        <div className="app-scroll scrollbar-hide min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
