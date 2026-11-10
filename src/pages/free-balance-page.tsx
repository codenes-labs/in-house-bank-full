import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBank } from '../components/bank-context';
import { MaskedMoneyInput } from '../components/masked-inputs';
import { DepositActionButton, WithdrawalActionButton } from '../components/standard-action-buttons';
import { Card, money } from '../components/ui';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { applyFreeBalanceDeposit } from '../domain/finance/apply-free-balance-deposit';
import { applyFreeBalanceWithdrawal } from '../domain/finance/apply-free-balance-withdrawal';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { createId } from '../domain/ids/create-id';
import { brlStringToCents } from '../domain/money/brl-input';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';

const MovementKind = {
  Deposit: 'DEPOSIT',
  Withdrawal: 'WITHDRAWAL',
} as const;

export function FreeBalancePage() {
  const bank = useBank();
  const [notice, setNotice] = useState<string | null>(null);
  const [amountFieldKey, setAmountFieldKey] = useState(0);
  const settings = {
    ...bank.snapshot.settings,
    milestonesCents: milestonesOrDefault(bank.snapshot.settings.milestonesCents),
  };
  const recentWithdrawals = useMemo(
    () =>
      [...bank.snapshot.freeBalanceWithdrawals]
        .sort((left, right) => (left.date < right.date ? 1 : left.date > right.date ? -1 : 0))
        .slice(0, 5),
    [bank.snapshot.freeBalanceWithdrawals],
  );

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <Link to="/financeiro" className="font-semibold text-primary">
          Financeiro
        </Link>
      </p>
      {notice ? <p className="text-sm text-accent">{notice}</p> : null}
      <Card className="grid gap-1">
        <p className="text-sm text-muted-foreground">Saldo livre</p>
        <p className="text-3xl font-semibold tabular-nums">{money(settings.freeBalanceCents)}</p>
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
              const kind = data.get('kind');
              const amountCents = brlStringToCents(String(data.get('amount') ?? '')) ?? 0;
              if (kind === MovementKind.Deposit) {
                const result = applyFreeBalanceDeposit(settings.freeBalanceCents, amountCents);
                if (!result.ok) {
                  setNotice('Informe um valor maior que zero.');
                  return;
                }
                await bank.saveSettings({ ...bank.snapshot.settings, freeBalanceCents: result.freeBalanceCents });
                setNotice('Entrada registrada.');
                setAmountFieldKey((previous) => previous + 1);
                return;
              }
              if (kind === MovementKind.Withdrawal) {
                const result = applyFreeBalanceWithdrawal(settings.freeBalanceCents, amountCents);
                if (!result.ok) {
                  setNotice(
                    result.error === 'INSUFFICIENT_BALANCE'
                      ? 'Saldo insuficiente.'
                      : 'Informe um valor maior que zero.',
                  );
                  return;
                }
                await bank.saveFreeBalanceWithdrawal(
                  {
                    id: createId(),
                    amountCents,
                    date: todayCalendarDate(),
                  },
                  { ...bank.snapshot.settings, freeBalanceCents: result.freeBalanceCents },
                );
                setNotice('Saída registrada.');
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
            <DepositActionButton name="kind" value={MovementKind.Deposit} />
            <WithdrawalActionButton name="kind" value={MovementKind.Withdrawal} />
          </div>
        </form>
        {recentWithdrawals.length > 0 ? (
          <div className="grid gap-2 border-t border-border pt-3">
            <h3 className="text-sm font-semibold">Últimas saídas</h3>
            <ul className="grid gap-1 text-sm">
              {recentWithdrawals.map((withdrawal) => (
                <li key={withdrawal.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{formatCalendarDateBr(withdrawal.date)}</span>
                  <span className="tabular-nums">{money(withdrawal.amountCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
