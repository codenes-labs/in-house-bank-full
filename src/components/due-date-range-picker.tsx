import { useEffect, useId, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addCalendarMonths,
  parseCalendarDate,
} from '../domain/calendar/calendar-date-parts';
import { buildCalendarMonthGrid, calendarMonthTitle } from '../domain/calendar/build-calendar-month-grid';
import { compareCalendarDates } from '../domain/calendar/compare-calendar-dates';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import type { CalendarDate } from '../domain/models/calendar-date';
import {
  formatInstallmentDueDateRangeLabel,
  normalizeInstallmentDueDateRange,
  type InstallmentDueDateRange,
} from '../domain/installments/installment-due-date-range';
import { Button, cx } from './ui';

const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function DueDateRangePicker({
  value,
  onChange,
  placeholder = 'Selecione o período',
  ariaLabel = 'Período de vencimento',
}: {
  value: InstallmentDueDateRange | null;
  onChange: (value: InstallmentDueDateRange | null) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => monthViewFrom(value?.from ?? todayCalendarDate()));
  const [anchor, setAnchor] = useState<CalendarDate | null>(null);
  const [hoverDate, setHoverDate] = useState<CalendarDate | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setAnchor(null);
        setHoverDate(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setAnchor(null);
        setHoverDate(null);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (value?.from) {
      setView(monthViewFrom(value.from));
    }
  }, [value?.from]);

  const grid = buildCalendarMonthGrid(view.year, view.month);
  const label = formatInstallmentDueDateRangeLabel(value);

  function pickDay(date: CalendarDate) {
    if (!anchor) {
      setAnchor(date);
      setHoverDate(null);
      return;
    }
    const next = normalizeInstallmentDueDateRange(anchor, date);
    onChange(next);
    setAnchor(null);
    setHoverDate(null);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setAnchor(null);
    setHoverDate(null);
    setOpen(false);
  }

  function selectToday() {
    const today = todayCalendarDate();
    onChange({ from: today, to: today });
    setAnchor(null);
    setHoverDate(null);
    setView(monthViewFrom(today));
    setOpen(false);
  }

  function closePopover() {
    setOpen(false);
    setAnchor(null);
    setHoverDate(null);
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        className={cx(
          'field-control flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 text-left text-base outline-none transition-[box-shadow,border-color] focus:border-ring focus:ring-2 focus:ring-ring/25',
          !label && 'text-muted-foreground',
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{label || placeholder}</span>
        <Calendar className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 bg-foreground/20 sm:hidden"
            aria-label="Fechar calendário"
            onClick={closePopover}
          />
          <div
            id={listboxId}
            role="dialog"
            aria-label={ariaLabel}
            className={cx(
              'z-30 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]',
              'max-sm:fixed max-sm:top-1/2 max-sm:left-4 max-sm:right-4 max-sm:max-h-[min(85dvh,calc(100dvh-6rem))] max-sm:-translate-y-1/2 max-sm:overflow-y-auto',
              'sm:absolute sm:top-[calc(100%+0.5rem)] sm:left-0 sm:w-full sm:max-w-[20rem]',
            )}
          >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="press inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Mês anterior"
              onClick={() => setView((current) => shiftMonthView(current, -1))}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <p className="text-sm font-semibold capitalize">{calendarMonthTitle(view.year, view.month)}</p>
            <button
              type="button"
              className="press inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label="Próximo mês"
              onClick={() => setView((current) => shiftMonthView(current, 1))}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            {weekdayLabels.map((day, index) => (
              <span key={`${day}-${index}`} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div
            className="mt-1 grid grid-cols-7 gap-1"
            onMouseLeave={() => {
              if (anchor) {
                setHoverDate(null);
              }
            }}
          >
            {grid.map((cell) => {
              const visuals = dayCellVisuals(cell.date, value, anchor, hoverDate);
              return (
                <button
                  key={cell.date}
                  type="button"
                  className={cx(
                    'press grid min-h-9 place-items-center rounded-lg text-sm',
                    !cell.inCurrentMonth && 'text-muted-foreground/70',
                    visuals.inRange && 'bg-brand-soft text-primary',
                    visuals.endpoint && 'bg-primary font-semibold text-primary-foreground',
                    visuals.pendingStart &&
                      'bg-brand-soft font-semibold text-primary ring-2 ring-primary ring-inset',
                  )}
                  onClick={() => pickDay(cell.date)}
                  onMouseEnter={() => {
                    if (anchor) {
                      setHoverDate(cell.date);
                    }
                  }}
                  onDoubleClick={(event) => {
                    event.preventDefault();
                    onChange({ from: cell.date, to: cell.date });
                    setAnchor(null);
                    setHoverDate(null);
                    setOpen(false);
                  }}
                >
                  {parseCalendarDate(cell.date).day}
                </button>
              );
            })}
          </div>

          {anchor ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Escolha o fim do período ou o mesmo dia para filtrar só esse vencimento.
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
            <Button type="button" variant="ghost" className="min-h-10 px-2 text-sm" onClick={clear}>
              Limpar
            </Button>
            <Button type="button" variant="ghost" className="min-h-10 px-2 text-sm" onClick={selectToday}>
              Hoje
            </Button>
          </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function monthViewFrom(date: CalendarDate): { year: number; month: number } {
  const parts = parseCalendarDate(date);
  return { year: parts.year, month: parts.month };
}

function shiftMonthView(view: { year: number; month: number }, delta: number): { year: number; month: number } {
  const shifted = addCalendarMonths({ year: view.year, month: view.month, day: 1 }, delta);
  return { year: shifted.year, month: shifted.month };
}

type DayCellVisuals = {
  pendingStart: boolean;
  endpoint: boolean;
  inRange: boolean;
};

function activeRange(
  value: InstallmentDueDateRange | null,
  anchor: CalendarDate | null,
  hoverDate: CalendarDate | null,
): InstallmentDueDateRange | null {
  if (anchor) {
    const end = hoverDate ?? anchor;
    return normalizeInstallmentDueDateRange(anchor, end);
  }
  return value;
}

function dayCellVisuals(
  date: CalendarDate,
  value: InstallmentDueDateRange | null,
  anchor: CalendarDate | null,
  hoverDate: CalendarDate | null,
): DayCellVisuals {
  const range = activeRange(value, anchor, hoverDate);
  if (!range) {
    return { pendingStart: false, endpoint: false, inRange: false };
  }

  const isEndpoint = date === range.from || date === range.to;
  const pendingStart = Boolean(anchor && !hoverDate && date === anchor);
  const selectingWithPreview = Boolean(anchor && hoverDate);

  if (pendingStart) {
    return { pendingStart: true, endpoint: false, inRange: false };
  }

  if (selectingWithPreview) {
    const inRangeMiddle =
      range.from !== range.to &&
      compareCalendarDates(date, range.from) > 0 &&
      compareCalendarDates(date, range.to) < 0;
    return {
      pendingStart: false,
      endpoint: isEndpoint,
      inRange: inRangeMiddle,
    };
  }

  if (anchor) {
    return { pendingStart: false, endpoint: false, inRange: false };
  }

  if (range.from === range.to) {
    return { pendingStart: false, endpoint: date === range.from, inRange: false };
  }

  const inRangeMiddle =
    compareCalendarDates(date, range.from) > 0 && compareCalendarDates(date, range.to) < 0;
  return {
    pendingStart: false,
    endpoint: isEndpoint,
    inRange: inRangeMiddle,
  };
}
