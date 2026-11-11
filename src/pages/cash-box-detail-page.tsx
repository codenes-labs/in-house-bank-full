import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { useBank } from '../components/bank-context';
import { CashBoxHistoryByMonth } from '../components/cash-box-history-by-month';
import { DeleteCashBoxPanel } from '../components/delete-cash-box-panel';
import { EditCashBoxPanel } from '../components/edit-cash-box-panel';
import {
  DeleteActionButton,
  DepositActionButton,
  EditActionButton,
  WithdrawalActionButton,
} from '../components/standard-action-buttons';
import { MaskedMoneyInput } from '../components/masked-inputs';
import { Card, EmptyState, money } from '../components/ui';
import { applyCashBoxMovement } from '../domain/cash-boxes/apply-cash-box-movement';
import { groupCashBoxMovementsByMonth } from '../domain/cash-boxes/group-cash-box-movements-by-month';
import { effectiveTodayForPresentation } from '../domain/demo/demo-presentation-reference-date';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import { computeFinancialOverview } from '../domain/finance/compute-financial-overview';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { createId } from '../domain/ids/create-id';
import { brlStringToCents } from '../domain/money/brl-input';

export function CashBoxDetailPage() {
  const { cashBoxId = '' } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const bank = useBank();
  const isDemo = auth.session?.user.isDemo ?? false;
  const today = effectiveTodayForPresentation(isDemo);
  const [notice, setNotice] = useState<string | null>(null);
  const [amountFieldKey, setAmountFieldKey] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
    today,
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
    await bank.recordCashBoxMovement(
      { ...cashBox, balanceCents: result.balanceCents },
      {
        id: createId(),
        cashBoxId: cashBox.id,
        type,
        amountCents,
        date: today,
        recordedAt: new Date().toISOString(),
      },
    );
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/caixinhas" className="text-sm font-semibold text-primary">
          Voltar para todas as caixinhas
        </Link>
        <div className="flex flex-wrap gap-2">
          <EditActionButton layout="inline" onClick={() => setEditOpen(true)} />
          <DeleteActionButton label="Excluir caixinha" onClick={() => setDeleteOpen(true)} />
        </div>
      </div>
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
          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
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
            className="min-h-10"
            placeholder="0,00"
            aria-label="Valor do lançamento"
          />
          <div className="flex w-full gap-2 sm:contents">
            <DepositActionButton name="type" value={CashBoxMovementType.Deposit} label="Aportar" />
            <WithdrawalActionButton name="type" value={CashBoxMovementType.Withdrawal} label="Resgatar" />
          </div>
        </form>
      </Card>
      <Card className="grid gap-3">
        <h2 className="font-semibold">Histórico</h2>
        <CashBoxHistoryByMonth groups={movementGroups} />
      </Card>
      <EditCashBoxPanel
        cashBox={cashBox}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onError={(message) => setNotice(message)}
        onSaved={() => setNotice('Caixinha atualizada.')}
      />
      <DeleteCashBoxPanel
        cashBox={cashBox}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
