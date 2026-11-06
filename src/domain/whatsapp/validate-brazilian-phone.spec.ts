import { describe, expect, it } from 'vitest';
import { maskBrazilianPhone, validateBrazilianPhone } from './validate-brazilian-phone';

describe('validateBrazilianPhone', () => {
  it('accepts a mobile number with a valid area code', () => {
    expect(validateBrazilianPhone('(11) 98765-4321')).toEqual({
      valid: true,
      nationalDigits: '11987654321',
    });
  });

  it('rejects an unknown area code', () => {
    const result = validateBrazilianPhone('10987654321');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('DDD inválido.');
  });
});

describe('maskBrazilianPhone', () => {
  it('formats eleven digits', () => {
    expect(maskBrazilianPhone('11987654321')).toBe('(11) 98765-4321');
  });
});
