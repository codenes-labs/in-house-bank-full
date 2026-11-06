import { formatCentsAsBrl } from '../money/brl-input';
import type { ReturnAmountSimulation } from './simulate-return-amounts';

export type SimulatorComparisonRowId = 'simple' | 'compound' | 'compound-installment';

export interface SimulatorComparisonRow {
  id: SimulatorComparisonRowId;
  label: string;
  amountBrl: string;
  applicable: boolean;
}

export function formatSimulatorComparison(
  simulation: ReturnAmountSimulation,
): SimulatorComparisonRow[] {
  return [
    {
      id: 'simple',
      label: 'Juros simples',
      amountBrl: formatCentsAsBrl(simulation.simpleReturnAmountCents),
      applicable: true,
    },
    {
      id: 'compound',
      label: 'Juros compostos (total)',
      amountBrl: formatCentsAsBrl(simulation.compoundReturnAmountCents),
      applicable: true,
    },
    {
      id: 'compound-installment',
      label: 'Parcela (Price)',
      amountBrl: formatCentsAsBrl(simulation.compoundInstallmentAmountCents),
      applicable: false,
    },
  ];
}
