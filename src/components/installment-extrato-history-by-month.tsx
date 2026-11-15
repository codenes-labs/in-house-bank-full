import { Link } from 'react-router-dom';
import { InstallmentStatus } from '../domain/enums/installment-status';
import type { InstallmentExtratoMonthGroup } from '../domain/installments/build-installment-extrato';
import { formatInstallmentOrdinalPt } from '../domain/installments/format-installment-ordinal-pt';
import { installmentStatusLabel } from '../domain/installments/status-labels';
import { formatCalendarDateBr } from '../domain/pdf/format-calendar-date-br';
import { FinanceMovementList } from './finance-movement-row';
import { money, StatusPill } from './ui';

function statusTone(status: InstallmentStatus): 'paid' | 'overdue' | 'pending' {
  if (status === InstallmentStatus.Paid) {
    return 'paid';
  }
  if (status === InstallmentStatus.Overdue) {
    return 'overdue';
  }
  return 'pending';
}

export function InstallmentExtratoHistoryByMonth({ groups }: { groups: InstallmentExtratoMonthGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma parcela no período.</p>;
  }

  return (
    <div className="grid min-w-0 gap-4">
      {groups.map((group) => (
        <section key={group.yearMonth} className="grid min-w-0 gap-2">
          <h2 className="font-semibold">{group.label}</h2>
          <FinanceMovementList>
            {group.lines.map((line) => {
              const tone = statusTone(line.status);
              return (
                <li key={line.id} className="min-w-0">
                  <Link
                    to={`/parcelamentos/${line.planId}`}
                    className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-3 py-2.5 transition-colors hover:bg-muted/55 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-3"
                  >
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate text-sm font-medium leading-snug text-foreground">
                        {formatInstallmentOrdinalPt(line.installmentNumber)} · {line.borrowerName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Ref. {line.planReference}
                        <span className="mx-1.5 opacity-50">·</span>
                        Venc. {formatCalendarDateBr(line.dueDate)}
                      </p>
                    </div>
                    <span className="flex shrink-0 justify-end sm:justify-center">
                      <StatusPill label={installmentStatusLabel(line.status)} tone={tone} />
                    </span>
                    <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-primary sm:text-base">
                      {money(line.amountCents)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </FinanceMovementList>
        </section>
      ))}
    </div>
  );
}