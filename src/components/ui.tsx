import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { formatCentsAsBrl } from '../domain/money/brl-input';

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      className={cx('size-8 shrink-0 rounded-full', className)}
      width={32}
      height={32}
      decoding="async"
    />
  );
}

export function Logo({
  className,
  compactBelowSm = false,
}: {
  className?: string;
  compactBelowSm?: boolean;
}) {
  return (
    <span className={cx('inline-flex min-w-0 max-w-full items-center gap-2 font-semibold text-primary', className)}>
      <BrandMark />
      <span className={cx('truncate', compactBelowSm && 'hidden sm:inline')}>In House Bank</span>
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
    <section className={cx('min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow-card)]', className)}>
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
  'field-control min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none transition-[box-shadow,border-color] focus:border-ring focus:ring-2 focus:ring-ring/25';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, className)} {...props} />;
}

export function MonthInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className="relative min-w-0">
      <input type="month" className={cx(controlClass, 'field-control-month relative min-w-0 pr-11', className)} {...props} />
      <Calendar className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative min-w-0">
      <select className={cx(controlClass, 'appearance-none pr-11', className)} {...props} />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlClass, 'min-h-28 py-3', props.className)} {...props} />;
}

/** Textarea arredondado para textos longos (carnê / mensagens), alinhado aos demais controles. */
export function SoftTextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(controlClass, 'min-h-28 resize-none rounded-2xl py-3', className)}
      {...props}
    />
  );
}

export function StatusPill({
  label,
  tone,
  className,
}: {
  label: string;
  tone: 'pending' | 'paid' | 'overdue' | 'neutral';
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 text-sm font-semibold whitespace-nowrap',
        tone === 'pending' && 'bg-warning-soft text-status-pending',
        tone === 'paid' && 'bg-success-soft text-status-paid',
        tone === 'overdue' && 'bg-danger-soft text-status-overdue',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        className,
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
