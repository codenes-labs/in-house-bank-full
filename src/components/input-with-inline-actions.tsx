import { KeyRound, Loader2, RefreshCw, Save } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { cx } from './ui';

export function InputWithInlineActions({
  value,
  onChange,
  onGenerate,
  submitLabel,
  submitDisabled,
  submitting,
  showSubmit = true,
  showGenerate = true,
  trailingAction,
  generateTitle = 'Gerar automaticamente',
  className,
  ...inputProps
}: {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitting?: boolean;
  showSubmit?: boolean;
  showGenerate?: boolean;
  trailingAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: 'key' | 'none';
  };
  generateTitle?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'>) {
  return (
    <div
      className={cx(
        'flex min-h-12 w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25',
        className,
      )}
    >
      <input
        className={cx(
          'min-h-12 min-w-0 flex-1 border-0 bg-transparent px-4 text-base text-foreground outline-none',
          inputProps.readOnly && 'font-mono tracking-wide',
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
      {showGenerate ? (
        <button
          type="button"
          className="press inline-flex w-12 shrink-0 items-center justify-center border-l border-border text-muted-foreground hover:bg-muted/60"
          onClick={onGenerate}
          aria-label={generateTitle}
          title={generateTitle}
        >
          <RefreshCw className="size-5 shrink-0" aria-hidden />
        </button>
      ) : null}
      {trailingAction ? (
        <button
          type="button"
          disabled={trailingAction.disabled}
          className="press inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border-l border-border bg-primary px-4 text-base font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          onClick={trailingAction.onClick}
        >
          {trailingAction.icon !== 'none' ? (
            <KeyRound className="size-4 shrink-0" aria-hidden />
          ) : null}
          <span className="truncate">{trailingAction.label}</span>
        </button>
      ) : null}
      {showSubmit ? (
        <button
          type="submit"
          disabled={submitDisabled}
          className="press inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border-l border-border bg-primary px-4 text-base font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4 shrink-0" aria-hidden />
          )}
          <span className="truncate">{submitting ? 'Salvando…' : (submitLabel ?? 'Salvar')}</span>
        </button>
      ) : null}
    </div>
  );
}