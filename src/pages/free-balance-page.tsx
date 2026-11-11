import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/auth-context';
import { useBank } from '../components/bank-context';
import { LedgerHistoryByMonth } from '../components/ledger-history-by-month';
import { MaskedMoneyInput } from '../components/masked-inputs';
import { DepositActionButton, WithdrawalActionButton } from '../components/standard-action-buttons';
import { Card, money } from '../components/ui';
import { calendarDateWithinLastDays } from '../domain/calendar/calendar-date-within-last-days';
import { effectiveTodayForPresentation } from '../domain/demo/demo-presentation-reference-date';
import { applyFreeBalanceDeposit } from '../domain/finance/apply-free-balance-deposit';
import { applyFreeBalanceWithdrawal } from '../domain/finance/apply-free-balance-withdrawal';
import { milestonesOrDefault } from '../domain/finance/default-milestones';
import { createId } from '../domain/ids/create-id';
import { brlStringToCents } from '../domain/money/brl-input';
import { buildLedger, filterLedgerByExtratoKind } from '../domain/ledger/build-ledger';
import { ExtratoKind } from '../domain/ledger/extrato-kind';
import { groupLedgerLinesByMonth } from '../domain/ledger/group-ledger-lines-by-month';

const MovementKind = {
  Deposit: 'DEPOSIT',
  Withdrawal: 'WITHDRAWAL',
} as const;

const LAST_MOVEMENTS_DAYS = 30;

export function FreeBalancePage() {
  const auth = useAuth();
  const bank = useBank();
  const isDemo = auth.session?.user.isDemo ?? false;
  const [notice, setNotice] = useState<string | null>(null);
  const [amountFieldKey, setAmountFieldKey] = useState(0);
  const settings = {
    ...bank.snapshot.settings,
    milestonesCents: milestonesOrDefault(bank.snapshot.settings.milestonesCents),
  };
  const today = effectiveTodayForPresentation(isDemo);

  const historyGroups = useMemo(() => {
    const ledger = buildLedger({
      cashBoxes: bank.snapshot.cashBoxes,
      cashBoxMovements: bank.snapshot.cashBoxMovements,
      freeBalanceWithdrawals: bank.snapshot.freeBalanceWithdrawals,
      freeBalanceDeposits: bank.snapshot.freeBalanceDeposits,
    });
    let lines = filterLedgerByExtratoKind(ledger, ExtratoKind.FreeBalance);
    if (!isDemo) {
      lines = lines.filter((line) => calendarDateWithinLastDays(line.date, today, LAST_MOVEMENTS_DAYS));
    }
    return groupLedgerLinesByMonth(lines);
  }, [bank.snapshot, isDemo, today]);

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
                await bank.saveFreeBalanceDeposit(
                  {
                    id: createId(),
                    amountCents,
                    date: today,
                    recordedAt: new Date().toISOString(),
                  },
                  { ...bank.snapshot.settings, freeBalanceCents: result.freeBalanceCents },
                );
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
                    date: today,
                    recordedAt: new Date().toISOString(),
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
      </Card>
      <Card className="grid min-w-0 gap-3 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Histórico</h2>
          <p className="text-xs text-muted-foreground">
            {isDemo ? 'Movimentações de demonstração' : `Últimos ${LAST_MOVEMENTS_DAYS} dias`}
          </p>
        </div>
        {historyGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento nos últimos {LAST_MOVEMENTS_DAYS} dias.</p>
        ) : (
          <LedgerHistoryByMonth groups={historyGroups} />
        )}
      </Card>
    </div>
  );
}
