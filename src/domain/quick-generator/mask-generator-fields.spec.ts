import { describe, expect, it } from 'vitest';
import { maskDueDay, maskInstallmentCount, maskMoneyField, maskMonthlyRate } from './mask-generator-fields';

describe('maskMoneyField', () => {
  it('formats each typed digit as reais', () => {
    expect(maskMoneyField('5')).toBe('0,05');
    expect(maskMoneyField('540')).toBe('5,40');
    expect(maskMoneyField('54000')).toBe('540,00');
    expect(maskMoneyField('540dddd')).toBe('5,40');
    expect(maskMoneyField('123456')).toBe('1.234,56');
  });

  it('limits the amount to 9 digits', () => {
    expect(maskMoneyField('12345678901')).toBe('1.234.567,89');
    expect(maskMoneyField('')).toBe('');
  });
});

describe('maskInstallmentCount', () => {
  it('keeps up to two digits and caps at 60', () => {
    expect(maskInstallmentCount('3dddddd')).toBe('3');
    expect(maskInstallmentCount('99')).toBe('60');
    expect(maskInstallmentCount('')).toBe('');
  });
});

describe('maskDueDay', () => {
  it('limits day to 31', () => {
    expect(maskDueDay('5')).toBe('5');
    expect(maskDueDay('99')).toBe('31');
    expect(maskDueDay('')).toBe('');
  });
});

describe('maskMonthlyRate', () => {
  it('keeps a short decimal rate', () => {
    expect(maskMonthlyRate('3abc')).toBe('3');
    expect(maskMonthlyRate('12,345')).toBe('12,34');
    expect(maskMonthlyRate('1000')).toBe('100');
  });
});
