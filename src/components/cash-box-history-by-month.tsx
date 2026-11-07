import { CashBoxMovementType } from '../domain/enums/cash-box-movement-type';
import type { CashBoxMovementMonthGroup } from '../domain/cash-boxes/group-cash-box-movements-by-month';
import { money } from './ui';

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
          <ul className="grid gap-1 text-sm">
            {group.movements.map((movement) => (
              <li key={movement.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
                <span>
                  {movement.type === CashBoxMovementType.Deposit ? 'Aporte' : 'Resgate'} ·{' '}
                  {movement.date.split('-').reverse().join('/')}
                </span>
                <span className="font-semibold tabular-nums">{money(movement.amountCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
