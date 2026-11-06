import { describe, expect, it } from 'vitest';
import { PixKeyType } from '../enums/pix-key-type';
import { detectPixKeyType, validatePixKey } from './validate-pix-key';

describe('detectPixKeyType (RN-09)', () => {
  it('detects email, phone, random, CPF and CNPJ', () => {
    expect(detectPixKeyType('pagador@example.com')).toBe(PixKeyType.Email);
    expect(detectPixKeyType('+5511987654321')).toBe(PixKeyType.Phone);
    expect(detectPixKeyType('31b6c1ca-b977-42e8-9ae5-99a93ba06edb')).toBe(PixKeyType.Random);
    expect(detectPixKeyType('390.533.447-05')).toBe(PixKeyType.Cpf);
    expect(detectPixKeyType('11.222.333/0001-81')).toBe(PixKeyType.Cnpj);
  });

  it('returns null for unknown shapes', () => {
    expect(detectPixKeyType('')).toBeNull();
    expect(detectPixKeyType('not-a-key')).toBeNull();
  });
});

describe('validatePixKey (RN-09)', () => {
  it('accepts valid keys and normalizes them', () => {
    expect(validatePixKey('390.533.447-05')).toEqual({
      valid: true,
      type: PixKeyType.Cpf,
      normalizedKey: '39053344705',
    });

    expect(validatePixKey('11.222.333/0001-81')).toEqual({
      valid: true,
      type: PixKeyType.Cnpj,
      normalizedKey: '11222333000181',
    });

    expect(validatePixKey(' Pagador@Example.COM ')).toEqual({
      valid: true,
      type: PixKeyType.Email,
      normalizedKey: 'pagador@example.com',
    });

    expect(validatePixKey('+55 11 98765-4321')).toEqual({
      valid: true,
      type: PixKeyType.Phone,
      normalizedKey: '+5511987654321',
    });

    expect(validatePixKey('31B6C1CA-B977-42E8-9AE5-99A93BA06EDB')).toEqual({
      valid: true,
      type: PixKeyType.Random,
      normalizedKey: '31b6c1ca-b977-42e8-9ae5-99a93ba06edb',
    });
  });

  it('rejects invalid checksums and malformed values', () => {
    expect(validatePixKey('123.456.789-00').valid).toBe(false);
    expect(validatePixKey('11.111.111/1111-11').valid).toBe(false);
    expect(validatePixKey('invalid@').valid).toBe(false);
    expect(validatePixKey('+5511987').valid).toBe(false);
    expect(validatePixKey('not-a-uuid').valid).toBe(false);
  });
});
