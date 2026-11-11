import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CalendarDate } from '../domain/models/calendar-date';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import { cx, money } from './ui';

export type MovementFlow = 'in' | 'out';

function flowTone(flow: MovementFlow) {
  return flow === 'in'
    ? {
        icon: 'bg-primary/12 text-primary',
        label: 'font-medium text-primary',
        amount: 'text-primary',
      }
    : {
        icon: 'bg-destructive/12 text-destructive',
        label: 'font-medium text-destructive',
        amount: 'text-destructive',
      };
}

export function ledgerDirectionToFlow(direction: LedgerDirection): MovementFlow {
  return direction === LedgerDirection.In ? 'in' : 'out';
}

export function defaultFlowLabel(flow: MovementFlow): string {
  return flow === 'in' ? 'Entrada' : 'Saída';
}

export function FinanceMovementList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cx('grid min-w-0 gap-1.5', className)}>{children}</ul>;
}

export function FinanceMovementRow({
  title,
  date,
  flow,
  amountCents,
  flowLabel,
  className,
}: {
  title: string;
  date: CalendarDate;
  flow: MovementFlow;
  amountCents: number;
  flowLabel?: string;
  className?: string;
}) {
  const tone = flowTone(flow);
  const label = flowLabel ?? defaultFlowLabel(flow);
  const isIn = flow === 'in';
  const formattedDate = formatCalendarDateBr(date);

  return (
    <div
      className={cx(
        'grid w-full min-w-0 max-w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 sm:gap-3',
        className,
      )}
    >
      <span
        className={cx('flex size-9 shrink-0 items-center justify-center rounded-full', tone.icon)}
        aria-hidden
      >
        {isIn ? (
          <ArrowDownLeft className="size-4" strokeWidth={2.25} />
        ) : (
          <ArrowUpRight className="size-4" strokeWidth={2.25} />
        )}
      </span>
      <div className="min-w-0 overflow-hidden">
        <p className="truncate text-sm font-medium leading-snug text-foreground" title={title}>
          {title}
        </p>
        <p className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground">
          {formattedDate}
          <span className="mx-1.5 opacity-50">·</span>
          <span className={tone.label}>{label}</span>
        </p>
      </div>
      <p className={cx('shrink-0 text-right text-sm font-semibold tabular-nums sm:text-base', tone.amount)}>
        {isIn ? '+' : '−'}
        {money(amountCents)}
      </p>
    </div>
  );
}
