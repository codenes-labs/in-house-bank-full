import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBank } from '../components/bank-context';
import { Card, EmptyState } from '../components/ui';
import { todayCalendarDate } from '../domain/calendar/today-calendar-date';
import { INSTALLMENT_PLAN_TYPE_LABELS } from '../domain/quick-generator/installment-plan-type-labels';
import { computeReports } from '../domain/reports/compute-reports';
import { formatCentsAsBrl } from '../domain/money/brl-input';

export function ReportsPage() {
  const bank = useBank();
  const reports = computeReports({
    plans: bank.snapshot.installmentPlans,
    installments: bank.snapshot.installments,
    settings: bank.snapshot.settings,
    cashBoxes: bank.snapshot.cashBoxes,
    cashBoxMovements: bank.snapshot.cashBoxMovements,
    today: todayCalendarDate(),
  });
  const cashFlow = reports.monthlyCashFlow.map((row) => ({
    month: row.month,
    Recebido: row.realizedInCents / 100,
    'A receber': row.expectedInCents / 100,
  }));
  const profit = reports.profitByType.map((row) => ({
    tipo: INSTALLMENT_PLAN_TYPE_LABELS[row.type],
    'Lucro previsto': row.expectedProfitCents / 100,
    'Lucro realizado': row.realizedProfitCents / 100,
  }));
  const patrimony = reports.patrimonyEvolution.map((point) => ({
    month: point.month,
    Patrimônio: point.patrimonyCents / 100,
  }));
  const empty = bank.snapshot.installmentPlans.length === 0 && bank.snapshot.cashBoxes.length === 0;

  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold">Relatórios</h1>
      {empty ? <EmptyState title="Sem dados ainda" text="Os gráficos aparecem quando houver parcelamentos ou caixinhas." /> : null}
      <ChartCard title="Recebido e a receber por mês">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cashFlow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCentsAsBrl(Math.round(Number(value) * 100))} />
            <Legend />
            <Bar dataKey="Recebido" fill="#0f766e" />
            <Bar dataKey="A receber" fill="#1e3a8a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Lucro por tipo de operação">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={profit}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tipo" />
            <YAxis />
            <Tooltip formatter={(value) => formatCentsAsBrl(Math.round(Number(value) * 100))} />
            <Legend />
            <Bar dataKey="Lucro previsto" fill="#1d4ed8" />
            <Bar dataKey="Lucro realizado" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Evolução do patrimônio">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={patrimony}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCentsAsBrl(Math.round(Number(value) * 100))} />
            <Line type="monotone" dataKey="Patrimônio" stroke="#0f766e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </Card>
  );
}
