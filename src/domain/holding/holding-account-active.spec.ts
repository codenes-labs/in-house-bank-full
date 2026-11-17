import { describe, expect, it } from 'vitest';
import { HoldingAccountProfile } from './holding-account-profile';
import { canToggleHoldingAccountActive, holdingAccountAccessStatus } from './holding-account-active';

describe('canToggleHoldingAccountActive', () => {
  it('allows company and demo', () => {
    expect(canToggleHoldingAccountActive(HoldingAccountProfile.Company)).toBe(true);
    expect(canToggleHoldingAccountActive(HoldingAccountProfile.Demo)).toBe(true);
  });

  it('blocks administration', () => {
    expect(canToggleHoldingAccountActive(HoldingAccountProfile.Administration)).toBe(false);
  });
});

describe('holdingAccountAccessStatus', () => {
  it('prioritizes inactive over password pending', () => {
    expect(holdingAccountAccessStatus(false, true)).toEqual({ label: 'Inativo', tone: 'overdue' });
    expect(holdingAccountAccessStatus(true, true)).toEqual({ label: 'Senha pendente', tone: 'pending' });
    expect(holdingAccountAccessStatus(true, false)).toEqual({ label: 'Ativo', tone: 'paid' });
  });
});