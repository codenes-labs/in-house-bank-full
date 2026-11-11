import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useBank } from '../components/bank-context';
import { SaveActionButton } from '../components/standard-action-buttons';
import { Card, EmptyState, StatusPill, cx } from '../components/ui';
import { installmentStatusLabel } from '../domain/installments/status-labels';
import { computeDashboardMetrics } from '../domain/dashboard/compute-dashboard-metrics';
import {
  formatDashboardBrl,
  formatDashboardCount,
} from '../domain/dashboard/dashboard-values-visibility';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { deriveInstallmentStatus } from '../domain/installments/derive-installment-status';
import { formatInstallmentOrdinalPt } from '../domain/installments/format-installment-ordinal-pt';
import { InstallmentStatus } from '../domain/enums/installment-status';
import { readPendingBundle, writePendingBundle } from '../lib/guest-draft';
import { formatCalendarMonthKeyBr } from '../domain/calendar/format-calendar-month-key-br';
import { formatCentsAsBrl } from '../domain/money/brl-input';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';
import { useDashboardValuesVisible } from '../lib/use-dashboard-values-visible';

export function HomePage() {
  const bank = useBank();
  const { valuesVisible, toggleValuesVisible } = useDashboardValuesVisible();
  const [pending, setPending] = useState(readPendingBundle());
  const [notice, setNotice] = useState<string | null>(null);
  const today = todayCalendarDate();
  const settings = { ...bank.snapshot.settings, milestonesCents: milestonesOrDefault(bank.snapshot.settings.milestonesCents) };
  const metrics = computeDashboardMetrics({
    plans: bank.snapshot.installmentPlans,
    installments: bank.snapshot.installments,
    settings,
    cashBoxes: bank.snapshot.cashBoxes,
    today,
  });
  const pendingInstallments = bank.snapshot.installments
    .filter((installment) => !installment.paidDate)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const upcoming = pendingInstallments.slice(0, 6);
  const showUpcomingSeeAll = pendingInstallments.length > 6;

  const receivable = formatDashboardBrl(formatCentsAsBrl(metrics.totalEmittedCents - metrics.totalReceivedCents), valuesVisible);
  const overdueLabel =
    metrics.overdueCount === 0
      ? 'Nenhuma parcela em atraso'
      : `${formatDashboardCount(metrics.overdueCount, valuesVisible)} em atraso`;

  async function saveDraft() {
    if (!pending) {
      return;
    }
    await bank.saveBundle(pending);
    writePendingBundle(null);
    setPending(null);
    setNotice('Carnê salvo na sua conta.');
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Bem-vindo</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">{receivable} a receber</h1>
          <p className="text-muted-foreground">{overdueLabel}</p>
        </div>
        <button
          type="button"
          className="press inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"
          onClick={toggleValuesVisible}
          aria-label={valuesVisible ? 'Ocultar valores' : 'Mostrar valores'}
          title={valuesVisible ? 'Ocultar valores' : 'Mostrar valores'}
        >
          {valuesVisible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </header>
      {pending ? (
        <Card className="grid gap-3">
          <p>Existe um carnê gerado nesta sessão para {pending.plan.borrowerName}.</p>
          <SaveActionButton type="button" label="Salvar na conta" onClick={() => void saveDraft()} />
        </Card>
      ) : null}
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Saídas" value={formatDashboardBrl(formatCentsAsBrl(metrics.totalUsedCents), valuesVisible)} />
        <Metric label="Retorno previsto" value={formatDashboardBrl(formatCentsAsBrl(metrics.totalEmittedCents), valuesVisible)} />
        <Metric label="Lucro previsto" value={formatDashboardBrl(formatCentsAsBrl(metrics.expectedProfitCents), valuesVisible)} />
        <Metric label="Recebido" value={formatDashboardBrl(formatCentsAsBrl(metrics.totalReceivedCents), valuesVisible)} />
      </div>
      <Card className={upcoming.length === 0 ? 'grid gap-3' : 'grid gap-0 overflow-hidden p-0'}>
        <div
          className={cx(
            'flex items-center justify-between gap-2',
            upcoming.length === 0 ? '' : 'border-b border-border px-4 py-4',
          )}
        >
          <h2 className="font-semibold">Próximas parcelas</h2>
          {showUpcomingSeeAll ? (
            <Link to="/parcelamentos" className="shrink-0 text-sm font-semibold text-primary">
              Ver todas
            </Link>
          ) : null}
        </div>
        {upcoming.length === 0 ? (
          <EmptyState title="Nada pendente" text="Gere um carnê na página inicial ou registre um parcelamento." />
        ) : (
          <ul className="grid list-none gap-0 p-0 lg:grid-cols-[minmax(0,1.15fr)_6.25rem_5.5rem_minmax(4.75rem,auto)] lg:gap-x-3">
            <li className="col-span-full hidden border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-subgrid lg:items-center">
              <span>Pagador</span>
              <span className="text-center">Status</span>
              <span className="text-center">Próx. venc.</span>
              <span className="text-end">Valor</span>
            </li>
            {upcoming.map((installment, index) => {
              const plan = bank.snapshot.installmentPlans.find((item) => item.id === installment.planId);
              const status = deriveInstallmentStatus(installment, today);
              const tone =
                status === InstallmentStatus.Paid
                  ? 'paid'
                  : status === InstallmentStatus.Overdue
                    ? 'overdue'
                    : 'pending';
              const dueLabel = formatCalendarDateBr(installment.dueDate);
              const amountLabel = formatDashboardBrl(formatCentsAsBrl(installment.amountCents), valuesVisible);
              if (!plan) {
                return null;
              }
              return (
                <li
                  key={installment.id}
                  className={cx(
                    'press col-span-full border-b border-border px-4 py-3 transition-colors',
                    index === upcoming.length - 1 && 'last:border-b-0',
                    'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5',
                    'hover:bg-muted/40 lg:grid-cols-subgrid lg:grid-rows-1 lg:items-center lg:gap-y-0 lg:hover:bg-muted/50',
                  )}
                >
                  <Link to={`/parcelamentos/${plan.id}`} className="contents">
                    <span className="min-w-0 truncate font-semibold max-lg:col-start-1 max-lg:row-start-1">
                      {formatInstallmentOrdinalPt(installment.number)} · {plan.borrowerName}
                    </span>
                    <span className="flex shrink-0 justify-end max-lg:col-start-2 max-lg:row-start-1 max-lg:justify-self-end lg:justify-center">
                      <StatusPill label={installmentStatusLabel(status)} tone={tone} />
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums max-lg:col-start-1 max-lg:row-start-2 lg:text-center">
                      {dueLabel}
                    </span>
                    <span className="font-semibold tabular-nums max-lg:col-start-2 max-lg:row-start-2 max-lg:justify-self-end max-lg:self-center lg:text-end">
                      {amountLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">
            Patrimônio {formatDashboardBrl(formatCentsAsBrl(metrics.patrimonyCents), valuesVisible)}
          </h2>
          <Link to="/configuracoes" className="text-sm font-semibold text-primary">Configurar meus dados</Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {metrics.nextMilestoneCents
            ? `Próxima meta ${formatDashboardBrl(formatCentsAsBrl(metrics.nextMilestoneCents), valuesVisible)} · mês de referência ${formatCalendarMonthKeyBr(metrics.upcomingMonthKey)}`
            : 'Defina metas em Configurações.'}
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-accent"
            style={{ width: valuesVisible ? `${metrics.milestoneProgressPercent}%` : '0%' }}
          />
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-0">
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums sm:text-2xl">{value}</p>
    </Card>
  );
}
