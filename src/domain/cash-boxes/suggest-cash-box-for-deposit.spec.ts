import { describe, expect, it } from 'vitest';
import { suggestCashBoxForDeposit } from './suggest-cash-box-for-deposit';

describe('suggestCashBoxForDeposit', () => {
  const boxes = [
    {
      id: 'a',
      name: 'A',
      institution: 'Nubank',
      cdiPercent: 100,
      limitCents: 100_000,
      balanceCents: 90_000,
    },
    {
      id: 'b',
      name: 'B',
      institution: 'Inter',
      cdiPercent: 115,
      limitCents: 500_000,
      balanceCents: 100_000,
    },
  ];

  it('suggests highest CDI box with available limit', () => {
    const suggestion = suggestCashBoxForDeposit(boxes, 'a', 50_000);
    expect(suggestion?.id).toBe('b');
  });

  it('returns null when no box fits the deposit', () => {
    expect(suggestCashBoxForDeposit(boxes, 'a', 500_000)).toBeNull();
  });
});
