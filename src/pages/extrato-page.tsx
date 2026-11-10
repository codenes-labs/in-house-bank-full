import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBank } from '../components/bank-context';
import {
  FinanceMovementList,
  FinanceMovementRow,
  ledgerDirectionToFlow,
} from '../components/finance-movement-row';
import { EmptyState } from '../components/ui';
import { buildLedger, filterLedgerByExtratoKind } from '../domain/ledger/build-ledger';
import { EXTRATO_KIND_OPTIONS, ExtratoKind, parseExtratoKind } from '../domain/ledger/extrato-kind';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import type { LedgerLine } from '../domain/ledger/ledger-line';

function extratoKindLabel(kind: ExtratoKind): string {
  return EXTRATO_KIND_OPTIONS.find((option) => option.value === kind)?.label ?? 'Extrato';
}

function ledgerFlowLabel(line: LedgerLine): string | undefined {
  if (line.kind === ExtratoKind.CashBox) {
    return line.direction === LedgerDirection.In ? 'Aporte' : 'Resgate';
  }
  return undefined;
}

const KIND_HINTS: Record<ExtratoKind, string> = {
  [ExtratoKind.Payables]: 'Lançamentos de contas a pagar aparecerão aqui quando a área estiver ativa no Financeiro.',
  [ExtratoKind.Receivables]: 'Lançamentos de contas a receber aparecerão aqui quando a área estiver ativa no Financeiro.',
  [ExtratoKind.Installments]: 'Extrato de parcelas pagas e pendentes (SPEC-10: integração com buildLedger).',
  [ExtratoKind.CashBox]: 'Movimentos de aporte e resgate das caixinhas.',
  [ExtratoKind.FreeBalance]: 'Entradas e saídas registradas do saldo livre.',
};

export function ExtratoPage() {
  const bank = useBank();
  const [searchParams] = useSearchParams();
  const kind = parseExtratoKind(searchParams.get('tipo'));

  const lines = useMemo(() => {
    const ledger = buildLedger({
      cashBoxes: bank.snapshot.cashBoxes,
      cashBoxMovements: bank.snapshot.cashBoxMovements,
      freeBalanceWithdrawals: bank.snapshot.freeBalanceWithdrawals,
      freeBalanceDeposits: bank.snapshot.freeBalanceDeposits,
    });
    return filterLedgerByExtratoKind(ledger, kind);
  }, [bank.snapshot, kind]);

  const showLedger = kind === ExtratoKind.CashBox || kind === ExtratoKind.FreeBalance;

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold lg:hidden">{extratoKindLabel(kind)}</h1>
      {showLedger ? (
        lines.length === 0 ? (
          <EmptyState title="Nenhum lançamento" text={KIND_HINTS[kind]} />
        ) : (
          <FinanceMovementList>
            {lines.map((line) => (
              <li key={line.id}>
                <FinanceMovementRow
                  title={line.label}
                  date={line.date}
                  flow={ledgerDirectionToFlow(line.direction)}
                  amountCents={line.amountCents}
                  flowLabel={ledgerFlowLabel(line)}
                />
              </li>
            ))}
          </FinanceMovementList>
        )
      ) : (
        <EmptyState title="Extrato em desenvolvimento" text={KIND_HINTS[kind]} />
      )}
    </div>
  );
}
