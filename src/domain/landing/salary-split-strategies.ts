export type SalarySplitStrategyId = '50-30-20' | '50-20-30' | '60-20-20';

export type SalarySplitPercents = {
  essentials: number;
  leisure: number;
  savings: number;
};

export type SalarySplitStrategy = {
  id: SalarySplitStrategyId;
  label: string;
  percents: SalarySplitPercents;
};

export const SALARY_SPLIT_STRATEGIES: readonly SalarySplitStrategy[] = [
  {
    id: '50-30-20',
    label: 'Equilibrado (50/30/20)',
    percents: { essentials: 50, leisure: 30, savings: 20 },
  },
  {
    id: '50-20-30',
    label: 'Foco em caixinhas (50/20/30)',
    percents: { essentials: 50, leisure: 20, savings: 30 },
  },
  {
    id: '60-20-20',
    label: 'Contas altas (60/20/20)',
    percents: { essentials: 60, leisure: 20, savings: 20 },
  },
] as const;

export type SalarySplitAmounts = SalarySplitPercents;

export function computeSalarySplit(monthlyIncomeReais: number, strategyId: SalarySplitStrategyId): SalarySplitAmounts {
  const income = Math.max(0, monthlyIncomeReais);
  const strategy = SALARY_SPLIT_STRATEGIES.find((item) => item.id === strategyId) ?? SALARY_SPLIT_STRATEGIES[0];
  const { essentials, leisure, savings } = strategy.percents;
  return {
    essentials: income * (essentials / 100),
    leisure: income * (leisure / 100),
    savings: income * (savings / 100),
  };
}

export function formatLandingReais(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}