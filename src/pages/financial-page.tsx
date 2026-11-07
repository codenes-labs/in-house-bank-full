import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useBank } from '../components/bank-context';
import { OverlayPanel } from '../components/overlay-panel';
import { MaskedMoneyInput, MaskedRateInput } from '../components/masked-inputs';
import { Button, Card, EmptyState, Field, money, TextInput } from '../components/ui';
import { createId } from '../domain/ids/create-id';
import { applyCashBoxMovement } from '../domain/cash-boxes/apply-cash-box-movement';
import { validateCashBoxInput } from '../domain/cash-boxes/validate-cash-box';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import { computeFinancialOverview } from '../domain/finance/compute-financial-overview';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { brlStringToCents } from '../domain/money/brl-input';

export function FinancialPage() {
  const bank = useBank();
  const [notice, setNotice] = useState<string | null>(null);
  const [movementAmountFieldKeys, setMovementAmountFieldKeys] = useState<Record<string, number>>({});
  const [deleteConfirmCashBoxId, setDeleteConfirmCashBoxId] = useState<string | null>(null);
  const [createCashBoxOpen, setCreateCashBoxOpen] = useState(false);
  const [createCashBoxFormKey, setCreateCashBoxFormKey] = useState(0);
  const cashBoxPendingDelete = deleteConfirmCashBoxId
    ? bank.snapshot.cashBoxes.find((item) => item.id === deleteConfirmCashBoxId)
    : undefined;
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

  async function saveBox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get('name') ?? ''),
      institution: String(data.get('institution') ?? ''),
      cdiPercent: Number(String(data.get('cdi') ?? '').replace(',', '.')),
      limitCents: data.get('limit') ? brlStringToCents(String(data.get('limit'))) ?? undefined : undefined,
      balanceCents: brlStringToCents(String(data.get('balance') ?? '0')) ?? -1,
    };
    const validation = validateCashBoxInput(input);
    if (!validation.valid || input.limitCents === undefined && data.get('limit')) {
      setNotice(Object.values(validation.errors)[0] ?? 'Dados da caixinha inválidos.');
      return;
    }
    await bank.saveCashBox({
      id: createId(),
      name: input.name.trim(),
      institution: input.institution.trim(),
      cdiPercent: input.cdiPercent,
      limitCents: input.limitCents,
      balanceCents: input.balanceCents,
    });
    setCreateCashBoxOpen(false);
    setCreateCashBoxFormKey((previous) => previous + 1);
    setNotice('Caixinha criada.');
  }

  async function move(cashBoxId: string, type: CashBoxMovementType, amountRaw: string): Promise<boolean> {
    const cashBox = bank.snapshot.cashBoxes.find((item) => item.id === cashBoxId);
    const amountCents = brlStringToCents(amountRaw) ?? 0;
    if (!cashBox) {
      return false;
    }
    const result = applyCashBoxMovement(cashBox, { type, amountCents });
    if (!result.ok) {
      setNotice(result.error === 'INSUFFICIENT_BALANCE' ? 'Saldo insuficiente.' : result.error === 'LIMIT_EXCEEDED' ? 'Limite da caixinha excedido.' : 'Informe um valor maior que zero.');
      return false;
    }
    await bank.saveCashBox({ ...cashBox, balanceCents: result.balanceCents });
    await bank.saveMovement({
      id: createId(),
      cashBoxId,
      type,
      amountCents,
      date: todayCalendarDate(),
    });
    setNotice(type === CashBoxMovementType.Deposit ? 'Aporte registrado.' : 'Resgate registrado.');
    return true;
  }

  async function confirmDeleteCashBox() {
    if (!deleteConfirmCashBoxId) {
      return;
    }
    await bank.deleteCashBox(deleteConfirmCashBoxId);
    setDeleteConfirmCashBoxId(null);
    setNotice('Caixinha excluída.');
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Financeiro</h1>
        <Button type="button" variant="soft" className="gap-2" onClick={() => setCreateCashBoxOpen(true)}>
          <Plus className="size-5" aria-hidden />
          Criar caixinha
        </Button>
      </div>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">Saldo livre</p><p className="text-2xl font-semibold">{money(settings.freeBalanceCents)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Caixinhas</p><p className="text-2xl font-semibold">{money(overview.totalCashBoxesCents)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Patrimônio</p><p className="text-2xl font-semibold">{money(overview.patrimonyCents)}</p></Card>
      </div>
      <Card>
        <p>Rendimento mensal estimado: {money(overview.estimatedMonthlyYieldTotalCents)}</p>
        <p className="text-sm text-muted-foreground">CDI ao ano configurado em {settings.cdiAnnualPercent}%. O rendimento não é creditado sozinho.</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent" style={{ width: `${overview.milestone.progressPercent}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {overview.milestone.nextMilestoneCents ? `Faltam ${money(overview.milestone.remainingToNextCents)} para ${money(overview.milestone.nextMilestoneCents)}` : 'Última meta alcançada.'}
        </p>
      </Card>
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault();
        const amount = brlStringToCents(String(new FormData(event.currentTarget).get('free') ?? ''));
        if (amount === null || amount < 0) {
          setNotice('Informe o saldo livre.');
          return;
        }
        void bank.saveSettings({ ...bank.snapshot.settings, freeBalanceCents: amount });
      }}>
        <Field label="Saldo livre">
          <MaskedMoneyInput name="free" placeholder="0,00" />
        </Field>
        <Button type="submit" variant="soft">Atualizar saldo livre</Button>
      </form>
      {bank.snapshot.cashBoxes.length === 0 ? (
        <div className="grid gap-3">
          <EmptyState title="Nenhuma caixinha" text="Crie a primeira para projetar o rendimento." />
          <Button type="button" onClick={() => setCreateCashBoxOpen(true)}>Criar caixinha</Button>
        </div>
      ) : null}
      {bank.snapshot.cashBoxes.map((cashBox) => {
        const estimate = overview.yieldByCashBox.find((item) => item.cashBoxId === cashBox.id);
        const movements = bank.snapshot.cashBoxMovements.filter((item) => item.cashBoxId === cashBox.id);
        return (
          <Card key={cashBox.id} className="grid gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{cashBox.name}</h2>
                <p className="text-sm text-muted-foreground">{cashBox.institution} · {cashBox.cdiPercent}% do CDI · pode render {money(estimate?.yieldCents ?? 0)} no mês</p>
              </div>
              <strong>{money(cashBox.balanceCents)}</strong>
            </div>
            <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={(event) => {
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
                const ok = await move(cashBox.id, type, String(data.get('amount') ?? ''));
                if (ok) {
                  setMovementAmountFieldKeys((previous) => ({
                    ...previous,
                    [cashBox.id]: (previous[cashBox.id] ?? 0) + 1,
                  }));
                }
              })();
            }}>
              <MaskedMoneyInput
                key={movementAmountFieldKeys[cashBox.id] ?? 0}
                name="amount"
                placeholder="0,00"
                aria-label="Valor do lançamento"
              />
              <Button type="submit" name="type" value={CashBoxMovementType.Deposit}>Aportar</Button>
              <Button type="submit" name="type" value={CashBoxMovementType.Withdrawal} variant="soft">Resgatar</Button>
            </form>
            <ul className="grid gap-1 text-sm">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-2">
                  <span>{movement.type === CashBoxMovementType.Deposit ? 'Aporte' : 'Resgate'} · {movement.date.split('-').reverse().join('/')}</span>
                  <span>{money(movement.amountCents)}</span>
                </li>
              ))}
            </ul>
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirmCashBoxId(cashBox.id)}>Excluir caixinha</Button>
          </Card>
        );
      })}
      <OverlayPanel
        open={createCashBoxOpen}
        title="Criar caixinha"
        onClose={() => setCreateCashBoxOpen(false)}
      >
        <form key={createCashBoxFormKey} className="grid gap-3" onSubmit={(event) => void saveBox(event)}>
          <Field label="Nome"><TextInput name="name" required /></Field>
          <Field label="Instituição"><TextInput name="institution" required /></Field>
          <Field label="% do CDI"><MaskedRateInput name="cdi" defaultValue="100" /></Field>
          <Field label="Saldo inicial"><MaskedMoneyInput name="balance" defaultValue="0,00" /></Field>
          <Field label="Limite opcional"><MaskedMoneyInput name="limit" placeholder="0,00" /></Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateCashBoxOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar caixinha</Button>
          </div>
        </form>
      </OverlayPanel>
      <OverlayPanel
        open={deleteConfirmCashBoxId !== null && cashBoxPendingDelete !== undefined}
        title="Excluir caixinha"
        onClose={() => setDeleteConfirmCashBoxId(null)}
      >
        {cashBoxPendingDelete ? (
          <div className="grid gap-4">
            <p>
              Excluir <strong>{cashBoxPendingDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <p className="text-sm text-muted-foreground">
              O saldo de {money(cashBoxPendingDelete.balanceCents)} será transferido automaticamente para o saldo livre.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteConfirmCashBoxId(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void confirmDeleteCashBox()}>
                Confirmar exclusão
              </Button>
            </div>
          </div>
        ) : null}
      </OverlayPanel>
    </div>
  );
}
