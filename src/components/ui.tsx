import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { formatCentsAsBrl } from '../domain/money/brl-input';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-semibold', light ? 'text-primary-foreground' : 'text-primary')}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground" aria-hidden>
        IH
      </span>
      In House Bank
    </span>
  );
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
}) {
  return (
    <button
      className={cx(
        'press inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'soft' && 'bg-brand-soft text-secondary-foreground',
        variant === 'ghost' && 'bg-transparent text-primary',
        variant === 'danger' && 'bg-destructive text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-xl border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow-card)]', className)}>
      {children}
    </section>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
      {error ? <span className="text-sm font-normal text-destructive">{error}</span> : null}
    </label>
  );
}

const controlClass =
  'min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, props.className)} {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(controlClass, props.className)} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlClass, 'min-h-28 py-3', props.className)} {...props} />;
}

export function StatusPill({ label, tone }: { label: string; tone: 'pending' | 'paid' | 'overdue' | 'neutral' }) {
  return (
    <span
      className={cx(
        'inline-flex min-h-8 items-center rounded-full px-3 text-sm font-semibold',
        tone === 'pending' && 'bg-warning-soft text-status-pending',
        tone === 'paid' && 'bg-success-soft text-status-paid',
        tone === 'overdue' && 'bg-danger-soft text-status-overdue',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-muted-foreground">{text}</p>
    </div>
  );
}

export function money(cents: number): string {
  return `R$ ${formatCentsAsBrl(cents)}`;
}
