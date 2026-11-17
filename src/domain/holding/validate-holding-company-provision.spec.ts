import { describe, expect, it } from 'vitest';
import { validateHoldingCompanyProvision } from './validate-holding-company-provision';

describe('validateHoldingCompanyProvision', () => {
  it('rejects short company name', () => {
    const result = validateHoldingCompanyProvision({
      companyName: 'A',
      email: 'a@b.com',
      password: 'senha123',
    });
    expect('ok' in result).toBe(false);
  });

  it('accepts valid payload', () => {
    const result = validateHoldingCompanyProvision({
      companyName: 'Loja Exemplo',
      email: 'loja@exemplo.com',
      password: 'senha123',
      city: 'Curitiba',
    });
    expect('ok' in result && result.ok).toBe(true);
    if ('ok' in result && result.ok) {
      expect(result.data.companyName).toBe('Loja Exemplo');
      expect(result.data.city).toBe('Curitiba');
    }
  });
});