import { describe, expect, it } from 'vitest';
import {
  HOLDING_REGISTRATION_ADMIN,
  HOLDING_REGISTRATION_DEMO,
  formatRegistrationCodeDisplay,
  holdingSystemRegistrationCode,
  isCompanyRegistrationNumber,
  isHoldingSystemRegistrationCode,
} from './company-registration-code';

describe('company-registration-code', () => {
  it('uses six-digit system codes', () => {
    expect(holdingSystemRegistrationCode('administration')).toBe(HOLDING_REGISTRATION_ADMIN);
    expect(holdingSystemRegistrationCode('demo')).toBe(HOLDING_REGISTRATION_DEMO);
    expect(HOLDING_REGISTRATION_ADMIN).toHaveLength(6);
  });

  it('displays system and company ids', () => {
    expect(formatRegistrationCodeDisplay('100042')).toBe('100042');
    expect(formatRegistrationCodeDisplay('001001')).toBe('001001');
    expect(formatRegistrationCodeDisplay('0')).toBe('000000');
    expect(formatRegistrationCodeDisplay(null)).toBe('—');
  });

  it('recognizes company vs system numbers', () => {
    expect(isCompanyRegistrationNumber('100001')).toBe(true);
    expect(isCompanyRegistrationNumber('001002')).toBe(false);
    expect(isHoldingSystemRegistrationCode('001001')).toBe(true);
    expect(isHoldingSystemRegistrationCode('100001')).toBe(false);
  });
});