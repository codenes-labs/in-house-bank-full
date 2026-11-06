import { describe, expect, it } from 'vitest';
import { isValidCnpj } from './validate-cnpj';

describe('isValidCnpj', () => {
  it('validates check digits and rejects known invalid patterns', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11111111111111')).toBe(false);
    expect(isValidCnpj('12345678000100')).toBe(false);
  });
});
