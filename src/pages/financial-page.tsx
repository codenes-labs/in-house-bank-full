import { useState, type FormEvent } from 'react';
import { useBank } from '../components/bank-context';
import { Button, Card, EmptyState, Field, money, TextInput } from '../components/ui';
import { createId } from '../domain/ids/create-id';
import { applyCashBoxMovement } from '../domain/cash-boxes/apply-cash-box-movement';
import { computeBalanceAfterRemovingCashBoxMovement } from '../domain/cash-boxes/compute-balance-after-removing-cash-box-movement';
import { validateCashBoxInput } from '../domain/cash-boxes/validate-cash-box';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import { computeFinancialOverview } from '../domain/finance/compute-financial-overview';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { brlStringToCents } from '../domain/money/brl-input';

export function FinancialPage() {
  const bank = useBank();
  const [notice, setNotice] = useState<string | null>(null);
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
    event.currentTarget.reset();
    setNotice('Caixinha criada.');
  }

  async function move(cashBoxId: string, type: CashBoxMovementType, amountRaw: string) {
    const cashBox = bank.snapshot.cashBoxes.find((item) => item.id === cashBoxId);
    const amountCents = brlStringToCents(amountRaw) ?? 0;
    if (!cashBox) {
      return;
    }
    const result = applyCashBoxMovement(cashBox, { type, amountCents });
    if (!result.ok) {
      setNotice(result.error === 'INSUFFICIENT_BALANCE' ? 'Saldo insuficiente.' : result.error === 'LIMIT_EXCEEDED' ? 'Limite da caixinha excedido.' : 'Informe um valor maior que zero.');
      return;
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
  }

  async function removeMovement(movementId: string) {
    const movement = bank.snapshot.cashBoxMovements.find((item) => item.id === movementId);
    const cashBox = bank.snapshot.cashBoxes.find((item) => item.id === movement?.cashBoxId);
    if (!movement || !cashBox) {
      return;
    }
    const result = computeBalanceAfterRemovingCashBoxMovement(cashBox, movement);
    if (!result.ok) {
      setNotice('Não foi possível desfazer este lançamento.');
      return;
    }
    await bank.saveCashBox({ ...cashBox, balanceCents: result.balanceCents });
    await bank.deleteMovement(movementId);
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Financeiro</h1>
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
          <TextInput name="free" inputMode="decimal" placeholder="0,00" />
        </Field>
        <Button type="submit" variant="soft">Atualizar saldo livre</Button>
      </form>
      {bank.snapshot.cashBoxes.length === 0 ? <EmptyState title="Nenhuma caixinha" text="Crie a primeira para projetar o rendimento." /> : null}
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
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void move(cashBox.id, String(data.get('type')) as CashBoxMovementType, String(data.get('amount') ?? ''));
              event.currentTarget.reset();
            }}>
              <TextInput name="amount" inputMode="decimal" placeholder="Valor" aria-label="Valor do lançamento" />
              <Button type="submit" name="type" value={CashBoxMovementType.Deposit}>Aportar</Button>
              <Button type="submit" name="type" value={CashBoxMovementType.Withdrawal} variant="soft">Resgatar</Button>
            </form>
            <ul className="grid gap-1 text-sm">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-2">
                  <span>{movement.type === CashBoxMovementType.Deposit ? 'Aporte' : 'Resgate'} · {movement.date.split('-').reverse().join('/')}</span>
                  <span>{money(movement.amountCents)}</span>
                  <button type="button" className="font-semibold text-primary" onClick={() => void removeMovement(movement.id)}>Desfazer</button>
                </li>
              ))}
            </ul>
            <Button type="button" variant="ghost" onClick={() => void bank.deleteCashBox(cashBox.id)}>Excluir caixinha</Button>
          </Card>
        );
      })}
      <Card>
        <h2 className="mb-3 font-semibold">Nova caixinha</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void saveBox(event)}>
          <Field label="Nome"><TextInput name="name" /></Field>
          <Field label="Instituição"><TextInput name="institution" /></Field>
          <Field label="% do CDI"><TextInput name="cdi" defaultValue="100" /></Field>
          <Field label="Saldo inicial"><TextInput name="balance" defaultValue="0,00" /></Field>
          <Field label="Limite opcional"><TextInput name="limit" /></Field>
          <Button type="submit">Criar caixinha</Button>
        </form>
      </Card>
    </div>
  );
}
