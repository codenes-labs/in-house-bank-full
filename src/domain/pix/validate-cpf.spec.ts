import { describe, expect, it } from 'vitest';
import { isValidCpf } from './validate-cpf';

describe('isValidCpf', () => {
  it('validates check digits and rejects known invalid patterns', () => {
    expect(isValidCpf('39053344705')).toBe(true);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('12345678900')).toBe(false);
  });
});
