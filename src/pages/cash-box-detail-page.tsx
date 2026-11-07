import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBank } from '../components/bank-context';
import { CashBoxHistoryByMonth } from '../components/cash-box-history-by-month';
import { DeleteCashBoxPanel } from '../components/delete-cash-box-panel';
import { MaskedMoneyInput } from '../components/masked-inputs';
import { Button, Card, EmptyState, money } from '../components/ui';
import { applyCashBoxMovement } from '../domain/cash-boxes/apply-cash-box-movement';
import { groupCashBoxMovementsByMonth } from '../domain/cash-boxes/group-cash-box-movements-by-month';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import { computeFinancialOverview } from '../domain/finance/compute-financial-overview';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { createId } from '../domain/ids/create-id';
import { brlStringToCents } from '../domain/money/brl-input';

export function CashBoxDetailPage() {
  const { cashBoxId = '' } = useParams();
  const navigate = useNavigate();
  const bank = useBank();
  const [notice, setNotice] = useState<string | null>(null);
  const [amountFieldKey, setAmountFieldKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const cashBox = bank.snapshot.cashBoxes.find((item) => item.id === cashBoxId);
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
  const yieldRow = overview.yieldByCashBox.find((item) => item.cashBoxId === cashBoxId);
  const movements = useMemo(
    () => bank.snapshot.cashBoxMovements.filter((item) => item.cashBoxId === cashBoxId),
    [bank.snapshot.cashBoxMovements, cashBoxId],
  );
  const movementGroups = useMemo(() => groupCashBoxMovementsByMonth(movements), [movements]);

  async function move(type: CashBoxMovementType, amountRaw: string): Promise<boolean> {
    if (!cashBox) {
      return false;
    }
    const amountCents = brlStringToCents(amountRaw) ?? 0;
    const result = applyCashBoxMovement(cashBox, { type, amountCents });
    if (!result.ok) {
      setNotice(
        result.error === 'INSUFFICIENT_BALANCE'
          ? 'Saldo insuficiente.'
          : result.error === 'LIMIT_EXCEEDED'
            ? 'Limite da caixinha excedido.'
            : 'Informe um valor maior que zero.',
      );
      return false;
    }
    await bank.saveCashBox({ ...cashBox, balanceCents: result.balanceCents });
    await bank.saveMovement({
      id: createId(),
      cashBoxId: cashBox.id,
      type,
      amountCents,
      date: todayCalendarDate(),
    });
    setNotice(type === CashBoxMovementType.Deposit ? 'Aporte registrado.' : 'Resgate registrado.');
    return true;
  }

  async function confirmDelete() {
    if (!cashBox) {
      return;
    }
    await bank.deleteCashBox(cashBox.id);
    setDeleteOpen(false);
    void navigate('/caixinhas');
  }

  if (!cashBox) {
    return (
      <div className="grid gap-4">
        <EmptyState title="Caixinha não encontrada" text="Volte à lista e escolha outra caixinha." />
        <Link
          to="/caixinhas"
          className="press inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-soft px-4 font-semibold text-primary"
        >
          Voltar para Caixinhas
        </Link>
      </div>
    );
  }

  const limitProgress =
    cashBox.limitCents !== undefined && cashBox.limitCents > 0
      ? Math.min(100, Math.round((cashBox.balanceCents / cashBox.limitCents) * 100))
      : null;

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <Link to="/caixinhas" className="font-semibold text-primary">
          Caixinhas
        </Link>
      </p>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <Card className="grid gap-2">
        <h1 className="text-2xl font-semibold">{cashBox.name}</h1>
        <p className="text-sm text-muted-foreground">
          {cashBox.institution} · {cashBox.cdiPercent}% do CDI · pode render {money(yieldRow?.yieldCents ?? 0)} no mês
        </p>
        <p className="text-3xl font-semibold tabular-nums">{money(cashBox.balanceCents)}</p>
        {limitProgress !== null ? (
          <div>
            <p className="text-sm text-muted-foreground">
              Limite {money(cashBox.limitCents ?? 0)}
            </p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-accent" style={{ width: `${limitProgress}%` }} />
            </div>
          </div>
        ) : null}
      </Card>
      <Card className="grid gap-3">
        <h2 className="font-semibold">Lançamento</h2>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(event) => {
            void (async () => {
              event.preventDefault();
              const submitter = event.nativeEvent.submitter;
              const data = new FormData(
                event.currentTarget,
                submitter instanceof HTMLElement ? submitter : undefined,
              );
              const type = data.get('type');
              if (type !== CashBoxMovementType.Deposit && type !== CashBoxMovementType.Withdrawal) {
                setNotice('Escolha aportar ou resgatar.');
                return;
              }
              const ok = await move(type, String(data.get('amount') ?? ''));
              if (ok) {
                setAmountFieldKey((previous) => previous + 1);
              }
            })();
          }}
        >
          <MaskedMoneyInput
            key={amountFieldKey}
            name="amount"
            placeholder="0,00"
            aria-label="Valor do lançamento"
          />
          <Button type="submit" name="type" value={CashBoxMovementType.Deposit}>
            Aportar
          </Button>
          <Button type="submit" name="type" value={CashBoxMovementType.Withdrawal} variant="soft">
            Resgatar
          </Button>
        </form>
      </Card>
      <Card className="grid gap-3">
        <h2 className="font-semibold">Histórico</h2>
        <CashBoxHistoryByMonth groups={movementGroups} />
      </Card>
      <Button type="button" variant="ghost" onClick={() => setDeleteOpen(true)}>
        Excluir caixinha
      </Button>
      <DeleteCashBoxPanel
        cashBox={cashBox}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
