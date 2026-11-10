import type { CashBoxMovementMonthGroup } from '../domain/cash-boxes/group-cash-box-movements-by-month';
import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import { FinanceMovementList, FinanceMovementRow } from './finance-movement-row';
import { money } from './ui';

function cashBoxMovementTitle(type: CashBoxMovementType, note?: string): string {
  const trimmed = note?.trim();
  if (trimmed) {
    return trimmed;
  }
  return type === CashBoxMovementType.Deposit ? 'Aporte na caixinha' : 'Resgate da caixinha';
}

export function CashBoxHistoryByMonth({ groups }: { groups: CashBoxMovementMonthGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>;
  }

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <section key={group.yearMonth} className="grid gap-2">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">{group.label}</h2>
            <span className="text-sm text-muted-foreground">
              {group.depositsTotalCents > 0
                ? `Entrou ${money(group.depositsTotalCents)}`
                : 'Sem aportes no mês'}
            </span>
          </header>
          <FinanceMovementList>
            {group.movements.map((movement) => {
              const isDeposit = movement.type === CashBoxMovementType.Deposit;
              return (
                <li key={movement.id}>
                  <FinanceMovementRow
                    title={cashBoxMovementTitle(movement.type, movement.note)}
                    date={movement.date}
                    flow={isDeposit ? 'in' : 'out'}
                    amountCents={movement.amountCents}
                    flowLabel={isDeposit ? 'Aporte' : 'Resgate'}
                  />
                </li>
              );
            })}
          </FinanceMovementList>
        </section>
      ))}
    </div>
  );
}
