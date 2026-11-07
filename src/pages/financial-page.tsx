import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useBank } from '../components/bank-context';
import { Card, money } from '../components/ui';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { computeFinancialOverview } from '../domain/finance/compute-financial-overview';
import { milestonesOrDefault } from '../domain/finance/default-milestones';

export function FinancialPage() {
  const bank = useBank();
  const settings = {
    ...bank.snapshot.settings,
    milestonesCents: milestonesOrDefault(bank.snapshot.settings.milestonesCents),
  };
  const overview = computeFinancialOverview({
    plans: bank.snapshot.installmentPlans,
    installments: bank.snapshot.installments,
    settings,
    cashBoxes: bank.snapshot.cashBoxes,
    today: todayCalendarDate(),
  });

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Financeiro</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Link to="/financeiro/saldo-livre" className="block">
          <Card className="press flex items-center gap-2 transition-colors hover:border-primary/30">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Saldo livre</p>
              <p className="text-2xl font-semibold tabular-nums">{money(settings.freeBalanceCents)}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Card>
        </Link>
        <Link to="/caixinhas" className="block">
          <Card className="press flex items-center gap-2 transition-colors hover:border-primary/30">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Caixinhas</p>
              <p className="text-2xl font-semibold tabular-nums">{money(overview.totalCashBoxesCents)}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Card>
        </Link>
        <Card>
          <p className="text-sm text-muted-foreground">Patrimônio</p>
          <p className="text-2xl font-semibold tabular-nums">{money(overview.patrimonyCents)}</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card aria-disabled="true">
          <p className="text-sm text-muted-foreground">Contas a receber</p>
          <p className="text-2xl font-semibold tabular-nums">{money(0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Em breve</p>
        </Card>
        <Card aria-disabled="true">
          <p className="text-sm text-muted-foreground">Contas a pagar</p>
          <p className="text-2xl font-semibold tabular-nums">{money(0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Em breve</p>
        </Card>
      </div>
      <Card>
        <p>Rendimento mensal estimado: {money(overview.estimatedMonthlyYieldTotalCents)}</p>
        <p className="text-sm text-muted-foreground">
          CDI ao ano configurado em {settings.cdiAnnualPercent}%. O rendimento não é creditado sozinho.
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent" style={{ width: `${overview.milestone.progressPercent}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {overview.milestone.nextMilestoneCents
            ? `Faltam ${money(overview.milestone.remainingToNextCents)} para ${money(overview.milestone.nextMilestoneCents)}`
            : 'Última meta alcançada.'}
        </p>
      </Card>
    </div>
  );
}
