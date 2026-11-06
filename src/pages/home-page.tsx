import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBank } from '../components/bank-context';
import { Button, Card, EmptyState, money } from '../components/ui';
import { computeDashboardMetrics } from '../domain/dashboard/compute-dashboard-metrics';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { deriveInstallmentStatus } from '../domain/installments/derive-installment-status';
import { InstallmentStatus } from '../domain/enums/installment-status';
import { readPendingBundle, writePendingBundle } from '../lib/guest-draft';
import { formatCalendarMonthKeyBr } from '../domain/calendar/format-calendar-month-key-br';

export function HomePage() {
  const bank = useBank();
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
      <header>
        <p className="text-sm text-muted-foreground">Bem-vindo</p>
        <h1 className="text-3xl font-semibold">{money(metrics.totalEmittedCents - metrics.totalReceivedCents)} a receber</h1>
        <p className="text-muted-foreground">
          {metrics.overdueCount === 0 ? 'Nenhuma parcela em atraso' : `${metrics.overdueCount} em atraso`}
        </p>
      </header>
      {pending ? (
        <Card className="grid gap-3">
          <p>Existe um carnê gerado nesta sessão para {pending.plan.borrowerName}.</p>
          <Button type="button" onClick={() => void saveDraft()}>Salvar na conta</Button>
        </Card>
      ) : null}
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Saídas" value={money(metrics.totalUsedCents)} />
        <Metric label="Retorno previsto" value={money(metrics.totalEmittedCents)} />
        <Metric label="Lucro previsto" value={money(metrics.expectedProfitCents)} />
        <Metric label="Recebido" value={money(metrics.totalReceivedCents)} />
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
                  <strong>{money(installment.amountCents)}</strong>
                  <span className="text-sm">{status === InstallmentStatus.Overdue ? 'Vencida' : 'Pendente'}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Patrimônio {money(metrics.patrimonyCents)}</h2>
          <Link to="/configuracoes" className="text-sm font-semibold text-primary">Configurar meus dados</Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {metrics.nextMilestoneCents
            ? `Próxima meta ${money(metrics.nextMilestoneCents)} · mês de referência ${formatCalendarMonthKeyBr(metrics.upcomingMonthKey)}`
            : 'Defina metas em Configurações.'}
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent" style={{ width: `${metrics.milestoneProgressPercent}%` }} />
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
