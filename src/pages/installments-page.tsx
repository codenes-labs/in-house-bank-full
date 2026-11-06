import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBank } from '../components/bank-context';
import { Card, EmptyState, money, SelectInput, StatusPill, TextInput } from '../components/ui';
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

export function InstallmentsPage() {
  const bank = useBank();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<(typeof filters)[number][0]>(InstallmentPlanListStatusFilter.All);
  const [month, setMonth] = useState('');
  const [sort, setSort] = useState<InstallmentPlanListSort>(InstallmentPlanListSort.NextDue);
  const today = todayCalendarDate();
  const rows = useMemo(() => {
    const built = buildInstallmentPlanListRows(
      bank.snapshot.installmentPlans,
      bank.snapshot.installments,
      today,
    );
    const filtered = filterInstallmentPlanListRows(
      built,
      { status, dueMonth: month || undefined, searchText: search },
      today,
    );
    return sortInstallmentPlanListRows(filtered, sort);
  }, [bank.snapshot.installmentPlans, bank.snapshot.installments, month, search, sort, status, today]);

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Parcelamentos</h1>
      <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem]">
        <TextInput value={search} placeholder="Buscar pagador ou referência" onChange={(event) => setSearch(event.target.value)} />
        <TextInput type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Mês de vencimento" />
        <SelectInput value={sort} onChange={(event) => setSort(event.target.value as InstallmentPlanListSort)} aria-label="Ordenação">
          <option value={InstallmentPlanListSort.NextDue}>Próximo vencimento</option>
          <option value={InstallmentPlanListSort.Amount}>Valor</option>
          <option value={InstallmentPlanListSort.CreatedAt}>Data de criação</option>
        </SelectInput>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`min-h-12 shrink-0 rounded-full px-4 font-semibold ${status === value ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nenhum parcelamento" text="Gere um carnê como visitante e salve na conta, ou ajuste os filtros." />
      ) : (
        <div className="grid gap-3">
          <div className="hidden grid-cols-5 gap-3 px-3 text-sm font-semibold text-muted-foreground lg:grid">
            <span>Pagador</span><span>Referência</span><span>Status</span><span>Retorno</span><span>Pagas</span>
          </div>
          {rows.map((row) => (
            <Link key={row.plan.id} to={`/parcelamentos/${row.plan.id}`}>
              <Card className="grid gap-2 lg:grid-cols-5 lg:items-center">
                <strong>{row.plan.borrowerName}</strong>
                <span>{row.plan.reference}</span>
                <StatusPill label={planStatusLabel(row.planStatus)} tone={toneForPlan(row.planStatus)} />
                <span>{money(row.plan.returnAmountCents)}</span>
                <span>{row.paidCount}/{row.installments.length}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
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
