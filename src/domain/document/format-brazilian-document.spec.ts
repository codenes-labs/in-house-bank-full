import { describe, expect, it } from 'vitest';
import {
  formatBrazilianDocumentDisplay,
  maskBrazilianDocumentInput,
  onlyDocumentDigits,
} from './format-brazilian-document';

describe('format-brazilian-document', () => {
  it('masks CPF while typing', () => {
    expect(maskBrazilianDocumentInput('11115111111')).toBe('111.151.111-11');
  });

  it('masks CNPJ while typing', () => {
    expect(maskBrazilianDocumentInput('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('stores digits only', () => {
    expect(onlyDocumentDigits('111.151.111-11')).toBe('11115111111');
  });

  it('formats stored value for display', () => {
    expect(formatBrazilianDocumentDisplay('11115111111222222')).toBe('11.115.111/1112-22');
    expect(onlyDocumentDigits('11115111111222222').length).toBe(14);
  });
});