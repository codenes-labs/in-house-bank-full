import { describe, expect, it } from 'vitest';
import { validateCashBoxInput } from './validate-cash-box';

describe('validateCashBoxInput', () => {
  it('accepts valid cash box data', () => {
    expect(
      validateCashBoxInput({
        name: 'Caixa Turbo',
        institution: 'Nubank',
        cdiPercent: 115,
        limitCents: 500_000,
        balanceCents: 0,
      }).valid,
    ).toBe(true);
  });

  it('rejects empty name', () => {
    const result = validateCashBoxInput({
      name: '',
      institution: 'Nubank',
      cdiPercent: 100,
      balanceCents: 0,
    });
    expect(result.valid).toBe(false);
  });
});
