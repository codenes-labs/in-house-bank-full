import { describe, expect, it } from 'vitest';
import {
  HOLDING_REGISTRATION_ADMIN,
  formatRegistrationCodeDisplay,
  holdingSystemRegistrationCode,
  isCompanyRegistrationNumber,
} from './company-registration-code';

describe('company-registration-code', () => {
  it('uses numeric system codes', () => {
    expect(holdingSystemRegistrationCode('administration')).toBe(HOLDING_REGISTRATION_ADMIN);
    expect(holdingSystemRegistrationCode('demo')).toBe('1');
  });

  it('displays only digits', () => {
    expect(formatRegistrationCodeDisplay('100042')).toBe('100042');
    expect(formatRegistrationCodeDisplay('0')).toBe('0');
    expect(formatRegistrationCodeDisplay(null)).toBe('—');
  });

  it('recognizes company registration numbers', () => {
    expect(isCompanyRegistrationNumber('100001')).toBe(true);
    expect(isCompanyRegistrationNumber('0')).toBe(false);
  });
});