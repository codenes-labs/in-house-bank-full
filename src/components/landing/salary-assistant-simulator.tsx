import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  computeSalarySplit,
  formatLandingReais,
  SALARY_SPLIT_STRATEGIES,
  type SalarySplitStrategyId,
} from '../../domain/landing/salary-split-strategies';
import {
  PUBLIC_ASSISTANT_SIMULATOR_ACCOUNT_CTA,
  PUBLIC_ASSISTANT_SIMULATOR_FOOTNOTE,
} from '../../domain/navigation/public-tool-page-copy';
import { LandingReveal } from './landing-reveal';
import { SelectInput, TextInput, cx } from '../ui';

const DEFAULT_INCOME = '4500';

export function SalaryAssistantSimulator({ standalone = false }: { standalone?: boolean } = {}) {
  const [incomeRaw, setIncomeRaw] = useState(DEFAULT_INCOME);
  const [strategyId, setStrategyId] = useState<SalarySplitStrategyId>('50-30-20');

  const strategy = useMemo(
    () => SALARY_SPLIT_STRATEGIES.find((item) => item.id === strategyId) ?? SALARY_SPLIT_STRATEGIES[0],
    [strategyId],
  );

  const income = Math.max(0, Number.parseFloat(incomeRaw) || 0);
  const amounts = useMemo(() => computeSalarySplit(income, strategy.id), [income, strategy.id]);
  const yearlySavings = amounts.savings * 12;
  const { essentials, leisure, savings } = strategy.percents;

  const card = (
      <div className="w-full min-w-0 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-7">
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Simulador de Assistente</h2>
            <p className="text-xs text-muted-foreground">
              {standalone ? 'Ajuste renda e estratégia para ver a divisão sugerida' : 'Teste agora como organizar sua renda mensal'}
            </p>
          </div>
          <span className="rounded-lg bg-success-soft px-2.5 py-1 text-xs font-semibold text-status-paid">Tempo real</span>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4">
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
            Sua renda líquida mensal
            <div className="relative">
              <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                R$
              </span>
              <TextInput
                type="number"
                min={0}
                step={100}
                value={incomeRaw}
                onChange={(event) => setIncomeRaw(event.target.value)}
                className="pl-10 font-bold"
                aria-label="Renda líquida mensal"
              />
            </div>
          </label>

          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
            Objetivo do mês
            <SelectInput
              value={strategyId}
              onChange={(event) => setStrategyId(event.target.value as SalarySplitStrategyId)}
              aria-label="Objetivo do mês"
              className="max-w-full py-2.5 text-sm"
            >
              {SALARY_SPLIT_STRATEGIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </SelectInput>
          </label>
        </div>

        <div className="space-y-4">
          <SplitRow
            label="Contas & Essenciais"
            percent={essentials}
            value={amounts.essentials}
            barClass="bg-primary"
            dotClass="bg-primary"
          />
          <SplitRow
            label="Lazer & Livre"
            percent={leisure}
            value={amounts.leisure}
            barClass="bg-brand"
            dotClass="bg-brand"
          />
          <div className="rounded-xl border border-border bg-success-soft/40 p-3.5">
            <SplitRow
              label="Caixinhas & Patrimônio"
              percent={savings}
              value={amounts.savings}
              barClass="bg-status-paid"
              dotClass="bg-status-paid"
              valueClass="text-status-paid"
              percentClass="font-semibold text-status-paid"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Em 12 meses nas caixinhas, você acumula{' '}
              <strong className="text-foreground">{formatLandingReais(yearlySavings)}</strong> + rendimentos CDI.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-xs text-muted-foreground">{PUBLIC_ASSISTANT_SIMULATOR_FOOTNOTE}</span>
          <Link
            to="/entrar"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {PUBLIC_ASSISTANT_SIMULATOR_ACCOUNT_CTA}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
  );

  if (standalone) {
    return card;
  }

  return (
    <LandingReveal eager className="lg:col-span-6" style={{ transitionDelay: '120ms' }}>
      {card}
    </LandingReveal>
  );
}

function SplitRow({
  label,
  percent,
  value,
  barClass,
  dotClass,
  valueClass,
  percentClass,
}: {
  label: string;
  percent: number;
  value: number;
  barClass: string;
  dotClass: string;
  valueClass?: string;
  percentClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cx('size-2.5 shrink-0 rounded-full', dotClass)} aria-hidden />
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className={cx('text-xs text-muted-foreground', percentClass)}>({percent}%)</span>
        </div>
        <span className={cx('shrink-0 text-sm font-bold text-foreground', valueClass)}>{formatLandingReais(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cx('h-full rounded-full transition-[width] duration-500', barClass)}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${percent}%`}
        />
      </div>
    </div>
  );
}