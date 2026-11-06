import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useBank } from '../components/bank-context';
import { Button, Card, EmptyState } from '../components/ui';
import { computeDashboardMetrics } from '../domain/dashboard/compute-dashboard-metrics';
import {
  formatDashboardBrl,
  formatDashboardCount,
} from '../domain/dashboard/dashboard-values-visibility';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { deriveInstallmentStatus } from '../domain/installments/derive-installment-status';
import { InstallmentStatus } from '../domain/enums/installment-status';
import { readPendingBundle, writePendingBundle } from '../lib/guest-draft';
import { formatCalendarMonthKeyBr } from '../domain/calendar/format-calendar-month-key-br';
import { formatCentsAsBrl } from '../domain/money/brl-input';
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
  const upcoming = bank.snapshot.installments
    .filter((installment) => !installment.paidDate)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 5);

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
          <h1 className="text-3xl font-semibold">{receivable} a receber</h1>
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
          <Button type="button" onClick={() => void saveDraft()}>Salvar na conta</Button>
        </Card>
      ) : null}
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Saídas" value={formatDashboardBrl(formatCentsAsBrl(metrics.totalUsedCents), valuesVisible)} />
        <Metric label="Retorno previsto" value={formatDashboardBrl(formatCentsAsBrl(metrics.totalEmittedCents), valuesVisible)} />
        <Metric label="Lucro previsto" value={formatDashboardBrl(formatCentsAsBrl(metrics.expectedProfitCents), valuesVisible)} />
        <Metric label="Recebido" value={formatDashboardBrl(formatCentsAsBrl(metrics.totalReceivedCents), valuesVisible)} />
      </div>
      <Card>
        <h2 className="font-semibold">Próximas parcelas</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="Nada pendente" text="Gere um carnê na página inicial ou registre um parcelamento." />
        ) : (
          <ul className="mt-3 grid gap-2">
            {upcoming.map((installment) => {
              const plan = bank.snapshot.installmentPlans.find((item) => item.id === installment.planId);
              const status = deriveInstallmentStatus(installment, today);
              return (
                <li key={installment.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2">
                  <span>{plan?.borrowerName ?? 'Pagador'} · {installment.number}</span>
                  <span>{installment.dueDate.split('-').reverse().join('/')}</span>
                  <strong>{formatDashboardBrl(formatCentsAsBrl(installment.amountCents), valuesVisible)}</strong>
                  <span className="text-sm">{status === InstallmentStatus.Overdue ? 'Vencida' : 'Pendente'}</span>
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
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
