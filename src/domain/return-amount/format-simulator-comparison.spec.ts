import { describe, expect, it } from 'vitest';
import { formatSimulatorComparison } from './format-simulator-comparison';

describe('formatSimulatorComparison', () => {
  it('formats RN-06 reference values for display', () => {
    const rows = formatSimulatorComparison({
      simpleReturnAmountCents: 60_480,
      compoundReturnAmountCents: 58_108,
      compoundInstallmentAmountCents: 14_527,
    });

    expect(rows).toEqual([
      { id: 'simple', label: 'Juros simples', amountBrl: '604,80', applicable: true },
      {
        id: 'compound',
        label: 'Juros compostos (total)',
        amountBrl: '581,08',
        applicable: true,
      },
      {
        id: 'compound-installment',
        label: 'Parcela (Price)',
        amountBrl: '145,27',
        applicable: false,
      },
    ]);
  });
});
