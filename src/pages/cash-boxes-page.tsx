import { useState } from 'react';
import { useBank } from '../components/bank-context';
import { CashBoxListCard } from '../components/cash-box-list-card';
import { CreateCashBoxPanel } from '../components/create-cash-box-panel';
import { CreatePrimaryAction } from '../components/standard-action-buttons';
import { Card, EmptyState, money } from '../components/ui';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { computeFinancialOverview } from '../domain/finance/compute-financial-overview';
import { milestonesOrDefault } from '../domain/finance/default-milestones';

export function CashBoxesPage() {
  const bank = useBank();
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-3xl">Caixinhas</h1>
        </div>
        <CreatePrimaryAction label="Nova caixinha" onClick={() => setCreateOpen(true)} />
      </div>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <Card className="grid gap-1 sm:grid-cols-2 sm:gap-3">
        <p className="text-sm text-muted-foreground">Total em caixinhas</p>
        <p className="text-xl font-semibold sm:text-right">{money(overview.totalCashBoxesCents)}</p>
        <p className="text-sm text-muted-foreground">Rendimento mensal estimado</p>
        <p className="text-sm font-semibold sm:text-right">{money(overview.estimatedMonthlyYieldTotalCents)}</p>
      </Card>
      {bank.snapshot.cashBoxes.length === 0 ? (
        <div className="grid gap-3">
          <EmptyState title="Nenhuma caixinha" text="Crie a primeira para projetar o rendimento." />
          <CreatePrimaryAction fullWidth label="Criar caixinha" onClick={() => setCreateOpen(true)} />
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {bank.snapshot.cashBoxes.map((cashBox) => {
            const yieldRow = overview.yieldByCashBox.find((item) => item.cashBoxId === cashBox.id);
            return (
              <CashBoxListCard
                key={cashBox.id}
                cashBox={cashBox}
                estimatedMonthlyYieldCents={yieldRow?.yieldCents ?? 0}
              />
            );
          })}
        </div>
      )}
      <CreateCashBoxPanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setNotice('Caixinha criada.')}
        onError={(message) => setNotice(message)}
      />
    </div>
  );
}
