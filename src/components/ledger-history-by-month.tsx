import { ExtratoKind } from '../domain/ledger/extrato-kind';
import type { LedgerLineMonthGroup } from '../domain/ledger/group-ledger-lines-by-month';
import { LedgerDirection } from '../domain/ledger/ledger-direction';
import type { LedgerLine } from '../domain/ledger/ledger-line';
import { FinanceMovementList, FinanceMovementRow, ledgerDirectionToFlow } from './finance-movement-row';

function ledgerFlowLabel(line: LedgerLine): string | undefined {
  if (line.kind === ExtratoKind.CashBox) {
    return line.direction === LedgerDirection.In ? 'Aporte' : 'Resgate';
  }
  if (line.kind === ExtratoKind.FreeBalance) {
    return line.direction === LedgerDirection.In ? 'Entrada' : 'Saída';
  }
  return undefined;
}

export function LedgerHistoryByMonth({ groups }: { groups: LedgerLineMonthGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>;
  }

  return (
    <div className="grid min-w-0 gap-4">
      {groups.map((group) => (
        <section key={group.yearMonth} className="grid min-w-0 gap-2">
          <h2 className="font-semibold">{group.label}</h2>
          <FinanceMovementList>
            {group.lines.map((line) => (
              <li key={line.id} className="min-w-0">
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
        </section>
      ))}
    </div>
  );
}
