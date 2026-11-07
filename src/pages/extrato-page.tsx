import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBank } from '../components/bank-context';
import { Card, EmptyState, SelectInput, money } from '../components/ui';
import { buildLedger, filterLedgerByExtratoKind } from '../domain/ledger/build-ledger';
import { EXTRATO_KIND_OPTIONS, ExtratoKind, parseExtratoKind } from '../domain/ledger/extrato-kind';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';

const KIND_HINTS: Record<ExtratoKind, string> = {
  [ExtratoKind.Payables]: 'Lançamentos de contas a pagar aparecerão aqui quando a área estiver ativa no Financeiro.',
  [ExtratoKind.Receivables]: 'Lançamentos de contas a receber aparecerão aqui quando a área estiver ativa no Financeiro.',
  [ExtratoKind.Installments]: 'Extrato de parcelas pagas e pendentes (SPEC-10: integração com buildLedger).',
  [ExtratoKind.CashBox]: 'Movimentos de aporte e resgate das caixinhas.',
  [ExtratoKind.FreeBalance]: 'Saídas registradas do saldo livre.',
};

export function ExtratoPage() {
  const bank = useBank();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = parseExtratoKind(searchParams.get('tipo'));

  const lines = useMemo(() => {
    const ledger = buildLedger({
      cashBoxes: bank.snapshot.cashBoxes,
      cashBoxMovements: bank.snapshot.cashBoxMovements,
      freeBalanceWithdrawals: bank.snapshot.freeBalanceWithdrawals,
    });
    return filterLedgerByExtratoKind(ledger, kind);
  }, [bank.snapshot, kind]);

  const showLedger = kind === ExtratoKind.CashBox || kind === ExtratoKind.FreeBalance;

  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Tipo de extrato</span>
        <SelectInput
          value={kind}
          onChange={(event) => {
            const next = parseExtratoKind(event.target.value);
            setSearchParams(next === ExtratoKind.Installments ? {} : { tipo: next });
          }}
        >
          {EXTRATO_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </label>
      {showLedger ? (
        lines.length === 0 ? (
          <EmptyState title="Nenhum lançamento" text={KIND_HINTS[kind]} />
        ) : (
          <ul className="grid gap-2">
            {lines.map((line) => (
              <li key={line.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{line.label}</p>
                    <p className="text-sm text-muted-foreground">{formatCalendarDateBr(line.date)}</p>
                  </div>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      line.direction === LedgerDirection.Out ? 'text-accent' : 'text-primary'
                    }`}
                  >
                    {line.direction === LedgerDirection.Out ? '−' : '+'}
                    {money(line.amountCents)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : (
        <EmptyState title="Extrato em desenvolvimento" text={KIND_HINTS[kind]} />
      )}
    </div>
  );
}
