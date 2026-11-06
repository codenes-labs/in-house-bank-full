import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useBank } from '../components/bank-context';
import { DueDateRangePicker } from '../components/due-date-range-picker';
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
import { planStatusLabel } from '../domain/installments/status-labels';
import { PlanStatus } from '../domain/enums/plan-status';

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
        <div className="grid gap-2">
          <div className="hidden grid-cols-[1.2fr_0.8fr_auto_auto_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Pagador</span>
            <span>Referência</span>
            <span>Status</span>
            <span>Retorno</span>
            <span>Pagas</span>
          </div>
          {rows.map((row) => (
            <Link key={row.plan.id} to={`/parcelamentos/${row.plan.id}`} className="block">
              <Card className="press grid gap-2 transition-colors hover:border-primary/30 lg:grid-cols-[1.2fr_0.8fr_auto_auto_auto] lg:items-center lg:gap-3">
                <div className="flex items-start justify-between gap-2 lg:contents">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.plan.borrowerName}</p>
                    <p className="text-sm text-muted-foreground lg:hidden">{row.plan.reference}</p>
                  </div>
                  <StatusPill label={planStatusLabel(row.planStatus)} tone={toneForPlan(row.planStatus)} />
                </div>
                <span className="hidden text-muted-foreground lg:block">{row.plan.reference}</span>
                <div className="flex items-baseline justify-between gap-3 lg:contents">
                  <span className="font-semibold tabular-nums">{money(row.plan.returnAmountCents)}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {row.paidCount}/{row.installments.length}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
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

function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('grid min-w-0 gap-1', className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
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
