import { describe, expect, it } from 'vitest';
import { computeSalarySplit, SALARY_SPLIT_STRATEGIES } from './salary-split-strategies';

describe('computeSalarySplit', () => {
  it('aplica percentuais da estratégia equilibrada', () => {
    expect(computeSalarySplit(4500, '50-30-20')).toEqual({
      essentials: 2250,
      leisure: 1350,
      savings: 900,
    });
  });

  it('não aceita renda negativa', () => {
    expect(computeSalarySplit(-100, '50-30-20')).toEqual({
      essentials: 0,
      leisure: 0,
      savings: 0,
    });
  });

  it('cobre todas as estratégias cadastradas', () => {
    for (const strategy of SALARY_SPLIT_STRATEGIES) {
      const result = computeSalarySplit(1000, strategy.id);
      const sum = result.essentials + result.leisure + result.savings;
      expect(sum).toBeCloseTo(1000, 5);
    }
  });
});