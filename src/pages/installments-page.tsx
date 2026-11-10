import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useBank } from '../components/bank-context';
import { DueDateRangePicker } from '../components/due-date-range-picker';
import { FilterField } from '../components/filter-field';
import { Button, Card, cx, EmptyState, money, SelectInput, StatusPill, TextInput } from '../components/ui';
import type { InstallmentDueDateRange } from '../domain/installments/installment-due-date-range';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { buildInstallmentPlanListRows } from '../domain/installments/build-installment-plan-list-rows';
import {
  filterInstallmentPlanListRows,
  InstallmentPlanListStatusFilter,
} from '../domain/installments/installment-plan-list-filter';
import {
  InstallmentPlanListSort,
  sortInstallmentPlanListRows,
} from '../domain/installments/sort-installment-plan-list-rows';
import {
  formatCalendarDateBr,
  nextOpenInstallmentDueDate,
} from '../domain/installments/next-open-installment-due';
import { planStatusLabel } from '../domain/installments/status-labels';
import { PlanStatus } from '../domain/enums/plan-status';
import {
  clampPage,
  INSTALLMENT_PLAN_LIST_PAGE_SIZE,
  needsListPagination,
  sliceListPage,
  totalPages,
} from '../domain/pagination/list-page';

const filters = [
  [InstallmentPlanListStatusFilter.All, 'Todos'],
  [InstallmentPlanListStatusFilter.Overdue, 'Em atraso'],
  [InstallmentPlanListStatusFilter.Pending, 'Pendentes'],
  [InstallmentPlanListStatusFilter.Paid, 'Quitados'],
] as const;

const defaultSort = InstallmentPlanListSort.NextDue;
const defaultStatus = InstallmentPlanListStatusFilter.All;

