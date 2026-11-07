import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CashBox } from '../domain/models/cash-box';
import { Card, money } from './ui';

export function CashBoxListCard({
  cashBox,
  estimatedMonthlyYieldCents,
}: {
  cashBox: CashBox;
  estimatedMonthlyYieldCents: number;
}) {
  return (
    <Link to={`/caixinhas/${cashBox.id}`} className="block">
      <Card className="press flex items-center gap-3 transition-colors hover:border-primary/30">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{cashBox.name}</p>
          <p className="text-sm text-muted-foreground">
            Pode render {money(estimatedMonthlyYieldCents)} no mês
          </p>
        </div>
        <p className="shrink-0 text-lg font-semibold tabular-nums">{money(cashBox.balanceCents)}</p>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Card>
    </Link>
  );
}
