import { Card, money } from './ui';
import type { InstallmentExtratoMetrics } from '../domain/installments/build-installment-extrato';

export function InstallmentExtratoSummary({ metrics }: { metrics: InstallmentExtratoMetrics }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card>
        <p className="text-sm text-muted-foreground">Pagas no período</p>
        <p className="text-2xl font-semibold tabular-nums">{metrics.paidCount}</p>
      </Card>
      <Card>
        <p className="text-sm text-muted-foreground">Recebido no período</p>
        <p className="text-2xl font-semibold tabular-nums">{money(metrics.receivedTotalCents)}</p>
      </Card>
      <Card>
        <p className="text-sm text-muted-foreground">Em atraso no período</p>
        <p className="text-2xl font-semibold tabular-nums">{metrics.overdueCount}</p>
      </Card>
    </div>
  );
}