export function InstallmentsPage() {
  const bank = useBank();
  const [searchParams] = useSearchParams();
  const initialStatus = parseStatusParam(searchParams.get('status'));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [dueDateRange, setDueDateRange] = useState<InstallmentDueDateRange | null>(null);
  const [sort, setSort] = useState<InstallmentPlanListSort>(defaultSort);
  const [page, setPage] = useState(1);
  const today = todayCalendarDate();
  const rows = useMemo(() => {
    const built = buildInstallmentPlanListRows(
      bank.snapshot.installmentPlans,
      bank.snapshot.installments,
      today,
    );
    const filtered = filterInstallmentPlanListRows(
      built,
      { status, dueDateRange: dueDateRange ?? undefined, searchText: search },
      today,
    );
    return sortInstallmentPlanListRows(filtered, sort);
  }, [bank.snapshot.installmentPlans, bank.snapshot.installments, dueDateRange, search, sort, status, today]);

  const paginate = needsListPagination(rows.length, INSTALLMENT_PLAN_LIST_PAGE_SIZE);
  const pageCount = totalPages(rows.length, INSTALLMENT_PLAN_LIST_PAGE_SIZE);
  const currentPage = clampPage(page, rows.length, INSTALLMENT_PLAN_LIST_PAGE_SIZE);
  const visibleRows = paginate
    ? sliceListPage(rows, currentPage, INSTALLMENT_PLAN_LIST_PAGE_SIZE)
    : rows;

  useEffect(() => {
    setPage(1);
  }, [dueDateRange, search, sort, status]);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const filtersActive =
    search.trim() !== '' ||
    dueDateRange !== null ||
    status !== defaultStatus ||
    sort !== defaultSort;

  function clearFilters() {
    setSearch('');
    setDueDateRange(null);
    setStatus(defaultStatus);
    setSort(defaultSort);
    setPage(1);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">Parcelamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length} resultado{rows.length === 1 ? '' : 's'}</p>
        </div>
        <Link
          to="/parcelamentos/novo"
          className="press inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground sm:w-auto"
        >
          <Plus className="size-5" aria-hidden />
          Novo parcelamento
        </Link>
      </div>

      <Card className="grid min-w-0 gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros
          </span>
          {filtersActive ? (
            <Button type="button" variant="ghost" className="min-h-10 px-3 text-sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
        <FilterField label="Buscar">
          <TextInput
            value={search}
            placeholder="Pagador ou referência"
            onChange={(event) => setSearch(event.target.value)}
          />
        </FilterField>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterField label="Vencimento">
            <DueDateRangePicker value={dueDateRange} onChange={setDueDateRange} placeholder="Dia ou período" />
          </FilterField>
          <FilterField label="Status">
            <SelectInput
              value={status}
              onChange={(event) => setStatus(event.target.value as InstallmentPlanListStatusFilter)}
            >
              {filters.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </FilterField>
          <FilterField label="Ordenar por" className="sm:col-span-2 lg:col-span-1">
            <SelectInput
              value={sort}
              onChange={(event) => setSort(event.target.value as InstallmentPlanListSort)}
            >
              <option value={InstallmentPlanListSort.NextDue}>Próximo vencimento</option>
              <option value={InstallmentPlanListSort.Amount}>Valor</option>
              <option value={InstallmentPlanListSort.CreatedAt}>Data de criação</option>
            </SelectInput>
          </FilterField>
        </div>
      </Card>

      {rows.length === 0 ? (
        <div className="grid gap-3">
          <EmptyState
            title="Nenhum parcelamento"
            text={
              filtersActive
                ? 'Nenhum resultado com esses filtros. Ajuste os filtros acima ou crie um novo parcelamento.'
                : 'Comece gerando um carnê e acompanhando as parcelas aqui.'
            }
          />
          {!filtersActive ? (
            <Link
              to="/parcelamentos/novo"
              className="press inline-flex min-h-12 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground"
            >
              Criar parcelamento
            </Link>
          ) : null}
        </div>
      ) : (
        <Card className="min-w-0 overflow-hidden p-0">
          <ul className="grid list-none gap-0 p-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_6.25rem_5.5rem_minmax(4.75rem,auto)_3.75rem] lg:gap-x-3">
            <li className="col-span-full hidden border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-subgrid lg:items-center">
              <span>Pagador</span>
              <span>Referência</span>
              <span className="text-center">Status</span>
              <span className="text-center">Próx. venc.</span>
              <span className="text-end">Retorno</span>
              <span className="text-end">Pagas</span>
            </li>
            {visibleRows.map((row) => {
              const nextDue = nextOpenInstallmentDueDate(row.installments);
              const nextDueLabel = nextDue ? formatCalendarDateBr(nextDue) : '—';
              return (
                <li
                  key={row.plan.id}
                  className={cx(
                    'press col-span-full border-b border-border px-4 py-3 transition-colors',
                    !paginate && 'last:border-b-0',
                    'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5',
                    'hover:bg-muted/40 lg:grid-cols-subgrid lg:grid-rows-1 lg:items-center lg:gap-y-0 lg:hover:bg-muted/50',
                  )}
                >
                  <Link to={`/parcelamentos/${row.plan.id}`} className="contents">
                    <span className="min-w-0 truncate font-semibold max-lg:col-start-1 max-lg:row-start-1">
                      {row.plan.borrowerName}
                    </span>
                    <span className="min-w-0 truncate text-sm text-muted-foreground max-lg:col-span-2 max-lg:col-start-1 max-lg:row-start-2">
                      {row.plan.reference}
                    </span>
                    <span className="flex shrink-0 justify-end max-lg:col-start-2 max-lg:row-start-1 max-lg:justify-self-end lg:justify-center">
                      <StatusPill label={planStatusLabel(row.planStatus)} tone={toneForPlan(row.planStatus)} />
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums max-lg:col-start-1 max-lg:row-start-3 lg:text-center">
                      {nextDueLabel}
                    </span>
                    <span className="font-semibold tabular-nums max-lg:col-start-1 max-lg:row-start-4 lg:text-end">
                      {money(row.plan.returnAmountCents)}
                    </span>
                    <span className="text-end text-sm text-muted-foreground tabular-nums max-lg:col-start-2 max-lg:row-start-4 max-lg:self-center">
                      {row.paidCount}/{row.installments.length}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {paginate ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <Button
                type="button"
                variant="soft"
                className="min-h-10"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Anterior
              </Button>
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {pageCount}
              </p>
              <Button
                type="button"
                variant="soft"
                className="min-h-10"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              >
                Próxima
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

function parseStatusParam(raw: string | null): (typeof filters)[number][0] {
  if (raw === 'atraso' || raw === 'overdue') {
    return InstallmentPlanListStatusFilter.Overdue;
  }
  if (raw === 'pendentes' || raw === 'pending') {
    return InstallmentPlanListStatusFilter.Pending;
  }
  if (raw === 'quitados' || raw === 'paid') {
    return InstallmentPlanListStatusFilter.Paid;
  }
  return defaultStatus;
}

function toneForPlan(status: PlanStatus): 'paid' | 'overdue' | 'pending' {
  if (status === PlanStatus.Settled) {
    return 'paid';
  }
  if (status === PlanStatus.Overdue) {
    return 'overdue';
  }
  return 'pending';
}
